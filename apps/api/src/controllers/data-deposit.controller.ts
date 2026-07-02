import type { Request, Response } from 'express';
import { HttpError } from '../utils/errors.js';
import {
  archiveDepositDataset,
  createDepositDatasetAccessRequest,
  createDepositSavedView,
  deleteDepositSavedView,
  getDepositDatasetDownload,
  getDepositDatasetLineage,
  getDepositPullRequestStatusDebug,
  getDepositPullRequestStatus,
  getDatasetAuditTrail,
  listDepositSavedViews,
  getDepositDatasetById,
  listDepositDatasets,
  previewDepositDataset,
  pullDepositDataset,
  runDepositBulkOperation,
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

export async function download(req: Request, res: Response) {
  const result = await getDepositDatasetDownload(req.params.datasetId, req.user ? requireUser(req) : undefined);
  res.setHeader('Content-Type', result.contentType);
  return res.download(result.filePath, result.fileName);
}

export async function remove(req: Request, res: Response) {
  const user = requireUser(req);
  const result = await archiveDepositDataset(req.params.datasetId, user);
  res.json(result);
}

export async function lineage(req: Request, res: Response) {
  const result = await getDepositDatasetLineage(req.params.datasetId, req.user?.id);
  res.json(result);
}

export async function createAccessRequest(req: Request, res: Response) {
  const user = requireUser(req);
  const result = await createDepositDatasetAccessRequest(req.params.datasetId, user, {
    justification: typeof req.body?.justification === 'string' ? req.body.justification : undefined,
    requestedRole: typeof req.body?.requestedRole === 'string' ? req.body.requestedRole : undefined,
  });
  res.status(201).json(result);
}

export async function bulkOperation(req: Request, res: Response) {
  const user = requireUser(req);
  const datasetIds = Array.isArray(req.body?.datasetIds)
    ? req.body.datasetIds.filter((entry: unknown): entry is string => typeof entry === 'string' && entry.length > 0)
    : [];

  const operation =
    req.body?.operation === 'ARCHIVE' ||
    req.body?.operation === 'EXPORT' ||
    req.body?.operation === 'APPLY_GOVERNANCE_POLICY'
      ? req.body.operation
      : undefined;

  if (!operation) {
    throw new HttpError(400, 'operation must be one of ARCHIVE, EXPORT, APPLY_GOVERNANCE_POLICY');
  }

  const result = await runDepositBulkOperation(
    {
      datasetIds,
      operation,
      governancePolicy:
        req.body?.governancePolicy === 'PUBLIC' ||
        req.body?.governancePolicy === 'RESTRICTED' ||
        req.body?.governancePolicy === 'CONTROLLED'
          ? req.body.governancePolicy
          : undefined,
    },
    user,
  );

  res.json(result);
}

export async function listSavedViews(req: Request, res: Response) {
  const user = requireUser(req);
  const result = await listDepositSavedViews(user);
  res.json(result);
}

export async function createSavedView(req: Request, res: Response) {
  const user = requireUser(req);
  const name = typeof req.body?.name === 'string' ? req.body.name.trim() : '';
  if (!name) {
    throw new HttpError(400, 'name is required');
  }

  const result = await createDepositSavedView(user, {
    name,
    filters: req.body?.filters && typeof req.body.filters === 'object' ? req.body.filters : undefined,
    pinnedFilters: Array.isArray(req.body?.pinnedFilters)
      ? req.body.pinnedFilters.filter((entry: unknown): entry is string => typeof entry === 'string')
      : undefined,
  });
  res.status(201).json(result);
}

export async function deleteSavedView(req: Request, res: Response) {
  const user = requireUser(req);
  const result = await deleteDepositSavedView(user, req.params.viewId);
  res.json(result);
}

export async function streamPullStatus(req: Request, res: Response) {
  const user = requireUser(req);
  const pullRequestId = req.params.pullRequestId;

  res.setHeader('Content-Type', 'text/event-stream');
  res.setHeader('Cache-Control', 'no-cache, no-transform');
  res.setHeader('Connection', 'keep-alive');
  res.flushHeaders?.();

  let active = true;

  const sendStatus = async () => {
    if (!active) {
      return;
    }

    const status = await getDepositPullRequestStatus(pullRequestId, user);
    res.write('event: pull-status\n');
    res.write(`data: ${JSON.stringify(status)}\n\n`);

    const terminalStatuses = new Set(['COMPLETED', 'FAILED', 'CANCELED']);
    if (terminalStatuses.has(String(status.status))) {
      active = false;
      clearInterval(interval);
      res.end();
    }
  };

  await sendStatus();
  const interval = setInterval(() => {
    void sendStatus().catch(() => {
      // Ignore intermittent polling errors and keep stream alive.
    });
  }, 1500);

  req.on('close', () => {
    active = false;
    clearInterval(interval);
    res.end();
  });
}

export async function auditTrail(req: Request, res: Response) {
  const result = await getDatasetAuditTrail(req.params.datasetId);
  res.json(result);
}
