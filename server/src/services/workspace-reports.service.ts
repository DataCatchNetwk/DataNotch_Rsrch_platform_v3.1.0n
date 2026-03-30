import { prisma } from '../db/prisma.js';
import { env } from '../config/env.js';
import { HttpError } from '../utils/errors.js';
import { assertWorkspaceAction } from './workspace-access.service.js';
import { WorkspaceAction } from './workspace-permissions.js';
import { notifyWorkspaceMembers } from './notifications.service.js';

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

type CreateReportInput = {
  title: string;
  reportType: string;
  description?: string;
  datasetIds?: string[];
  metadataJson?: unknown;
};

type UploadReportInput = Partial<CreateReportInput>;

function mapUserName(user: { firstname: string; surname: string }) {
  return `${user.firstname} ${user.surname}`.trim();
}

export async function listReportsByWorkspace(user: AuthUser, workspaceId: string) {
  await assertWorkspaceAction(workspaceId, user, WorkspaceAction.VIEW_REPORTS);

  const reports = await prisma.report.findMany({
    where: { workspaceId },
    orderBy: { createdAt: 'desc' },
    include: {
      createdBy: {
        select: { id: true, firstname: true, surname: true, email: true },
      },
      datasets: true,
    },
  });

  return reports.map((report) => ({
    ...report,
    createdBy: {
      id: report.createdBy.id,
      name: mapUserName(report.createdBy),
      email: report.createdBy.email,
    },
  }));
}

export async function createReport(user: AuthUser, workspaceId: string, input: CreateReportInput) {
  await assertWorkspaceAction(workspaceId, user, WorkspaceAction.CREATE_REPORT);

  const report = await prisma.report.create({
    data: {
      title: input.title,
      description: input.description,
      reportType: input.reportType,
      metadataJson: input.metadataJson as never,
      workspaceId,
      createdById: user.id,
      datasets: input.datasetIds?.length
        ? {
            connect: input.datasetIds.map((id) => ({ id })),
          }
        : undefined,
    },
    include: {
      createdBy: {
        select: { id: true, firstname: true, surname: true, email: true },
      },
      datasets: true,
    },
  });

  await notifyWorkspaceMembers(workspaceId, {
    type: 'REPORT_CREATED',
    title: 'Report created',
    description: `${report.title} was created in this workspace.`,
    severity: report.status === 'READY' ? 'SUCCESS' : 'INFO',
    link: `/dashboard/workspaces/${workspaceId}`,
  });

  return {
    ...report,
    createdBy: {
      id: report.createdBy.id,
      name: mapUserName(report.createdBy),
      email: report.createdBy.email,
    },
  };
}

export async function uploadReportFile(
  user: AuthUser,
  workspaceId: string,
  file: UploadedFile,
  input: UploadReportInput = {},
) {
  await assertWorkspaceAction(workspaceId, user, WorkspaceAction.CREATE_REPORT);

  const fileUrl = `${env.SERVER_PUBLIC_URL}/uploads/${file.filename}`;
  const report = await prisma.report.create({
    data: {
      title: input.title?.trim() || file.originalname,
      reportType: input.reportType?.trim() || 'uploaded',
      description: input.description,
      metadataJson: input.metadataJson as never,
      workspaceId,
      createdById: user.id,
      storagePath: fileUrl,
      publicUrl: fileUrl,
      datasets: input.datasetIds?.length
        ? {
            connect: input.datasetIds.map((id) => ({ id })),
          }
        : undefined,
    },
    include: {
      createdBy: {
        select: { id: true, firstname: true, surname: true, email: true },
      },
      datasets: true,
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
      reportId: report.id,
      uploadedById: user.id,
    },
  });

  await notifyWorkspaceMembers(workspaceId, {
    type: 'REPORT_CREATED',
    title: 'Report uploaded',
    description: `${file.originalname} was uploaded to this workspace.`,
    severity: 'SUCCESS',
    link: `/dashboard/workspaces/${workspaceId}`,
  });

  return {
    ...report,
    createdBy: {
      id: report.createdBy.id,
      name: mapUserName(report.createdBy),
      email: report.createdBy.email,
    },
  };
}

export async function deleteReport(user: AuthUser, workspaceId: string, reportId: string) {
  await assertWorkspaceAction(workspaceId, user, WorkspaceAction.DELETE_REPORT);

  const report = await prisma.report.findFirst({
    where: { id: reportId, workspaceId },
  });

  if (!report) {
    throw new HttpError(404, 'Report not found');
  }

  return prisma.report.delete({
    where: { id: reportId },
  });
}
