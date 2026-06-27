import { Queue, Worker, Job } from 'bullmq';
import { Prisma, PrismaClient } from '@prisma/client';
import { getRedisConnection } from '../queue.factory.js';
import { RESEARCH_QUEUES } from '../../pipelines/queue.constants.js';

interface CohortBuildPayload {
  jobId: string;
  cohortId: string;
  datasetId: string;
}

interface CohortBuildResult {
  jobId: string;
  cohortId: string;
  datasetId: string;
  status: 'COMPLETED';
  completedAt: string;
  matchedCount: number;
}

function asObject(value: Prisma.JsonValue | null | undefined): Record<string, unknown> {
  if (!value || typeof value !== 'object' || Array.isArray(value)) {
    return {};
  }
  return value as Record<string, unknown>;
}

async function processCohortBuild(
  prisma: PrismaClient,
  payload: CohortBuildPayload,
  reportProgress: (value: number) => Promise<void> | void = () => undefined,
): Promise<CohortBuildResult> {
  const { cohortId, datasetId, jobId } = payload;

  const cohort = await prisma.cohortDefinition.findUnique({ where: { id: cohortId } });
  if (!cohort) {
    throw new Error('Cohort not found');
  }

  if (!cohort.sourceDatasetIds.includes(datasetId)) {
    throw new Error('Dataset is not configured as a source for this cohort');
  }

  await reportProgress(20);

  const dataset = await prisma.dataset.findUnique({
    where: { id: datasetId },
    select: { id: true, recordCount: true, previewRowsJson: true },
  });

  if (!dataset) {
    throw new Error('Dataset not found');
  }

  await reportProgress(60);

  const matchedCount = dataset.recordCount ?? (Array.isArray(dataset.previewRowsJson) ? dataset.previewRowsJson.length : 0);
  const completedAt = new Date().toISOString();

  const criteria = asObject(cohort.criteriaJson);
  await prisma.cohortDefinition.update({
    where: { id: cohortId },
    data: {
      criteriaJson: {
        ...criteria,
        __async: {
          ...(asObject(criteria.__async as Prisma.JsonValue | null | undefined)),
          cohortBuild: {
            jobId,
            datasetId,
            status: 'COMPLETED',
            matchedCount,
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
    cohortId,
    datasetId,
    status: 'COMPLETED',
    completedAt,
    matchedCount,
  };
}

export async function processCohortBuildWithoutQueue(prisma: PrismaClient, payload: CohortBuildPayload) {
  return processCohortBuild(prisma, payload);
}

export class CohortBuildProcessor {
  private queue: Queue;
  private worker: Worker;
  private readonly queueName = RESEARCH_QUEUES.COHORT_BUILD;

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

      const cohort = await this.prisma.cohortDefinition.findUnique({ where: { id: job.data.cohortId } });
      if (!cohort) {
        return;
      }

      const criteria = asObject(cohort.criteriaJson);
      await this.prisma.cohortDefinition.update({
        where: { id: job.data.cohortId },
        data: {
          criteriaJson: {
            ...criteria,
            __async: {
              ...(asObject(criteria.__async as Prisma.JsonValue | null | undefined)),
              cohortBuild: {
                jobId: String(job.id ?? job.data.jobId),
                datasetId: job.data.datasetId,
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

  async enqueueBuild(payload: CohortBuildPayload) {
    const job = await this.queue.add('build-cohort', payload, {
      jobId: payload.jobId,
      attempts: 3,
    });

    return String(job.id ?? payload.jobId);
  }

  private async process(job: Job<CohortBuildPayload>) {
    return processCohortBuild(this.prisma, job.data, (progress) => job.updateProgress(progress));
  }
}
