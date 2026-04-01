import { Queue, Worker, Job } from 'bullmq';
import { Prisma, PrismaClient } from '@prisma/client';
import { getRedisConnection } from '../queue.factory.js';
import { RESEARCH_QUEUES } from '../../pipelines/queue.constants.js';

interface PullJobPayload {
  pullRequestId: string;
  datasetId: string;
  workspaceId: string;
  userId: string;
  mode: 'COPY' | 'VIRTUAL_VIEW';
  rowLimit?: number;
  selectedFields?: string[];
  filterJson?: Record<string, any>;
}

interface PullJobResult {
  pullRequestId: string;
  success: boolean;
  copiedDatasetId?: string;
  rowCount?: number;
  completedAt: Date;
  error?: string;
}

type ProgressReporter = (value: number) => Promise<void> | void;

function toInputJsonValue(
  value: Prisma.JsonValue | null | undefined,
): Prisma.InputJsonValue | Prisma.NullableJsonNullValueInput | undefined {
  if (value === undefined) {
    return undefined;
  }

  if (value === null) {
    return Prisma.JsonNull;
  }

  return value as Prisma.InputJsonValue;
}

function asObject(value: Prisma.JsonValue | null | undefined): Record<string, unknown> {
  if (!value || typeof value !== 'object' || Array.isArray(value)) {
    return {};
  }

  return value as Record<string, unknown>;
}

async function processPullRequest(
  prisma: PrismaClient,
  payload: PullJobPayload,
  reportProgress: ProgressReporter = () => undefined,
): Promise<PullJobResult> {
  const { pullRequestId, datasetId, workspaceId, userId, mode, rowLimit, selectedFields, filterJson } = payload;

  console.log(`[PullJobProcessor] Processing pull job ${pullRequestId} (${mode})`);

  try {
    await prisma.datasetPullRequest.update({
      where: { id: pullRequestId },
      data: { status: 'RUNNING' },
    });

    await reportProgress(10);

    const sourceDataset = await prisma.dataset.findUnique({
      where: { id: datasetId },
    });

    if (!sourceDataset) {
      throw new Error(`Dataset ${datasetId} not found`);
    }

    await reportProgress(20);

    let copiedDatasetId: string | undefined;
    let rowCount = 0;

    if (mode === 'COPY') {
      const copiedDataset = await prisma.dataset.create({
        data: {
          name: `${sourceDataset.name} (Copy)`,
          description: sourceDataset.description,
          workspaceId,
          createdById: userId,
          visibility: 'WORKSPACE',
          domain: sourceDataset.domain,
          storagePath: sourceDataset.storagePath,
          mimeType: sourceDataset.mimeType,
          sizeBytes: sourceDataset.sizeBytes,
          recordCount: sourceDataset.recordCount,
          columnCount: sourceDataset.columnCount,
          tags: sourceDataset.tags,
          schemaJson: toInputJsonValue(sourceDataset.schemaJson),
          previewRowsJson: toInputJsonValue(sourceDataset.previewRowsJson),
          metadataJson: {
            ...asObject(sourceDataset.metadataJson),
            sourceDatasetId: datasetId,
            copiedAt: new Date().toISOString(),
            pullMode: 'COPY',
            rowLimit,
            selectedFields,
            filter: filterJson,
          },
        },
      });

      copiedDatasetId = copiedDataset.id;

      rowCount = Array.isArray(sourceDataset.previewRowsJson)
        ? Math.min((sourceDataset.previewRowsJson as any[]).length, rowLimit || 10000)
        : 0;

      await reportProgress(70);
    } else {
      const virtualDataset = await prisma.dataset.create({
        data: {
          name: `${sourceDataset.name} (Virtual View)`,
          description: sourceDataset.description,
          workspaceId,
          createdById: userId,
          visibility: 'WORKSPACE',
          domain: sourceDataset.domain,
          storagePath: sourceDataset.storagePath,
          mimeType: sourceDataset.mimeType,
          sizeBytes: sourceDataset.sizeBytes,
          recordCount: sourceDataset.recordCount,
          columnCount: sourceDataset.columnCount,
          tags: sourceDataset.tags,
          schemaJson: toInputJsonValue(sourceDataset.schemaJson),
          metadataJson: {
            ...asObject(sourceDataset.metadataJson),
            sourceDatasetId: datasetId,
            linkedAt: new Date().toISOString(),
            pullMode: 'VIRTUAL_VIEW',
            isVirtualReference: true,
            rowLimit,
            selectedFields,
            filter: filterJson,
          },
        },
      });

      copiedDatasetId = virtualDataset.id;
      rowCount = 0;

      await reportProgress(70);
    }

    await reportProgress(85);

    await prisma.datasetAccessLog.create({
      data: {
        datasetId,
        userId,
        action: 'PULL_REQUESTED',
        metadataJson: {
          pullRequestId,
          targetWorkspaceId: workspaceId,
          mode,
          rowLimit,
          copiedDatasetId,
          completedAt: new Date().toISOString(),
        },
      },
    });

    await reportProgress(90);

    const completedAt = new Date();
    await prisma.datasetPullRequest.update({
      where: { id: pullRequestId },
      data: {
        status: 'COMPLETED',
        completedAt,
        queryJson: {
          mode,
          rowLimit,
          selectedFields,
          filter: filterJson,
          copiedDatasetId,
          rowCount,
        },
      },
    });

    await reportProgress(100);

    console.log(`[PullJobProcessor] Pull job ${pullRequestId} completed successfully`);

    return {
      pullRequestId,
      success: true,
      copiedDatasetId,
      rowCount,
      completedAt,
    };
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    console.error(`[PullJobProcessor] Pull job ${pullRequestId} failed:`, error);

    await prisma.datasetPullRequest.update({
      where: { id: pullRequestId },
      data: {
        status: 'FAILED',
        errorMessage,
        completedAt: new Date(),
      },
    });

    throw error;
  }
}

export async function processPullJobWithoutQueue(prisma: PrismaClient, payload: PullJobPayload) {
  return processPullRequest(prisma, payload);
}

export class PullJobProcessor {
  private queue: Queue;
  private worker: Worker;
  private readonly queueName = RESEARCH_QUEUES.PULL_JOB;

  constructor(private prisma: PrismaClient) {
    const redisConnection = getRedisConnection();

    this.queue = new Queue(this.queueName, {
      connection: redisConnection,
      defaultJobOptions: {
        attempts: 3,
        backoff: {
          type: 'exponential',
          delay: 3000,
        },
        removeOnComplete: 24 * 60 * 60, // Keep for 24 hours for audit
        removeOnFail: 7 * 24 * 60 * 60, // Keep failures for 7 days
      },
    });

    this.worker = new Worker(this.queueName, this.processPullJob.bind(this), {
      connection: redisConnection,
      concurrency: 3, // Process 3 pull jobs concurrently
    });

    this.setupWorkerEventHandlers();
  }

  /**
   * Start the processor and return the worker instance
   */
  start() {
    console.log(`[PullJobProcessor] Started processing queue: ${this.queueName}`);
    return this.worker;
  }

  /**
   * Enqueue a pull job for async processing
   */
  async enqueuePullJob(payload: PullJobPayload): Promise<string> {
    const job = await this.queue.add(
      'pull-dataset',
      payload,
      {
        jobId: payload.pullRequestId,
        attempts: 3,
      }
    );

    console.log(`[PullJobProcessor] Enqueued pull job ${job.id} for dataset ${payload.datasetId}`);
    return job.id ?? payload.pullRequestId;
  }

  /**
   * Main processor function - executed by the worker
   */
  private async processPullJob(job: Job<PullJobPayload>): Promise<PullJobResult> {
    return processPullRequest(this.prisma, job.data, (value) => job.updateProgress(value));
  }

  /**
   * Setup event handlers for the worker
   */
  private setupWorkerEventHandlers() {
    this.worker.on('completed', (job) => {
      console.log(`[PullJobProcessor] Job ${job.id} completed using ${job.attemptsMade} attempts`);
    });

    this.worker.on('failed', (job, error) => {
      if (job) {
        console.error(
          `[PullJobProcessor] Job ${job.id} failed after ${job.attemptsMade} attempts:`,
          error.message
        );
      }
    });

    this.worker.on('error', (error) => {
      console.error(`[PullJobProcessor] Worker error:`, error);
    });
  }

  /**
   * Get job status
   */
  async getJobStatus(jobId: string): Promise<Job<PullJobPayload> | null> {
    const job = await this.queue.getJob(jobId);
    return job ?? null;
  }

  /**
   * Clean up resources
   */
  async cleanup() {
    await this.worker.close();
    await this.queue.close();
  }
}
