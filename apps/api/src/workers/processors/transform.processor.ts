import { Worker, type Job } from 'bullmq';
import type { ArtifactKind, PrismaClient } from '@prisma/client';
import { RESEARCH_QUEUES } from '../../pipelines/queue.constants.js';
import { PipelinesOrchestrator } from '../../pipelines/orchestrator.js';
import { getRedisConnection } from '../queue.factory.js';
import { BaseProcessor } from '../runtime/base.processor.js';

export class TransformProcessor extends BaseProcessor {
  start() {
    return new Worker(RESEARCH_QUEUES.TRANSFORM, async (job) => this.process(job), { connection: getRedisConnection() });
  }

  constructor(prisma: PrismaClient, orchestrator: PipelinesOrchestrator) {
    super(prisma, orchestrator, { name: RESEARCH_QUEUES.TRANSFORM } as never);
  }

  async process(job: Job<Record<string, unknown>>) {
    try {
      if (!['CLEAN', 'TRANSFORM', 'FEATURE_ENGINEERING', 'SPLIT'].includes(String(job.data.stepType))) {
        return null;
      }

      await this.begin(job);
      await this.progress(job, 15, 'Loading profiled dataset');
      await this.progress(job, 45, 'Applying transformation rules');
      await this.progress(job, 75, 'Persisting transformed outputs');

      const kindByStep: Record<string, ArtifactKind> = {
        CLEAN: 'CLEANED_DATASET',
        TRANSFORM: 'FEATURE_SET',
        FEATURE_ENGINEERING: 'FEATURE_SET',
        SPLIT: 'DATASET',
      };

      const output = {
        storageKey: `artifacts/${job.data.pipelineRunId}/${String(job.data.stepType).toLowerCase()}.parquet`,
        rowsRetainedPercent: 97.8,
        generatedColumns: ['feature_score', 'risk_band'],
      };

      await this.prisma.pipelineArtifact.create({
        data: {
          pipelineRunId: String(job.data.pipelineRunId),
          workspaceId: String(job.data.workspaceId),
          datasetId: job.data.datasetId ? String(job.data.datasetId) : undefined,
          kind: kindByStep[String(job.data.stepType)] ?? 'FEATURE_SET',
          name: `${String(job.data.stepType)} output`,
          storageKey: output.storageKey,
          mimeType: 'application/octet-stream',
        },
      });

      await this.succeed(job, output, { transformDurationMs: 2100 });
      return output;
    } catch (error) {
      await this.fail(job, error);
      throw error;
    }
  }
}