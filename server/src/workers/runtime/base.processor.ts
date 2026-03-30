import type { Job, Queue } from 'bullmq';
import type { PrismaClient } from '@prisma/client';
import { PipelinesOrchestrator } from '../../pipelines/orchestrator.js';

export abstract class BaseProcessor<TPayload = Record<string, unknown>> {
  constructor(
    protected readonly prisma: PrismaClient,
    protected readonly orchestrator: PipelinesOrchestrator,
    protected readonly queue: Queue,
  ) {}

  protected async begin(job: Job<TPayload>) {
    const { pipelineRunId, pipelineStepId } = job.data as { pipelineRunId: string; pipelineStepId: string };
    await this.ensureRunIsActive(pipelineRunId);
    await this.prisma.workerJob.updateMany({
      where: { brokerJobId: job.id?.toString() },
      data: { status: 'ACTIVE', startedAt: new Date(), attempt: job.attemptsMade + 1 },
    });
    await this.orchestrator.onStepStarted(pipelineRunId, pipelineStepId);
  }

  protected async progress(job: Job<TPayload>, percent: number, message: string, data?: unknown) {
    const { pipelineRunId, pipelineStepId } = job.data as { pipelineRunId: string; pipelineStepId: string };

    await job.updateProgress(percent);
    await this.prisma.workerJob.updateMany({
      where: { brokerJobId: job.id?.toString() },
      data: { progressPercent: percent },
    });
    await this.orchestrator.onStepProgress(pipelineRunId, pipelineStepId, percent, message, data);
  }

  protected async succeed(job: Job<TPayload>, output?: unknown, metrics?: unknown) {
    const { pipelineRunId, pipelineStepId } = job.data as { pipelineRunId: string; pipelineStepId: string };

    await this.prisma.workerJob.updateMany({
      where: { brokerJobId: job.id?.toString() },
      data: {
        status: 'COMPLETED',
        completedAt: new Date(),
        progressPercent: 100,
        resultJson: output as never,
      },
    });
    await this.orchestrator.onStepSucceeded(pipelineRunId, pipelineStepId, output, metrics);
  }

  protected async fail(job: Job<TPayload>, error: unknown) {
    const { pipelineRunId, pipelineStepId } = job.data as { pipelineRunId: string; pipelineStepId: string };
    const reason = error instanceof Error ? error.message : 'Unknown worker failure';

    await this.prisma.workerJob.updateMany({
      where: { brokerJobId: job.id?.toString() },
      data: {
        status: 'FAILED',
        completedAt: new Date(),
        errorJson: {
          name: error instanceof Error ? error.name : 'Error',
          message: reason,
          stack: error instanceof Error ? error.stack : undefined,
        },
      },
    });
    await this.orchestrator.onStepFailed(pipelineRunId, pipelineStepId, reason, error);
  }

  private async ensureRunIsActive(runId: string) {
    const run = await this.prisma.pipelineRun.findUnique({ where: { id: runId } });
    if (!run || run.status === 'CANCELED') {
      throw new Error('Pipeline run is canceled');
    }
  }
}