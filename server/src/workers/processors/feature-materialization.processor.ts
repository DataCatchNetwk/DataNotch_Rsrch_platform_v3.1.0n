import { Queue, Worker, Job } from 'bullmq';
import { Prisma, PrismaClient } from '@prisma/client';
import { getRedisConnection } from '../queue.factory.js';
import { RESEARCH_QUEUES } from '../../pipelines/queue.constants.js';

interface FeatureMaterializationPayload {
  jobId: string;
  featureSetId: string;
  cohortId: string;
}

interface FeatureMaterializationResult {
  jobId: string;
  featureSetId: string;
  cohortId: string;
  status: 'COMPLETED';
  completedAt: string;
  generatedFeatures: number;
}

function asObject(value: Prisma.JsonValue | null | undefined): Record<string, unknown> {
  if (!value || typeof value !== 'object' || Array.isArray(value)) {
    return {};
  }
  return value as Record<string, unknown>;
}

async function processFeatureMaterialization(
  prisma: PrismaClient,
  payload: FeatureMaterializationPayload,
  reportProgress: (value: number) => Promise<void> | void = () => undefined,
): Promise<FeatureMaterializationResult> {
  const { featureSetId, cohortId, jobId } = payload;

  const featureSet = await prisma.featureSet.findUnique({ where: { id: featureSetId } });
  if (!featureSet) {
    throw new Error('Feature set not found');
  }

  const cohort = await prisma.cohortDefinition.findUnique({
    where: { id: cohortId },
    select: { id: true, sourceDatasetIds: true },
  });

  if (!cohort) {
    throw new Error('Cohort not found');
  }

  await reportProgress(30);

  const recipe = asObject(featureSet.recipeJson);
  const generatedFeatures = Array.isArray(recipe.features) ? recipe.features.length : 0;
  const completedAt = new Date().toISOString();

  const validation = asObject(featureSet.validationJson);
  await prisma.featureSet.update({
    where: { id: featureSetId },
    data: {
      validationJson: {
        ...validation,
        __async: {
          ...(asObject(validation.__async as Prisma.JsonValue | null | undefined)),
          materialization: {
            jobId,
            cohortId,
            status: 'COMPLETED',
            generatedFeatures,
            sourceDatasetCount: cohort.sourceDatasetIds.length,
            completedAt,
          },
        },
      } as Prisma.InputJsonValue,
      version: { increment: 1 },
    },
  });

  await reportProgress(100);

  return {
    jobId,
    featureSetId,
    cohortId,
    status: 'COMPLETED',
    completedAt,
    generatedFeatures,
  };
}

export async function processFeatureMaterializationWithoutQueue(prisma: PrismaClient, payload: FeatureMaterializationPayload) {
  return processFeatureMaterialization(prisma, payload);
}

export class FeatureMaterializationProcessor {
  private queue: Queue;
  private worker: Worker;
  private readonly queueName = RESEARCH_QUEUES.FEATURE_MATERIALIZE;

  constructor(private prisma: PrismaClient) {
    const redisConnection = getRedisConnection();

    this.queue = new Queue(this.queueName, {
      connection: redisConnection,
      defaultJobOptions: {
        attempts: 3,
        backoff: { type: 'exponential', delay: 2000 },
        removeOnComplete: 24 * 60 * 60,
        removeOnFail: 7 * 24 * 60 * 60,
      },
    });

    this.worker = new Worker(this.queueName, this.process.bind(this), {
      connection: redisConnection,
      concurrency: 2,
    });

    this.worker.on('failed', async (job, error) => {
      if (!job) {
        return;
      }

      const featureSet = await this.prisma.featureSet.findUnique({ where: { id: job.data.featureSetId } });
      if (!featureSet) {
        return;
      }

      const validation = asObject(featureSet.validationJson);
      await this.prisma.featureSet.update({
        where: { id: job.data.featureSetId },
        data: {
          validationJson: {
            ...validation,
            __async: {
              ...(asObject(validation.__async as Prisma.JsonValue | null | undefined)),
              materialization: {
                jobId: String(job.id ?? job.data.jobId),
                cohortId: job.data.cohortId,
                status: 'FAILED',
                errorMessage: error.message,
                completedAt: new Date().toISOString(),
              },
            },
          } as Prisma.InputJsonValue,
        },
      });
    });
  }

  start() {
    return this.worker;
  }

  async enqueueMaterialization(payload: FeatureMaterializationPayload) {
    const job = await this.queue.add('materialize-features', payload, {
      jobId: payload.jobId,
      attempts: 3,
    });

    return String(job.id ?? payload.jobId);
  }

  private async process(job: Job<FeatureMaterializationPayload>) {
    return processFeatureMaterialization(this.prisma, job.data, (progress) => job.updateProgress(progress));
  }
}
