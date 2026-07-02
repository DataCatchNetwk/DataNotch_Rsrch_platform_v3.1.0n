import type { Request, Response } from 'express';
import { HttpError } from '../utils/errors.js';
import {
  addWorkspaceMember,
  archiveWorkspace,
  createWorkspace,
  getWorkspaceById,
  listMyWorkspaces,
  listWorkspaceMembers,
  removeWorkspaceMember,
  updateWorkspace,
  updateWorkspaceMemberRole,
} from '../services/workspaces.service.js';
import { cancelAnalysisJob, createAnalysisJob, listAnalysisJobsByWorkspace } from '../services/workspace-analysis-jobs.service.js';
import { createDataset, deleteDataset, getDatasetById, listDatasetsByWorkspace, uploadDatasetBundleFiles, uploadDatasetFile } from '../services/workspace-datasets.service.js';
import { createReport, deleteReport, listReportsByWorkspace, uploadReportFile } from '../services/workspace-reports.service.js';

function parseCommaSeparated(value: unknown) {
  if (typeof value !== 'string') {
    return [] as string[];
  }

  return value
    .split(',')
    .map((entry) => entry.trim())
    .filter(Boolean);
}

function parseOptionalJson(value: unknown) {
  if (typeof value !== 'string' || !value.trim()) {
    return undefined;
  }

  try {
    return JSON.parse(value);
  } catch {
    throw new HttpError(400, 'Invalid JSON payload');
  }
}

function parseOptionalBoolean(value: unknown) {
  if (typeof value === 'boolean') {
    return value;
  }

  if (typeof value === 'string') {
    const normalized = value.trim().toLowerCase();
    if (normalized === 'true') {
      return true;
    }

    if (normalized === 'false') {
      return false;
    }
  }

  return undefined;
}

function requireUser(req: Request) {
  if (!req.user) {
    throw new HttpError(401, 'Authentication required');
  }

  return {
    id: req.user.id,
    email: req.user.email,
  };
}

function normalizeBigInt<T>(value: T): T {
  if (typeof value === 'bigint') {
    return Number(value) as T;
  }

  if (Array.isArray(value)) {
    return value.map((item) => normalizeBigInt(item)) as T;
  }

  if (value && typeof value === 'object') {
    const entries = Object.entries(value as Record<string, unknown>).map(([key, item]) => [key, normalizeBigInt(item)]);
    return Object.fromEntries(entries) as T;
  }

  return value;
}

export async function create(req: Request, res: Response) {
  const workspace = await createWorkspace(requireUser(req), req.body);
  res.status(201).json({ workspace });
}

export async function listMine(req: Request, res: Response) {
  const workspaces = await listMyWorkspaces(requireUser(req));
  res.json({ workspaces });
}

export async function getById(req: Request, res: Response) {
  const workspace = await getWorkspaceById(requireUser(req), req.params.workspaceId);
  res.json(normalizeBigInt({ workspace }));
}

export async function update(req: Request, res: Response) {
  const workspace = await updateWorkspace(requireUser(req), req.params.workspaceId, req.body);
  res.json({ workspace });
}

export async function archive(req: Request, res: Response) {
  const workspace = await archiveWorkspace(requireUser(req), req.params.workspaceId);
  res.json({ workspace });
}

export async function members(req: Request, res: Response) {
  const membersList = await listWorkspaceMembers(requireUser(req), req.params.workspaceId);
  res.json({ members: membersList });
}

export async function addMember(req: Request, res: Response) {
  const member = await addWorkspaceMember(requireUser(req), req.params.workspaceId, req.body);
  res.status(201).json({ member });
}

export async function updateRole(req: Request, res: Response) {
  const member = await updateWorkspaceMemberRole(requireUser(req), req.params.workspaceId, req.params.memberUserId, req.body);
  res.json({ member });
}

export async function removeMember(req: Request, res: Response) {
  const member = await removeWorkspaceMember(requireUser(req), req.params.workspaceId, req.params.memberUserId);
  res.json({ member });
}

export async function listDatasets(req: Request, res: Response) {
  const datasets = await listDatasetsByWorkspace(requireUser(req), req.params.workspaceId);
  res.json({ datasets });
}

export async function createDatasetRecord(req: Request, res: Response) {
  const dataset = await createDataset(requireUser(req), req.params.workspaceId, req.body);
  res.status(201).json({ dataset });
}

export async function uploadDataset(req: Request, res: Response) {
  if (!req.file) {
    throw new HttpError(400, 'File is required');
  }

  const dataset = await uploadDatasetFile(requireUser(req), req.params.workspaceId, req.file, {
    name: typeof req.body?.name === 'string' ? req.body.name : undefined,
    description: typeof req.body?.description === 'string' ? req.body.description : undefined,
    visibility: typeof req.body?.visibility === 'string' ? req.body.visibility : undefined,
    recordCount: typeof req.body?.recordCount === 'string' && req.body.recordCount.trim() ? Number(req.body.recordCount) : undefined,
    tags: parseCommaSeparated(req.body?.tags),
    autoRunPipeline: parseOptionalBoolean(req.body?.autoRunPipeline),
    uploadKind: typeof req.body?.uploadKind === 'string' ? req.body.uploadKind : undefined,
  });

  res.status(201).json({ dataset });
}

export async function uploadDatasetBundle(req: Request, res: Response) {
  const files = Array.isArray(req.files) ? req.files : [];
  if (!files.length) {
    throw new HttpError(400, 'Files are required');
  }

  const relativePaths = parseOptionalJson(req.body?.relativePaths);
  if (relativePaths !== undefined && !Array.isArray(relativePaths)) {
    throw new HttpError(400, 'relativePaths must be a JSON array');
  }

  const dataset = await uploadDatasetBundleFiles(requireUser(req), req.params.workspaceId, files, {
    name: typeof req.body?.name === 'string' ? req.body.name : undefined,
    description: typeof req.body?.description === 'string' ? req.body.description : undefined,
    visibility: typeof req.body?.visibility === 'string' ? req.body.visibility : undefined,
    recordCount: typeof req.body?.recordCount === 'string' && req.body.recordCount.trim() ? Number(req.body.recordCount) : undefined,
    tags: parseCommaSeparated(req.body?.tags),
    autoRunPipeline: parseOptionalBoolean(req.body?.autoRunPipeline),
    uploadKind: typeof req.body?.uploadKind === 'string' ? req.body.uploadKind : undefined,
    relativePaths,
  });

  res.status(201).json({ dataset });
}

export async function getDataset(req: Request, res: Response) {
  const dataset = await getDatasetById(requireUser(req), req.params.workspaceId, req.params.datasetId);
  res.json({ dataset });
}

export async function deleteDatasetRecord(req: Request, res: Response) {
  const dataset = await deleteDataset(requireUser(req), req.params.workspaceId, req.params.datasetId);
  res.json({ dataset });
}

export async function listAnalysisJobs(req: Request, res: Response) {
  const analysisJobs = await listAnalysisJobsByWorkspace(requireUser(req), req.params.workspaceId);
  res.json({ analysisJobs });
}

export async function createAnalysisJobRecord(req: Request, res: Response) {
  const analysisJob = await createAnalysisJob(requireUser(req), req.params.workspaceId, req.body);
  res.status(201).json({ analysisJob });
}

export async function cancelAnalysisJobRecord(req: Request, res: Response) {
  const analysisJob = await cancelAnalysisJob(requireUser(req), req.params.workspaceId, req.params.jobId);
  res.json({ analysisJob });
}

export async function listReports(req: Request, res: Response) {
  const reports = await listReportsByWorkspace(requireUser(req), req.params.workspaceId);
  res.json({ reports });
}

export async function createReportRecord(req: Request, res: Response) {
  const report = await createReport(requireUser(req), req.params.workspaceId, req.body);
  res.status(201).json({ report });
}

export async function uploadReport(req: Request, res: Response) {
  if (!req.file) {
    throw new HttpError(400, 'File is required');
  }

  const report = await uploadReportFile(requireUser(req), req.params.workspaceId, req.file, {
    title: typeof req.body?.title === 'string' ? req.body.title : undefined,
    reportType: typeof req.body?.reportType === 'string' ? req.body.reportType : undefined,
    description: typeof req.body?.description === 'string' ? req.body.description : undefined,
    datasetIds: parseCommaSeparated(req.body?.datasetIds),
    metadataJson: parseOptionalJson(req.body?.metadataJson),
  });

  res.status(201).json({ report });
}

export async function deleteReportRecord(req: Request, res: Response) {
  const report = await deleteReport(requireUser(req), req.params.workspaceId, req.params.reportId);
  res.json({ report });
}
