import type { PipelineStepType, PrismaClient } from '@prisma/client';
import type { Queue } from 'bullmq';
import { HttpError } from '../utils/errors.js';
import { RESEARCH_QUEUES } from '../pipelines/queue.constants.js';
import { getQueueRegistry, isRedisReachable } from './queue.factory.js';

function resolveQueueName(stepType: PipelineStepType) {
  if (['INGEST', 'PROFILE', 'VALIDATE'].includes(stepType)) return RESEARCH_QUEUES.INGEST;
  if (['CLEAN', 'TRANSFORM', 'FEATURE_ENGINEERING', 'SPLIT'].includes(stepType)) return RESEARCH_QUEUES.TRANSFORM;
  if (stepType === 'TRAIN') return RESEARCH_QUEUES.TRAIN;
  if (['EVALUATE', 'EXPLAIN', 'CHART'].includes(stepType)) return RESEARCH_QUEUES.EVALUATE;
  if (stepType === 'REPORT') return RESEARCH_QUEUES.REPORT;
  if (stepType === 'EXPORT') return RESEARCH_QUEUES.EXPORT;
  if (stepType === 'PUBLISH') return RESEARCH_QUEUES.PUBLISH;
  return RESEARCH_QUEUES.INGEST;
}

export class WorkersService {
  private queues?: Record<string, Queue>;

  constructor(private readonly prisma: PrismaClient, queues?: Record<string, Queue>) {
    this.queues = queues;
  }

  async enqueueForStep(runId: string, stepId: string) {
    const redisAvailable = await isRedisReachable();
    const step = await this.prisma.pipelineStep.findUnique({
      where: { id: stepId },
      include: { pipelineRun: true },
    });

    if (!step) {
      throw new HttpError(500, 'Pipeline step not found');
    }

    const payload = {
      pipelineRunId: runId,
      pipelineStepId: stepId,
      workspaceId: step.pipelineRun.workspaceId,
      datasetId: step.pipelineRun.datasetId,
      requestId: step.pipelineRun.requestId,
      stepType: step.type,
      stepName: step.name,
      parameters: step.pipelineRun.parametersJson,
      config: step.configJson,
    };

    const jobName = `${step.type}:${step.id}`;
    const queueName = resolveQueueName(step.type);

    if (!redisAvailable) {
      const workerJob = await this.prisma.workerJob.create({
        data: {
          pipelineRunId: runId,
          pipelineStepId: stepId,
          queueName,
          jobName,
          workerType: step.workerType ?? step.type,
          brokerJobId: `pg:${step.id}`,
          payloadJson: payload,
          status: 'QUEUED',
        },
      });

      return { id: workerJob.brokerJobId ?? workerJob.id, name: jobName, data: payload };
    }

    const queue = this.resolveQueue(step.type);
    const brokerJob = await queue.add(jobName, payload, {
      attempts: step.maxRetries + 1,
      backoff: { type: 'exponential', delay: 3000 },
      removeOnComplete: 1000,
      removeOnFail: 1000,
    });

    await this.prisma.workerJob.create({
      data: {
        pipelineRunId: runId,
        pipelineStepId: stepId,
        queueName: queue.name,
        jobName,
        workerType: step.workerType ?? step.type,
        brokerJobId: brokerJob.id?.toString(),
        payloadJson: payload,
        status: 'QUEUED',
      },
    });

    return brokerJob;
  }

  async cancelRun(runId: string) {
    const redisAvailable = await isRedisReachable();
    const jobs = await this.prisma.workerJob.findMany({
      where: {
        pipelineRunId: runId,
        status: { in: ['QUEUED', 'ACTIVE', 'RETRYING'] },
      },
    });

    if (redisAvailable) {
      const queues = this.getQueues();
      await Promise.all(
        jobs.map(async (job) => {
          if (!job.brokerJobId) {
            return;
          }

          const queue = queues[job.queueName];
          if (!queue) {
            return;
          }

          const brokerJob = await queue.getJob(job.brokerJobId);
          if (brokerJob) {
            await brokerJob.remove().catch(() => undefined);
          }
        }),
      );
    }

    await this.prisma.workerJob.updateMany({
      where: { pipelineRunId: runId, status: { in: ['QUEUED', 'ACTIVE', 'RETRYING'] } },
      data: { status: 'CANCELED', completedAt: new Date() },
    });
  }

  async enqueueDeadLetter(payload: {
    pipelineRunId: string;
    pipelineStepId: string;
    stepType: PipelineStepType;
    errorMessage: string;
    context?: Record<string, unknown>;
  }) {
    const redisAvailable = await isRedisReachable();
    if (!redisAvailable) {
      return;
    }

    const queue = this.getQueues()[RESEARCH_QUEUES.DLQ];
    if (!queue) {
      return;
    }

    await queue.add(
      `dlq:${payload.pipelineRunId}:${payload.pipelineStepId}`,
      {
        ...payload,
        occurredAt: new Date().toISOString(),
      },
      {
        removeOnComplete: 1000,
        removeOnFail: 1000,
      },
    );
  }

  private resolveQueue(stepType: PipelineStepType) {
    const queues = this.getQueues();
    return queues[resolveQueueName(stepType)];
  }

  private getQueues() {
    if (!this.queues) {
      this.queues = getQueueRegistry();
    }

    return this.queues;
  }
}