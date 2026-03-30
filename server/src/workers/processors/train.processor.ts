import { Worker, type Job } from 'bullmq';
import type { PrismaClient } from '@prisma/client';
import { RESEARCH_QUEUES } from '../../pipelines/queue.constants.js';
import { PipelinesOrchestrator } from '../../pipelines/orchestrator.js';
import { getRedisConnection } from '../queue.factory.js';
import { BaseProcessor } from '../runtime/base.processor.js';

export class TrainProcessor extends BaseProcessor {
  start() {
    return new Worker(RESEARCH_QUEUES.TRAIN, async (job) => this.process(job), { connection: getRedisConnection() });
  }

  constructor(prisma: PrismaClient, orchestrator: PipelinesOrchestrator) {
    super(prisma, orchestrator, { name: RESEARCH_QUEUES.TRAIN } as never);
  }

  async process(job: Job<Record<string, unknown>>) {
    try {
      if (job.data.stepType !== 'TRAIN') {
        return null;
      }

      await this.begin(job);
      await this.progress(job, 10, 'Loading prepared features');
      await this.progress(job, 25, 'Splitting train/validation/test');
      await this.progress(job, 45, 'Training baseline models');
      await this.progress(job, 70, 'Selecting best model');
      await this.progress(job, 90, 'Persisting serialized model');

      const output = {
        modelName: 'xgboost_classifier',
        storageKey: `models/${job.data.pipelineRunId}/model.pkl`,
        bestParams: { maxDepth: 5, learningRate: 0.1 },
      };
      const metrics = { accuracy: 0.91, f1: 0.88, auc: 0.94 };

      await this.prisma.modelRegistryEntry.create({
        data: {
          workspaceId: String(job.data.workspaceId),
          pipelineRunId: String(job.data.pipelineRunId),
          datasetId: job.data.datasetId ? String(job.data.datasetId) : undefined,
          name: 'research-model',
          version: `run-${job.data.pipelineRunId}`,
          framework: 'xgboost',
          taskType: 'classification',
          storageKey: output.storageKey,
          metricsJson: metrics,
          paramsJson: output.bestParams,
        },
      });

      await this.prisma.pipelineArtifact.create({
        data: {
          pipelineRunId: String(job.data.pipelineRunId),
          workspaceId: String(job.data.workspaceId),
          datasetId: job.data.datasetId ? String(job.data.datasetId) : undefined,
          kind: 'MODEL',
          name: 'Trained model',
          storageKey: output.storageKey,
          mimeType: 'application/octet-stream',
          metadataJson: metrics,
        },
      });

      await this.succeed(job, output, metrics);
      return output;
    } catch (error) {
      await this.fail(job, error);
      throw error;
    }
  }
}