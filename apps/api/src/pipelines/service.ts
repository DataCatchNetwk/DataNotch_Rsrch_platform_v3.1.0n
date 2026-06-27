import type { PipelineStepType, PrismaClient } from '@prisma/client';
import { HttpError } from '../utils/errors.js';
import { assertWorkspaceAction } from '../services/workspace-access.service.js';
import { WorkspaceAction } from '../services/workspace-permissions.js';
import { DEFAULT_RESEARCH_PIPELINE } from './pipeline.templates.js';
import { PipelinesOrchestrator } from './orchestrator.js';
import { WorkersService } from '../workers/workers.service.js';
import { tailPipelineStreamEvents } from './event-bus.js';
import { AutoscalingRecommendationService } from '../workers/autoscaling.service.js';

type CreatePipelineRunInput = {
  workspaceId: string;
  datasetId?: string;
  requestId?: string;
  templateCode?: string;
  name: string;
  parameters?: Record<string, unknown>;
  manualSteps?: Array<{
    order: number;
    name: string;
    type: PipelineStepType;
    workerType?: string;
    config?: Record<string, unknown>;
  }>;
};

type AuthUser = { id: string; email: string };

type RetryFromFailedStageInput = {
  reason?: string;
  stepOrder?: number;
};

export class PipelinesService {
  private readonly workers: WorkersService;
  private readonly orchestrator: PipelinesOrchestrator;
  private readonly autoscaling: AutoscalingRecommendationService;

  constructor(private readonly prisma: PrismaClient) {
    this.workers = new WorkersService(prisma);
    this.orchestrator = new PipelinesOrchestrator(prisma, this.workers);
    this.autoscaling = new AutoscalingRecommendationService();
  }

  async createRun(userId: string, dto: CreatePipelineRunInput) {
    await this.ensureDefaultTemplate();

    const template = dto.templateCode
      ? await this.prisma.pipelineTemplate.findUnique({ where: { code: dto.templateCode } })
      : await this.prisma.pipelineTemplate.findUnique({ where: { code: DEFAULT_RESEARCH_PIPELINE.code } });

    const steps = dto.manualSteps ?? ((template?.definitionJson as { steps?: CreatePipelineRunInput['manualSteps'] })?.steps ?? []);
    if (!steps.length) {
      throw new HttpError(400, 'Pipeline requires at least one step');
    }

    const run = await this.prisma.pipelineRun.create({
      data: {
        workspaceId: dto.workspaceId,
        datasetId: dto.datasetId,
        requestId: dto.requestId,
        triggeredById: userId,
        templateId: template?.id,
        name: dto.name,
        status: 'QUEUED',
        parametersJson: dto.parameters as never,
        steps: {
          create: steps.map((step) => ({
            order: step.order,
            name: step.name,
            type: step.type,
            workerType: step.workerType,
            configJson: step.config as never,
            status: 'PENDING',
          })),
        },
      },
      include: {
        steps: { orderBy: { order: 'asc' } },
      },
    });

    await this.orchestrator.startRun(run.id);
    return run;
  }

  async createWorkspaceRun(user: AuthUser, dto: CreatePipelineRunInput) {
    await assertWorkspaceAction(dto.workspaceId, user, WorkspaceAction.CREATE_ANALYSIS);
    return this.createRun(user.id, dto);
  }

  async listWorkspaceRuns(user: AuthUser, workspaceId: string) {
    await assertWorkspaceAction(workspaceId, user, WorkspaceAction.VIEW_ANALYSIS);
    return this.prisma.pipelineRun.findMany({
      where: { workspaceId },
      orderBy: { createdAt: 'desc' },
      include: {
        steps: { orderBy: { order: 'asc' } },
        artifacts: { orderBy: { createdAt: 'desc' }, take: 8 },
      },
    });
  }

  async getRun(user: AuthUser, runId: string) {
    const run = await this.prisma.pipelineRun.findUnique({
      where: { id: runId },
      include: {
        steps: { orderBy: { order: 'asc' } },
        artifacts: { orderBy: { createdAt: 'desc' } },
        events: { orderBy: { createdAt: 'desc' }, take: 50 },
        jobs: { orderBy: { createdAt: 'desc' }, take: 20 },
      },
    });

    if (!run) {
      throw new HttpError(404, 'Pipeline run not found');
    }

    await assertWorkspaceAction(run.workspaceId, user, WorkspaceAction.VIEW_ANALYSIS);
    return run;
  }

  async cancelRun(user: AuthUser, runId: string, reason = 'Canceled by user') {
    const run = await this.prisma.pipelineRun.findUnique({ where: { id: runId } });
    if (!run) {
      throw new HttpError(404, 'Pipeline run not found');
    }

    await assertWorkspaceAction(run.workspaceId, user, WorkspaceAction.CANCEL_ANALYSIS);

    await this.prisma.pipelineRun.update({
      where: { id: runId },
      data: {
        status: 'CANCELED',
        canceledAt: new Date(),
        failureReason: reason,
      },
    });

    await this.prisma.pipelineStep.updateMany({
      where: {
        pipelineRunId: runId,
        status: { in: ['PENDING', 'QUEUED', 'RUNNING'] },
      },
      data: {
        status: 'CANCELED',
        failureReason: reason,
        completedAt: new Date(),
      },
    });

    await this.workers.cancelRun(runId);
    await this.orchestrator.emit(runId, 'PIPELINE_CANCELED', 'WARN', reason);
    return { success: true };
  }

  async resumeRun(user: AuthUser, runId: string, reason = 'Resumed by user') {
    const run = await this.prisma.pipelineRun.findUnique({
      where: { id: runId },
      include: { steps: { orderBy: { order: 'asc' } } },
    });

    if (!run) {
      throw new HttpError(404, 'Pipeline run not found');
    }

    await assertWorkspaceAction(run.workspaceId, user, WorkspaceAction.CREATE_ANALYSIS);

    const failedOrCanceled = run.steps.filter((step) => ['FAILED', 'CANCELED'].includes(step.status));
    if (failedOrCanceled.length) {
      await this.prisma.pipelineStep.updateMany({
        where: { id: { in: failedOrCanceled.map((step) => step.id) } },
        data: {
          status: 'PENDING',
          failureReason: null,
          completedAt: null,
          startedAt: null,
          progressPercent: 0,
        },
      });
    }

    await this.prisma.pipelineRun.update({
      where: { id: runId },
      data: {
        status: 'RUNNING',
        canceledAt: null,
        completedAt: null,
        failureReason: null,
      },
    });

    await this.orchestrator.emit(runId, 'PIPELINE_RESUMED', 'INFO', reason);
    await this.orchestrator.queueNextPendingStep(runId);
    return this.getRun(user, runId);
  }

  async retryFromFailedStage(user: AuthUser, runId: string, input: RetryFromFailedStageInput) {
    const run = await this.prisma.pipelineRun.findUnique({
      where: { id: runId },
      include: { steps: { orderBy: { order: 'asc' } } },
    });

    if (!run) {
      throw new HttpError(404, 'Pipeline run not found');
    }

    await assertWorkspaceAction(run.workspaceId, user, WorkspaceAction.CREATE_ANALYSIS);

    const failedOrCanceled = run.steps.filter((step) => ['FAILED', 'CANCELED'].includes(step.status));
    const target = input.stepOrder
      ? run.steps.find((step) => step.order === input.stepOrder)
      : failedOrCanceled[0];

    if (!target) {
      throw new HttpError(400, 'No failed/canceled stage available for retry');
    }

    if (!['FAILED', 'CANCELED', 'PENDING', 'QUEUED'].includes(target.status)) {
      throw new HttpError(400, `Stage ${target.order} is not eligible for retry`);
    }

    return this.retryFromStep(user, runId, target.order, input.reason, true);
  }

  async retryFromStage(user: AuthUser, runId: string, input: RetryFromFailedStageInput) {
    const run = await this.prisma.pipelineRun.findUnique({
      where: { id: runId },
      include: { steps: { orderBy: { order: 'asc' } } },
    });

    if (!run) {
      throw new HttpError(404, 'Pipeline run not found');
    }

    await assertWorkspaceAction(run.workspaceId, user, WorkspaceAction.CREATE_ANALYSIS);

    const target = input.stepOrder
      ? run.steps.find((step) => step.order === input.stepOrder)
      : run.steps.find((step) => step.status === 'FAILED' || step.status === 'CANCELED') ?? run.steps[0];

    if (!target) {
      throw new HttpError(400, 'No stage available for retry');
    }

    return this.retryFromStep(user, runId, target.order, input.reason, false);
  }

  async tailLiveLog(user: AuthUser, runId: string, count = 80) {
    const run = await this.prisma.pipelineRun.findUnique({ where: { id: runId }, select: { workspaceId: true } });
    if (!run) {
      throw new HttpError(404, 'Pipeline run not found');
    }

    await assertWorkspaceAction(run.workspaceId, user, WorkspaceAction.VIEW_ANALYSIS);

    try {
      return await tailPipelineStreamEvents(runId, count);
    } catch {
      const safeCount = Math.max(1, Math.min(200, Math.floor(count)));
      const events = await this.prisma.pipelineEvent.findMany({
        where: { pipelineRunId: runId },
        orderBy: { createdAt: 'desc' },
        take: safeCount,
      });

      return events
        .slice()
        .reverse()
        .map((event) => ({
          streamId: `db:${event.id}`,
          id: event.id,
          pipelineRunId: event.pipelineRunId,
          eventType: event.eventType,
          level: event.level,
          message: event.message,
          stepOrder: event.stepOrder ?? undefined,
          createdAt: event.createdAt.toISOString(),
          dataJson: event.dataJson ?? undefined,
        }));
    }
  }

  async getAutoscalingRecommendation(user: AuthUser) {
    const runs = await this.prisma.pipelineRun.findMany({
      where: {
        OR: [
          { triggeredById: user.id },
          { workspace: { ownerId: user.id } },
          { workspace: { members: { some: { userId: user.id } } } },
        ],
      },
      take: 1,
      select: { id: true },
    });

    if (!runs.length) {
      return {
        generatedAt: new Date().toISOString(),
        targetJobsPerReplica: Number(process.env.AUTOSCALE_TARGET_JOBS_PER_REPLICA ?? 8),
        minReplicas: Number(process.env.AUTOSCALE_MIN_REPLICAS ?? 1),
        maxReplicas: Number(process.env.AUTOSCALE_MAX_REPLICAS ?? 24),
        queues: [],
      };
    }

    return this.autoscaling.recommend();
  }

  async listMonitoringRuns(user: AuthUser, limit?: number) {
    const safeLimit = Math.max(1, Math.min(200, limit ?? 50));
    return this.prisma.pipelineRun.findMany({
      where: {
        OR: [
          { triggeredById: user.id },
          { workspace: { ownerId: user.id } },
          { workspace: { members: { some: { userId: user.id } } } },
        ],
      },
      orderBy: { createdAt: 'desc' },
      take: safeLimit,
      include: {
        steps: { orderBy: { order: 'asc' } },
        events: { orderBy: { createdAt: 'desc' }, take: 20 },
      },
    });
  }

  async getMonitoringMetrics(user: AuthUser) {
    const where = {
      OR: [
        { triggeredById: user.id },
        { workspace: { ownerId: user.id } },
        { workspace: { members: { some: { userId: user.id } } } },
      ],
    };

    const [
      totalRuns,
      runningRuns,
      queuedRuns,
      failedRuns,
      succeededRuns,
      canceledRuns,
      activeStages,
      recentFailures,
    ] = await Promise.all([
      this.prisma.pipelineRun.count({ where }),
      this.prisma.pipelineRun.count({ where: { ...where, status: 'RUNNING' } }),
      this.prisma.pipelineRun.count({ where: { ...where, status: 'QUEUED' } }),
      this.prisma.pipelineRun.count({ where: { ...where, status: 'FAILED' } }),
      this.prisma.pipelineRun.count({ where: { ...where, status: 'SUCCEEDED' } }),
      this.prisma.pipelineRun.count({ where: { ...where, status: 'CANCELED' } }),
      this.prisma.pipelineStep.count({
        where: {
          status: 'RUNNING',
          pipelineRun: where,
        },
      }),
      this.prisma.pipelineEvent.count({
        where: {
          eventType: 'STEP_FAILED',
          createdAt: { gte: new Date(Date.now() - 24 * 60 * 60 * 1000) },
          pipelineRun: where,
        },
      }),
    ]);

    return {
      totalRuns,
      runningRuns,
      queuedRuns,
      failedRuns,
      succeededRuns,
      canceledRuns,
      activeStages,
      recentFailures,
      successRate: totalRuns ? Number(((succeededRuns / totalRuns) * 100).toFixed(1)) : 0,
    };
  }

  private async ensureDefaultTemplate() {
    await this.prisma.pipelineTemplate.upsert({
      where: { code: DEFAULT_RESEARCH_PIPELINE.code },
      update: {
        name: DEFAULT_RESEARCH_PIPELINE.name,
        description: DEFAULT_RESEARCH_PIPELINE.description,
        definitionJson: DEFAULT_RESEARCH_PIPELINE.definitionJson as never,
        isActive: true,
      },
      create: {
        code: DEFAULT_RESEARCH_PIPELINE.code,
        name: DEFAULT_RESEARCH_PIPELINE.name,
        description: DEFAULT_RESEARCH_PIPELINE.description,
        definitionJson: DEFAULT_RESEARCH_PIPELINE.definitionJson as never,
      },
    });
  }

  private async retryFromStep(user: AuthUser, runId: string, stepOrder: number, reason?: string, fromFailed = false) {
    const run = await this.prisma.pipelineRun.findUnique({
      where: { id: runId },
      include: { steps: { orderBy: { order: 'asc' } } },
    });

    if (!run) {
      throw new HttpError(404, 'Pipeline run not found');
    }

    await assertWorkspaceAction(run.workspaceId, user, WorkspaceAction.CREATE_ANALYSIS);

    const target = run.steps.find((step) => step.order === stepOrder);
    if (!target) {
      throw new HttpError(400, `Stage ${stepOrder} was not found`);
    }

    await this.workers.cancelRun(runId);

    await this.prisma.$transaction(async (tx) => {
      await tx.pipelineStep.updateMany({
        where: {
          pipelineRunId: runId,
          order: { gte: target.order },
        },
        data: {
          status: 'PENDING',
          progressPercent: 0,
          startedAt: null,
          completedAt: null,
          failureReason: null,
        },
      });

      await tx.pipelineRun.update({
        where: { id: runId },
        data: {
          status: 'RUNNING',
          currentStepIndex: target.order,
          canceledAt: null,
          completedAt: null,
          failureReason: null,
        },
      });
    });

    await this.orchestrator.emit(
      runId,
      fromFailed ? 'PIPELINE_RETRY_FROM_FAILED_STAGE' : 'PIPELINE_RETRY_FROM_STAGE',
      'WARN',
      reason?.trim() || `Retry requested from step ${target.order}: ${target.name}`,
      { stepOrder: target.order, stepType: target.type },
    );

    await this.orchestrator.queueNextPendingStep(runId);
    return this.getRun(user, runId);
  }
}