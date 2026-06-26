import type { PrismaClient, PipelineStepType, WorkerJob } from '@prisma/client';
import { PipelinesOrchestrator } from '../pipelines/orchestrator.js';
import { EvaluateProcessor } from './processors/evaluate.processor.js';
import { ExportProcessor } from './processors/export.processor.js';
import { IngestProcessor } from './processors/ingest.processor.js';
import { PublishProcessor } from './processors/publish.processor.js';
import { ReportProcessor } from './processors/report.processor.js';
import { TrainProcessor } from './processors/train.processor.js';
import { TransformProcessor } from './processors/transform.processor.js';
import { WorkersService } from './workers.service.js';

type Listener = (...args: unknown[]) => void;

type LocalJob = {
  id: string;
  name: string;
  data: Record<string, unknown>;
  attemptsMade: number;
  updateProgress: (progress: number) => Promise<void>;
};

export class PostgresLocalWorkerRunner {
  private timer: NodeJS.Timeout | null = null;
  private busy = false;
  private listeners = new Map<string, Listener[]>();
  private readonly workersService: WorkersService;
  private readonly orchestrator: PipelinesOrchestrator;
  private readonly processors: {
    ingest: IngestProcessor;
    transform: TransformProcessor;
    train: TrainProcessor;
    evaluate: EvaluateProcessor;
    report: ReportProcessor;
    export: ExportProcessor;
    publish: PublishProcessor;
  };

  readonly name = 'postgres-local-worker';

  constructor(private readonly prisma: PrismaClient, private readonly intervalMs = Number(process.env.POSTGRES_WORKER_POLL_MS ?? 1500)) {
    this.workersService = new WorkersService(prisma);
    this.orchestrator = new PipelinesOrchestrator(prisma, this.workersService);
    this.processors = {
      ingest: new IngestProcessor(prisma, this.orchestrator),
      transform: new TransformProcessor(prisma, this.orchestrator),
      train: new TrainProcessor(prisma, this.orchestrator),
      evaluate: new EvaluateProcessor(prisma, this.orchestrator),
      report: new ReportProcessor(prisma, this.orchestrator),
      export: new ExportProcessor(prisma, this.orchestrator),
      publish: new PublishProcessor(prisma, this.orchestrator),
    };
  }

  start() {
    if (this.timer) return this;
    void this.drainOnce();
    this.timer = setInterval(() => void this.drainOnce(), Math.max(500, this.intervalMs));
    return this;
  }

  on(event: string, listener: Listener) {
    const listeners = this.listeners.get(event) ?? [];
    listeners.push(listener);
    this.listeners.set(event, listeners);
    return this;
  }

  async close() {
    if (this.timer) {
      clearInterval(this.timer);
      this.timer = null;
    }
  }

  private emit(event: string, ...args: unknown[]) {
    for (const listener of this.listeners.get(event) ?? []) {
      listener(...args);
    }
  }

  private async drainOnce() {
    if (this.busy) return;
    this.busy = true;

    try {
      let processed = 0;
      while (processed < 10) {
        const job = await this.claimNextJob();
        if (!job) break;
        await this.processJob(job);
        processed += 1;
      }
    } catch (error) {
      this.emit('error', error);
    } finally {
      this.busy = false;
    }
  }

  private async claimNextJob() {
    const candidate = await this.prisma.workerJob.findFirst({
      where: { status: 'QUEUED' },
      orderBy: { createdAt: 'asc' },
    });

    if (!candidate) return null;

    const claimed = await this.prisma.workerJob.updateMany({
      where: { id: candidate.id, status: 'QUEUED' },
      data: {
        status: 'ACTIVE',
        startedAt: new Date(),
        brokerJobId: candidate.brokerJobId ?? `pg:${candidate.id}`,
      },
    });

    if (claimed.count !== 1) return null;

    return this.prisma.workerJob.findUniqueOrThrow({ where: { id: candidate.id } });
  }

  private async processJob(workerJob: WorkerJob) {
    const payload = (workerJob.payloadJson ?? {}) as Record<string, unknown>;
    const stepType = String(payload.stepType ?? workerJob.workerType) as PipelineStepType;
    const localJob: LocalJob = {
      id: workerJob.brokerJobId ?? `pg:${workerJob.id}`,
      name: workerJob.jobName,
      data: payload,
      attemptsMade: workerJob.attempt,
      updateProgress: async (progress) => {
        await this.prisma.workerJob.update({
          where: { id: workerJob.id },
          data: { progressPercent: Number(progress) },
        });
      },
    };

    const processor = this.resolveProcessor(stepType);
    if (!processor) {
      throw new Error(`No PostgreSQL local processor registered for step type ${stepType}`);
    }

    await processor.process(localJob as never);
  }

  private resolveProcessor(stepType: PipelineStepType) {
    if (['INGEST', 'PROFILE', 'VALIDATE'].includes(stepType)) return this.processors.ingest;
    if (['CLEAN', 'TRANSFORM', 'FEATURE_ENGINEERING', 'SPLIT'].includes(stepType)) return this.processors.transform;
    if (stepType === 'TRAIN') return this.processors.train;
    if (['EVALUATE', 'EXPLAIN', 'CHART'].includes(stepType)) return this.processors.evaluate;
    if (stepType === 'REPORT') return this.processors.report;
    if (stepType === 'EXPORT') return this.processors.export;
    if (stepType === 'PUBLISH') return this.processors.publish;
    return null;
  }
}

export function startPostgresLocalWorker(prisma: PrismaClient) {
  return new PostgresLocalWorkerRunner(prisma).start();
}