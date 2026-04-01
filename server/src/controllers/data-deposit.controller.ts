import type { Request, Response } from 'express';
import { HttpError } from '../utils/errors.js';
import {
  getDepositPullRequestStatusDebug,
  getDepositPullRequestStatus,
  getDepositDatasetById,
  listDepositDatasets,
  previewDepositDataset,
  pullDepositDataset,
  setDepositFavorite,
  triggerFallbackPullByRequestId,
} from '../services/data-deposit.service.js';

function parseBoolean(value: unknown) {
  if (typeof value !== 'string') {
    return undefined;
  }

  const normalized = value.trim().toLowerCase();
  if (normalized === 'true') {
    return true;
  }

  if (normalized === 'false') {
    return false;
  }

  return undefined;
}

function parseNumber(value: unknown) {
  if (typeof value !== 'string') {
    return undefined;
  }

  const parsed = Number(value);
  if (!Number.isFinite(parsed)) {
    return undefined;
  }

  return parsed;
}

function requireUser(req: Request) {
  if (!req.user) {
    throw new HttpError(401, 'Authentication required');
  }

  return {
    id: req.user.id,
    email: req.user.email,
    roles: req.user.roles,
  };
}

export async function list(req: Request, res: Response) {
  const result = await listDepositDatasets(
    {
      search: typeof req.query.search === 'string' ? req.query.search : undefined,
      domain: typeof req.query.domain === 'string' ? req.query.domain : undefined,
      accessibility: typeof req.query.accessibility === 'string' ? req.query.accessibility : undefined,
      favoritesOnly: parseBoolean(req.query.favoritesOnly),
      page: parseNumber(req.query.page),
      pageSize: parseNumber(req.query.pageSize),
    },
    req.user?.id,
  );

  res.json(result);
}

export async function listPublic(req: Request, res: Response) {
  const result = await listDepositDatasets(
    {
      search: typeof req.query.search === 'string' ? req.query.search : undefined,
      domain: typeof req.query.domain === 'string' ? req.query.domain : undefined,
      accessibility: typeof req.query.accessibility === 'string' ? req.query.accessibility : undefined,
      favoritesOnly: parseBoolean(req.query.favoritesOnly),
      page: parseNumber(req.query.page),
      pageSize: parseNumber(req.query.pageSize),
    },
    req.user?.id,
  );

  res.json({ datasets: result.items });
}

export async function getById(req: Request, res: Response) {
  const dataset = await getDepositDatasetById(req.params.datasetId, req.user?.id);
  res.json(dataset);
}

export async function preview(req: Request, res: Response) {
  const datasetPreview = await previewDepositDataset(req.params.datasetId, req.user?.id);
  res.json(datasetPreview);
}

export async function favorite(req: Request, res: Response) {
  const user = requireUser(req);
  const favoriteFlag = typeof req.body?.favorite === 'boolean' ? req.body.favorite : true;
  const result = await setDepositFavorite(req.params.datasetId, user, favoriteFlag);
  res.json(result);
}

export async function pull(req: Request, res: Response) {
  const user = requireUser(req);
  const result = await pullDepositDataset(
    req.params.datasetId,
    {
      workspaceId: typeof req.body?.workspaceId === 'string' ? req.body.workspaceId : '',
      mode:
        req.body?.mode === 'COPY' || req.body?.mode === 'VIRTUAL_VIEW'
          ? req.body.mode
          : undefined,
      rowLimit: typeof req.body?.rowLimit === 'number' ? req.body.rowLimit : undefined,
      selectedColumns: Array.isArray(req.body?.selectedColumns)
        ? req.body.selectedColumns.filter((entry: unknown) => typeof entry === 'string')
        : undefined,
      filterJson: req.body?.filterJson && typeof req.body.filterJson === 'object' ? req.body.filterJson : undefined,
    },
    user,
  );

  res.status(201).json(result);
}

export async function pullStatus(req: Request, res: Response) {
  const user = requireUser(req);
  const result = await getDepositPullRequestStatus(req.params.pullRequestId, user);
  res.json(result);
}

export async function triggerFallbackPull(req: Request, res: Response) {
  const result = await triggerFallbackPullByRequestId(req.params.pullRequestId);
  res.status(202).json(result);
}

export async function debugPullStatus(req: Request, res: Response) {
  const result = await getDepositPullRequestStatusDebug(req.params.pullRequestId);
  res.json(result);
}
