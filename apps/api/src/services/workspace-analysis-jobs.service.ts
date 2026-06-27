import { prisma } from '../db/prisma.js';
import { HttpError } from '../utils/errors.js';
import { assertWorkspaceAction } from './workspace-access.service.js';
import { WorkspaceAction } from './workspace-permissions.js';
import { AutomationService } from './automation.service.js';
import { PipelinesService } from '../pipelines/service.js';

type AuthUser = {
  id: string;
  email: string;
};

type CreateAnalysisJobInput = {
  name: string;
  jobType: string;
  description?: string;
  datasetId?: string;
  parametersJson?: unknown;
  autoPipeline?: boolean;
  analysisType?: string;
};

function mapUserName(user: { firstname: string; surname: string }) {
  return `${user.firstname} ${user.surname}`.trim();
}

export async function listAnalysisJobsByWorkspace(user: AuthUser, workspaceId: string) {
  await assertWorkspaceAction(workspaceId, user, WorkspaceAction.VIEW_ANALYSIS);

  const jobs = await prisma.analysisJob.findMany({
    where: { workspaceId },
    orderBy: { createdAt: 'desc' },
    include: {
      createdBy: {
        select: { id: true, firstname: true, surname: true, email: true },
      },
      dataset: true,
    },
  });

  return jobs.map((job) => ({
    ...job,
    createdBy: {
      id: job.createdBy.id,
      name: mapUserName(job.createdBy),
      email: job.createdBy.email,
    },
  }));
}

export async function createAnalysisJob(user: AuthUser, workspaceId: string, input: CreateAnalysisJobInput) {
  await assertWorkspaceAction(workspaceId, user, WorkspaceAction.CREATE_ANALYSIS);

  const createdJob = await prisma.analysisJob.create({
    data: {
      name: input.name,
      description: input.description,
      jobType: input.jobType,
      parametersJson: input.parametersJson as never,
      workspaceId,
      datasetId: input.datasetId,
      createdById: user.id,
      status: 'QUEUED',
    },
    include: {
      createdBy: {
        select: { id: true, firstname: true, surname: true, email: true },
      },
      dataset: true,
    },
  });

  let job = createdJob;
  if (input.autoPipeline) {
    if (!input.datasetId) {
      throw new HttpError(400, 'Dataset is required when autoPipeline is enabled');
    }

    const pipelines = new PipelinesService(prisma);
    const automation = new AutomationService(pipelines);
    const run = await automation.triggerDatasetAutomation({
      userId: user.id,
      workspaceId,
      datasetId: input.datasetId,
      analysisType: input.analysisType,
    });

    job = await prisma.analysisJob.update({
      where: { id: createdJob.id },
      data: {
        status: 'RUNNING',
        resultsJson: {
          pipelineRunId: run.id,
          orchestration: 'research_default_v1',
        },
      },
      include: {
        createdBy: {
          select: { id: true, firstname: true, surname: true, email: true },
        },
        dataset: true,
      },
    });
  }

  return {
    ...job,
    createdBy: {
      id: job.createdBy.id,
      name: mapUserName(job.createdBy),
      email: job.createdBy.email,
    },
  };
}

export async function cancelAnalysisJob(user: AuthUser, workspaceId: string, jobId: string) {
  await assertWorkspaceAction(workspaceId, user, WorkspaceAction.CANCEL_ANALYSIS);

  const job = await prisma.analysisJob.findFirst({
    where: { id: jobId, workspaceId },
  });

  if (!job) {
    throw new HttpError(404, 'Analysis job not found');
  }

  return prisma.analysisJob.update({
    where: { id: jobId },
    data: {
      status: 'CANCELLED',
      completedAt: new Date(),
    },
  });
}
