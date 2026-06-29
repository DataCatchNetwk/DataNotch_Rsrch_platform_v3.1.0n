import { prisma } from '../db/prisma.js';
import { env } from '../config/env.js';
import { HttpError } from '../utils/errors.js';
import { assertWorkspaceAction } from './workspace-access.service.js';
import { WorkspaceAction } from './workspace-permissions.js';
import { notifyWorkspaceMembers } from './notifications.service.js';
import { PipelinesService } from '../pipelines/service.js';
import { AutomationService } from './automation.service.js';

type AuthUser = {
  id: string;
  email: string;
};

type UploadedFile = {
  filename: string;
  originalname: string;
  mimetype: string;
  size: number;
  path: string;
};

type CreateDatasetInput = {
  name: string;
  description?: string;
  visibility?: 'PRIVATE' | 'WORKSPACE' | 'PUBLIC' | 'RESTRICTED';
  recordCount?: number;
  tags?: string[];
};

type UploadDatasetInput = Partial<CreateDatasetInput>;
type UploadDatasetAutomationInput = UploadDatasetInput & {
  autoRunPipeline?: boolean;
};

function mapUserName(user: { firstname: string; surname: string }) {
  return `${user.firstname} ${user.surname}`.trim();
}

function toSafeNumber(value: bigint | number | null | undefined) {
  if (value === null || value === undefined) return value;
  return Number(value);
}

function serializeDataset<T extends { sizeBytes?: bigint | number | null }>(dataset: T) {
  return {
    ...dataset,
    sizeBytes: toSafeNumber(dataset.sizeBytes),
  };
}

export async function listDatasetsByWorkspace(user: AuthUser, workspaceId: string) {
  await assertWorkspaceAction(workspaceId, user, WorkspaceAction.VIEW_DATASETS);

  const datasets = await prisma.dataset.findMany({
    where: { workspaceId },
    orderBy: { updatedAt: 'desc' },
    include: {
      createdBy: {
        select: { id: true, firstname: true, surname: true, email: true },
      },
    },
  });

  return datasets.map((dataset) => ({
    ...serializeDataset(dataset),
    createdBy: {
      id: dataset.createdBy.id,
      name: mapUserName(dataset.createdBy),
      email: dataset.createdBy.email,
    },
  }));
}

export async function createDataset(user: AuthUser, workspaceId: string, input: CreateDatasetInput) {
  await assertWorkspaceAction(workspaceId, user, WorkspaceAction.UPLOAD_DATASET);

  const dataset = await prisma.dataset.create({
    data: {
      name: input.name,
      description: input.description,
      visibility: input.visibility ?? 'WORKSPACE',
      recordCount: input.recordCount,
      tags: input.tags ?? [],
      workspaceId,
      createdById: user.id,
    },
    include: {
      createdBy: {
        select: { id: true, firstname: true, surname: true, email: true },
      },
    },
  });

  await notifyWorkspaceMembers(workspaceId, {
    type: 'DATASET_ADDED',
    title: 'Dataset created',
    description: `${dataset.name} was created in this workspace.`,
    severity: 'INFO',
    link: `/dashboard/workspaces/${workspaceId}`,
  });

  return {
    ...serializeDataset(dataset),
    createdBy: {
      id: dataset.createdBy.id,
      name: mapUserName(dataset.createdBy),
      email: dataset.createdBy.email,
    },
  };
}

export async function uploadDatasetFile(
  user: AuthUser,
  workspaceId: string,
  file: UploadedFile,
  input: UploadDatasetAutomationInput = {},
) {
  await assertWorkspaceAction(workspaceId, user, WorkspaceAction.UPLOAD_DATASET);

  const fileUrl = `${env.SERVER_PUBLIC_URL}/uploads/${file.filename}`;
  const dataset = await prisma.dataset.create({
    data: {
      name: input.name?.trim() || file.originalname,
      description: input.description,
      visibility: input.visibility ?? 'WORKSPACE',
      recordCount: input.recordCount,
      tags: input.tags ?? [],
      workspaceId,
      createdById: user.id,
      storagePath: fileUrl,
      mimeType: file.mimetype,
      sizeBytes: file.size,
    },
    include: {
      createdBy: {
        select: { id: true, firstname: true, surname: true, email: true },
      },
    },
  });

  await prisma.fileAsset.create({
    data: {
      fileName: file.filename,
      originalName: file.originalname,
      mimeType: file.mimetype,
      sizeBytes: file.size,
      storagePath: file.path,
      publicUrl: fileUrl,
      datasetId: dataset.id,
      uploadedById: user.id,
    },
  });

  await notifyWorkspaceMembers(workspaceId, {
    type: 'DATASET_ADDED',
    title: 'Dataset uploaded',
    description: `${file.originalname} was uploaded to this workspace.`,
    severity: 'INFO',
    link: `/dashboard/workspaces/${workspaceId}`,
  });

  if (input.autoRunPipeline !== false) {
    const pipelines = new PipelinesService(prisma);
    const automation = new AutomationService(pipelines);

    await automation.triggerDatasetAutomation({
      userId: user.id,
      workspaceId,
      datasetId: dataset.id,
      analysisType: 'classification',
    });
  }

  return {
    ...serializeDataset(dataset),
    createdBy: {
      id: dataset.createdBy.id,
      name: mapUserName(dataset.createdBy),
      email: dataset.createdBy.email,
    },
  };
}

export async function getDatasetById(user: AuthUser, workspaceId: string, datasetId: string) {
  await assertWorkspaceAction(workspaceId, user, WorkspaceAction.VIEW_DATASETS);

  const dataset = await prisma.dataset.findFirst({
    where: {
      id: datasetId,
      workspaceId,
    },
    include: {
      createdBy: {
        select: { id: true, firstname: true, surname: true, email: true },
      },
    },
  });

  if (!dataset) {
    throw new HttpError(404, 'Dataset not found');
  }

  return {
    ...serializeDataset(dataset),
    createdBy: {
      id: dataset.createdBy.id,
      name: mapUserName(dataset.createdBy),
      email: dataset.createdBy.email,
    },
  };
}

export async function deleteDataset(user: AuthUser, workspaceId: string, datasetId: string) {
  await assertWorkspaceAction(workspaceId, user, WorkspaceAction.DELETE_DATASET);

  const dataset = await prisma.dataset.findFirst({
    where: {
      id: datasetId,
      workspaceId,
    },
  });

  if (!dataset) {
    throw new HttpError(404, 'Dataset not found');
  }

  return prisma.dataset.delete({
    where: { id: datasetId },
  });
}
