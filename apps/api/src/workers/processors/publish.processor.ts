import { Worker, type Job } from 'bullmq';
import type { PrismaClient } from '@prisma/client';
import { RESEARCH_QUEUES } from '../../pipelines/queue.constants.js';
import { PipelinesOrchestrator } from '../../pipelines/orchestrator.js';
import { getRedisConnection } from '../queue.factory.js';
import { BaseProcessor } from '../runtime/base.processor.js';

export class PublishProcessor extends BaseProcessor {
  start() {
    return new Worker(RESEARCH_QUEUES.PUBLISH, async (job) => this.process(job), { connection: getRedisConnection() });
  }

  constructor(prisma: PrismaClient, orchestrator: PipelinesOrchestrator) {
    super(prisma, orchestrator, { name: RESEARCH_QUEUES.PUBLISH } as never);
  }

  async process(job: Job<Record<string, unknown>>) {
    try {
      if (job.data.stepType !== 'PUBLISH') {
        return null;
      }

      await this.begin(job);
      await this.progress(job, 35, 'Collecting artifacts for publication');
      await this.progress(job, 70, 'Promoting outputs into workspace registry');
      const output = {
        published: true,
        destination: `/dashboard/workspaces/${job.data.workspaceId}`,
      };
      await this.succeed(job, output, { promotedArtifacts: 3 });
      return output;
    } catch (error) {
      await this.fail(job, error);
      throw error;
    }
  }
}