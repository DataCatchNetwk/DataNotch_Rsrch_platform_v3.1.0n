import type { PipelineStepType, PrismaClient } from '@prisma/client';
import type { Queue } from 'bullmq';
import { HttpError } from '../utils/errors.js';
import { RESEARCH_QUEUES } from '../pipelines/queue.constants.js';
import { getQueueRegistry, isRedisReachable } from './queue.factory.js';

export class WorkersService {
  private queues?: Record<string, Queue>;

  constructor(private readonly prisma: PrismaClient, queues?: Record<string, Queue>) {
    this.queues = queues;
  }

  async enqueueForStep(runId: string, stepId: string) {
    const redisAvailable = await isRedisReachable();
    if (!redisAvailable) {
      throw new HttpError(503, 'Queue backend unavailable in the local workspace. Pipeline history remains available from PostgreSQL.');
    }

    const step = await this.prisma.pipelineStep.findUnique({
      where: { id: stepId },
      include: { pipelineRun: true },
    });

    if (!step) {
      throw new HttpError(500, 'Pipeline step not found');
    }

    const queue = this.resolveQueue(step.type);
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

    const brokerJob = await queue.add(`${step.type}:${step.id}`, payload, {
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
        jobName: `${step.type}:${step.id}`,
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
    if (['INGEST', 'PROFILE', 'VALIDATE'].includes(stepType)) return queues[RESEARCH_QUEUES.INGEST];
    if (['CLEAN', 'TRANSFORM', 'FEATURE_ENGINEERING', 'SPLIT'].includes(stepType)) return queues[RESEARCH_QUEUES.TRANSFORM];
    if (stepType === 'TRAIN') return queues[RESEARCH_QUEUES.TRAIN];
    if (['EVALUATE', 'EXPLAIN', 'CHART'].includes(stepType)) return queues[RESEARCH_QUEUES.EVALUATE];
    if (stepType === 'REPORT') return queues[RESEARCH_QUEUES.REPORT];
    if (stepType === 'EXPORT') return queues[RESEARCH_QUEUES.EXPORT];
    if (stepType === 'PUBLISH') return queues[RESEARCH_QUEUES.PUBLISH];
    return queues[RESEARCH_QUEUES.INGEST];
  }

  private getQueues() {
    if (!this.queues) {
      this.queues = getQueueRegistry();
    }

    return this.queues;
  }
}