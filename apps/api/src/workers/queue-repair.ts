import type { PrismaClient } from '@prisma/client';
import { WorkersService } from './workers.service.js';

const ACTIVE_WORKER_STATUSES = ['QUEUED', 'ACTIVE', 'RETRYING'] as const;
const REPAIRABLE_RUN_STATUSES = ['QUEUED', 'RUNNING'] as const;
const REPAIRABLE_STEP_STATUSES = ['PENDING', 'QUEUED'] as const;

export type QueueRepairResult = {
  inspectedRuns: number;
  repairedRuns: number;
  skippedRuns: number;
};

export async function repairMissingWorkerJobs(prisma: PrismaClient): Promise<QueueRepairResult> {
  const workers = new WorkersService(prisma);
  const runs = await prisma.pipelineRun.findMany({
    where: { status: { in: [...REPAIRABLE_RUN_STATUSES] } },
    include: {
      steps: { orderBy: { order: 'asc' } },
      jobs: {
        where: { status: { in: [...ACTIVE_WORKER_STATUSES] } },
        select: { id: true },
      },
    },
    orderBy: { createdAt: 'asc' },
  });

  let repairedRuns = 0;
  let skippedRuns = 0;

  for (const run of runs) {
    if (run.jobs.length > 0) {
      skippedRuns += 1;
      continue;
    }

    const nextStep = run.steps.find((step) => REPAIRABLE_STEP_STATUSES.includes(step.status as never));
    if (!nextStep) {
      skippedRuns += 1;
      continue;
    }

    await prisma.pipelineRun.update({
      where: { id: run.id },
      data: {
        status: 'RUNNING',
        startedAt: run.startedAt ?? new Date(),
        currentStepIndex: nextStep.order,
      },
    });

    await prisma.pipelineStep.update({
      where: { id: nextStep.id },
      data: { status: 'QUEUED', failureReason: null },
    });

    await workers.enqueueForStep(run.id, nextStep.id);
    repairedRuns += 1;
  }

  return {
    inspectedRuns: runs.length,
    repairedRuns,
    skippedRuns,
  };
}
