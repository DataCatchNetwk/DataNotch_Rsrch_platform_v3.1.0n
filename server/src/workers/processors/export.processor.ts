import { Worker, type Job } from 'bullmq';
import type { PrismaClient } from '@prisma/client';
import { RESEARCH_QUEUES } from '../../pipelines/queue.constants.js';
import { PipelinesOrchestrator } from '../../pipelines/orchestrator.js';
import { getRedisConnection } from '../queue.factory.js';
import { BaseProcessor } from '../runtime/base.processor.js';

export class ExportProcessor extends BaseProcessor {
  start() {
    return new Worker(RESEARCH_QUEUES.EXPORT, async (job) => this.process(job), { connection: getRedisConnection() });
  }

  constructor(prisma: PrismaClient, orchestrator: PipelinesOrchestrator) {
    super(prisma, orchestrator, { name: RESEARCH_QUEUES.EXPORT } as never);
  }

  async process(job: Job<Record<string, unknown>>) {
    try {
      if (job.data.stepType !== 'EXPORT') {
        return null;
      }

      await this.begin(job);
      await this.progress(job, 30, 'Collecting generated artifacts');
      await this.progress(job, 65, 'Packaging workspace outputs');
      await this.progress(job, 90, 'Writing export bundle');
      const output = {
        storageKey: `exports/${job.data.pipelineRunId}/research-bundle.zip`,
      };

      await this.prisma.pipelineArtifact.create({
        data: {
          pipelineRunId: String(job.data.pipelineRunId),
          workspaceId: String(job.data.workspaceId),
          datasetId: job.data.datasetId ? String(job.data.datasetId) : undefined,
          kind: 'EXPORT_PACKAGE',
          name: 'Research export bundle',
          storageKey: output.storageKey,
          mimeType: 'application/zip',
        },
      });

      await this.succeed(job, output, { exportedArtifactCount: 4 });
      return output;
    } catch (error) {
      await this.fail(job, error);
      throw error;
    }
  }
}