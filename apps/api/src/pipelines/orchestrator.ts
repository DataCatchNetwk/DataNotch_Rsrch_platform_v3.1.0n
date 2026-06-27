import type { PrismaClient } from '@prisma/client';
import { createNotification } from '../services/notifications.service.js';
import { WorkersService } from '../workers/workers.service.js';
import { publishPipelineStreamEvent } from './event-bus.js';
import { emitPipelineMetrics, emitToPipelineRun } from '../realtime/notifications.gateway.js';

export class PipelinesOrchestrator {
  constructor(private readonly prisma: PrismaClient, private readonly workers: WorkersService) {}

  async startRun(runId: string) {
    const run = await this.prisma.pipelineRun.findUnique({
      where: { id: runId },
      include: { steps: { orderBy: { order: 'asc' } } },
    });

    if (!run) {
      return;
    }

    await this.prisma.pipelineRun.update({
      where: { id: runId },
      data: {
        status: 'RUNNING',
        startedAt: run.startedAt ?? new Date(),
        progressPercent: 0,
      },
    });

    await this.emit(runId, 'PIPELINE_STARTED', 'INFO', `Pipeline ${run.name} started`);
    await this.queueNextPendingStep(runId);
    await this.emitState(runId);
  }

  async queueNextPendingStep(runId: string) {
    const run = await this.prisma.pipelineRun.findUnique({
      where: { id: runId },
      include: { steps: { orderBy: { order: 'asc' } } },
    });

    if (!run || ['CANCELED', 'FAILED', 'SUCCEEDED'].includes(run.status)) {
      return;
    }

    const nextStep = run.steps.find((step) => step.status === 'PENDING');
    if (!nextStep) {
      await this.prisma.pipelineRun.update({
        where: { id: runId },
        data: {
          status: 'SUCCEEDED',
          completedAt: new Date(),
          progressPercent: 100,
        },
      });

      await this.emit(runId, 'PIPELINE_COMPLETED', 'INFO', 'Pipeline completed successfully');
      await createNotification({
        userId: run.triggeredById,
        workspaceId: run.workspaceId,
        type: 'REPORT_CREATED',
        title: 'Pipeline completed',
        description: `${run.name} completed and published artifacts.`,
        severity: 'SUCCESS',
        link: `/dashboard/workspaces/${run.workspaceId}/pipelines/${run.id}`,
      });
      await this.emitState(runId);
      return;
    }

    await this.prisma.pipelineStep.update({
      where: { id: nextStep.id },
      data: { status: 'QUEUED' },
    });

    await this.prisma.pipelineRun.update({
      where: { id: runId },
      data: { currentStepIndex: nextStep.order },
    });

    await this.emit(runId, 'STEP_QUEUED', 'INFO', `Queued step ${nextStep.order}: ${nextStep.name}`, {
      stepOrder: nextStep.order,
      stepType: nextStep.type,
    });

    try {
      await this.workers.enqueueForStep(runId, nextStep.id);
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Queue backend unavailable';

      await this.prisma.pipelineStep.update({
        where: { id: nextStep.id },
        data: {
          status: 'PENDING',
          failureReason: message,
        },
      });

      await this.prisma.pipelineRun.update({
        where: { id: runId },
        data: {
          status: 'QUEUED',
          failureReason: null,
        },
      });

      await this.emit(
        runId,
        'QUEUE_BACKEND_UNAVAILABLE',
        'WARN',
        'Pipeline execution is queued until the background queue backend becomes available. Historical pipeline data remains available from PostgreSQL.',
        {
          stepOrder: nextStep.order,
          stepType: nextStep.type,
          reason: message,
        },
      );

      await this.emitState(runId);
      return;
    }

    await this.emitState(runId);
  }

  async onStepStarted(runId: string, stepId: string) {
    const step = await this.prisma.pipelineStep.update({
      where: { id: stepId },
      data: {
        status: 'RUNNING',
        startedAt: new Date(),
      },
    });

    await this.emit(runId, 'STEP_STARTED', 'INFO', `Started step ${step.order}: ${step.name}`, {
      stepOrder: step.order,
      stepType: step.type,
    });
    await this.emitState(runId);
  }

  async onStepProgress(runId: string, stepId: string, progressPercent: number, message?: string, data?: unknown) {
    const step = await this.prisma.pipelineStep.findUnique({ where: { id: stepId } });
    if (!step) {
      return;
    }

    await this.prisma.pipelineStep.update({
      where: { id: stepId },
      data: { progressPercent },
    });

    const steps = await this.prisma.pipelineStep.findMany({
      where: { pipelineRunId: runId },
      orderBy: { order: 'asc' },
    });
    const aggregate = steps.reduce((sum, current) => sum + (current.id === stepId ? progressPercent : current.progressPercent), 0) / (steps.length || 1);

    await this.prisma.pipelineRun.update({
      where: { id: runId },
      data: { progressPercent: aggregate },
    });

    await this.emit(runId, 'STEP_PROGRESS', 'INFO', message ?? 'Progress update', {
      stepOrder: step.order,
      progressPercent,
      aggregateProgressPercent: aggregate,
      ...(typeof data === 'object' && data ? (data as Record<string, unknown>) : {}),
    });
    await this.emitState(runId);
  }

  async onStepSucceeded(runId: string, stepId: string, output?: unknown, metrics?: unknown) {
    const step = await this.prisma.pipelineStep.update({
      where: { id: stepId },
      data: {
        status: 'SUCCEEDED',
        progressPercent: 100,
        completedAt: new Date(),
        outputJson: output as never,
        metricsJson: metrics as never,
      },
    });

    await this.emit(runId, 'STEP_SUCCEEDED', 'INFO', `Completed step ${step.order}: ${step.name}`, {
      stepOrder: step.order,
      output,
      metrics,
    });

    await this.queueNextPendingStep(runId);
    await this.emitState(runId);
  }

  async onStepFailed(runId: string, stepId: string, reason: string, errorJson?: unknown) {
    const step = await this.prisma.pipelineStep.update({
      where: { id: stepId },
      data: {
        status: 'FAILED',
        failureReason: reason,
        completedAt: new Date(),
      },
    });

    const run = await this.prisma.pipelineRun.update({
      where: { id: runId },
      data: {
        status: 'FAILED',
        completedAt: new Date(),
        failureReason: reason,
      },
    });

    await this.emit(runId, 'STEP_FAILED', 'ERROR', `Failed step ${step.order}: ${step.name}`, {
      stepOrder: step.order,
      reason,
      errorJson,
    });

    await this.workers.enqueueDeadLetter({
      pipelineRunId: runId,
      pipelineStepId: stepId,
      stepType: step.type,
      errorMessage: reason,
      context: typeof errorJson === 'object' && errorJson ? (errorJson as Record<string, unknown>) : undefined,
    });

    await createNotification({
      userId: run.triggeredById,
      workspaceId: run.workspaceId,
      type: 'REPORT_CREATED',
      title: 'Pipeline failed',
      description: `${run.name} failed at step ${step.order}: ${step.name}.`,
      severity: 'WARNING',
      link: `/dashboard/workspaces/${run.workspaceId}/pipelines/${run.id}`,
    });

    await this.emitState(runId);
  }

  async emit(pipelineRunId: string, eventType: string, level: string, message: string, dataJson?: unknown) {
    const createdEvent = await this.prisma.pipelineEvent.create({
      data: {
        pipelineRunId,
        eventType,
        level,
        message,
        dataJson: dataJson as never,
        stepOrder:
          typeof dataJson === 'object' && dataJson && 'stepOrder' in (dataJson as Record<string, unknown>)
            ? Number((dataJson as Record<string, unknown>).stepOrder)
            : undefined,
      },
    });

    await publishPipelineStreamEvent({
      id: createdEvent.id,
      pipelineRunId: createdEvent.pipelineRunId,
      eventType: createdEvent.eventType,
      level: createdEvent.level,
      message: createdEvent.message,
      stepOrder: createdEvent.stepOrder ?? undefined,
      createdAt: createdEvent.createdAt,
      dataJson,
    });
  }

  private async emitState(runId: string) {
    const run = await this.prisma.pipelineRun.findUnique({
      where: { id: runId },
      include: {
        steps: { orderBy: { order: 'asc' } },
        artifacts: { orderBy: { createdAt: 'desc' }, take: 12 },
        events: { orderBy: { createdAt: 'desc' }, take: 80 },
      },
    });

    if (!run) {
      return;
    }

    emitToPipelineRun(run.id, run);

    const metrics = await this.prisma.pipelineRun.groupBy({
      by: ['status'],
      _count: { _all: true },
    });

    emitPipelineMetrics(
      metrics.reduce<Record<string, number>>((acc, item) => {
        acc[item.status] = item._count._all;
        return acc;
      }, {}),
    );
  }
}