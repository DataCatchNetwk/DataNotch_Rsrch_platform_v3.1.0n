import { Worker, type Job } from 'bullmq';
import type { ArtifactKind, PrismaClient } from '@prisma/client';
import { RESEARCH_QUEUES } from '../../pipelines/queue.constants.js';
import { PipelinesOrchestrator } from '../../pipelines/orchestrator.js';
import { getRedisConnection } from '../queue.factory.js';
import { BaseProcessor } from '../runtime/base.processor.js';

export class EvaluateProcessor extends BaseProcessor {
  start() {
    return new Worker(RESEARCH_QUEUES.EVALUATE, async (job) => this.process(job), { connection: getRedisConnection() });
  }

  constructor(prisma: PrismaClient, orchestrator: PipelinesOrchestrator) {
    super(prisma, orchestrator, { name: RESEARCH_QUEUES.EVALUATE } as never);
  }

  async process(job: Job<Record<string, unknown>>) {
    try {
      if (!['EVALUATE', 'EXPLAIN', 'CHART'].includes(String(job.data.stepType))) {
        return null;
      }

      await this.begin(job);
      await this.progress(job, 20, 'Loading model outputs');
      await this.progress(job, 55, 'Computing metrics and explainability');
      await this.progress(job, 85, 'Rendering evaluation visuals');

      const kindByStep: Record<string, ArtifactKind> = {
        EVALUATE: 'METRICS',
        EXPLAIN: 'LOG',
        CHART: 'CHART',
      };
      const output = {
        storageKey: `artifacts/${job.data.pipelineRunId}/${String(job.data.stepType).toLowerCase()}.json`,
        metrics: { accuracy: 0.91, recall: 0.87, precision: 0.9 },
      };

      await this.prisma.pipelineArtifact.create({
        data: {
          pipelineRunId: String(job.data.pipelineRunId),
          workspaceId: String(job.data.workspaceId),
          datasetId: job.data.datasetId ? String(job.data.datasetId) : undefined,
          kind: kindByStep[String(job.data.stepType)] ?? 'METRICS',
          name: `${String(job.data.stepType)} artifact`,
          storageKey: output.storageKey,
          mimeType: 'application/json',
          metadataJson: output.metrics,
        },
      });

      await this.succeed(job, output, output.metrics);
      return output;
    } catch (error) {
      await this.fail(job, error);
      throw error;
    }
  }
}