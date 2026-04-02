import { prisma } from '../db/prisma.js';
import { Prisma } from '@prisma/client';
import { HttpError } from '../utils/errors.js';
import { assertWorkspaceAction } from './workspace-access.service.js';
import { WorkspaceAction } from './workspace-permissions.js';
import { authorizeDepositOperation, DepositPermission } from '../guards/deposit-permission.guard.js';
import { PullJobProcessor, processPullJobWithoutQueue } from '../workers/processors/pull-job.processor.js';
import { isRedisReachable } from '../workers/queue.factory.js';

type AuthUser = {
  id: string;
  email: string;
  roles?: string[];
};

type ListDepositFilters = {
  search?: string;
  domain?: string;
  accessibility?: string;
  favoritesOnly?: boolean;
  page?: number;
  pageSize?: number;
};

type PullDepositInput = {
  workspaceId: string;
  mode?: 'COPY' | 'VIRTUAL_VIEW';
  rowLimit?: number;
  selectedColumns?: string[];
  filterJson?: Record<string, unknown>;
};

function toPositiveInt(value: number | undefined, fallback: number) {
  if (!value || Number.isNaN(value)) {
    return fallback;
  }

  return Math.min(Math.max(value, 1), 100);
}

function toInputJsonValue(
  value: Prisma.JsonValue | null | undefined,
): Prisma.InputJsonValue | Prisma.NullableJsonNullValueInput | undefined {
  if (value === undefined) {
    return undefined;
  }

  if (value === null) {
    return Prisma.JsonNull;
  }

  return value as Prisma.InputJsonValue;
}

function asObject(value: Prisma.JsonValue | null | undefined): Record<string, unknown> {
  if (!value || typeof value !== 'object' || Array.isArray(value)) {
    return {};
  }

  return value as Record<string, unknown>;
}

function mapDepositDataset(dataset: any, userId?: string) {
  const favorite = Array.isArray(dataset.favorites)
    ? dataset.favorites.find((entry: { userId: string }) => entry.userId === userId)
    : undefined;

  const accessibility =
    dataset.accessLevel === 'OPEN'
      ? 'PUBLIC'
      : dataset.accessLevel === 'RESTRICTED'
        ? 'RESTRICTED'
        : 'CONTROLLED';

  return {
    id: dataset.id,
    slug: dataset.name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, ''),
    name: dataset.name,
    description: dataset.description ?? '',
    domain: dataset.domain,
    category: dataset.category ?? null,
    sourceName: dataset.sourceName,
    sourceUrl: dataset.sourceUrl,
    accessibility,
    visibility: dataset.visibility,
    isFeatured: dataset.isFeatured,
    isDepositListed: dataset.isDepositListed,
    depositStatus: dataset.depositStatus,
    tags: dataset.tags,
    rowCount: dataset.recordCount,
    columnCount: dataset.columnCount,
    sizeBytes: dataset.sizeBytes,
    mimeType: dataset.mimeType,
    schemaJson: dataset.schemaJson,
    previewRowsJson: dataset.previewRowsJson,
    metadataJson: dataset.metadataJson,
    publishedAt: dataset.publishedAt,
    updatedAt: dataset.updatedAt,
    isFavorite: Boolean(favorite),
  };
}

export async function listDepositDatasets(filters: ListDepositFilters, userId?: string) {
  // Optional: Check view permission
  if (userId) {
    await authorizeDepositOperation(userId, DepositPermission.VIEW);
  }

  const take = toPositiveInt(filters.pageSize, 50);
  const page = toPositiveInt(filters.page, 1);
  const skip = (page - 1) * take;

  const where: Prisma.DatasetWhereInput = {
    isDepositListed: true,
    depositStatus: 'AVAILABLE',
    ...(filters.domain ? { domain: filters.domain as any } : {}),
    ...(filters.accessibility
      ? {
          accessLevel:
            filters.accessibility === 'PUBLIC'
              ? 'OPEN'
              : filters.accessibility === 'RESTRICTED'
                ? 'RESTRICTED'
                : ({ in: ['INTERNAL', 'APPROVAL_REQUIRED'] } as any),
        }
      : {}),
    ...(filters.search
      ? {
          OR: [
            { name: { contains: filters.search, mode: 'insensitive' as const } },
            { description: { contains: filters.search, mode: 'insensitive' as const } },
            { category: { contains: filters.search, mode: 'insensitive' as const } },
            { sourceName: { contains: filters.search, mode: 'insensitive' as const } },
          ],
        }
      : {}),
  };

  const [datasets, total] = await prisma.$transaction([
    prisma.dataset.findMany({
      where,
      include: userId
        ? {
            favorites: {
              where: { userId },
              select: { userId: true },
            },
          }
        : undefined,
      orderBy: [{ isFeatured: 'desc' }, { publishedAt: 'desc' }, { updatedAt: 'desc' }],
      skip,
      take,
    }),
    prisma.dataset.count({ where }),
  ]);

  const items = datasets
    .map((dataset) => mapDepositDataset(dataset, userId))
    .filter((dataset) => (filters.favoritesOnly ? dataset.isFavorite : true));

  return {
    items,
    total,
    page,
    pageSize: take,
  };
}

export async function getDepositDatasetById(datasetId: string, userId?: string) {
  const dataset = await prisma.dataset.findUnique({
    where: { id: datasetId },
    include: {
      ...(userId
        ? {
            favorites: {
              where: { userId },
              select: { userId: true },
            },
          }
        : {}),
      fileAssets: {
        select: {
          id: true,
          originalName: true,
          mimeType: true,
          sizeBytes: true,
          createdAt: true,
        },
        orderBy: { createdAt: 'desc' },
        take: 10,
      },
    },
  });

  if (!dataset || !dataset.isDepositListed || dataset.depositStatus !== 'AVAILABLE') {
    throw new HttpError(404, 'Dataset not found in central repository');
  }

  await prisma.datasetAccessLog.create({
    data: {
      datasetId,
      userId,
      action: 'VIEW_DETAILS',
    },
  });

  const metadata = asObject(dataset.metadataJson);
  const artifactMetadata = {
    fileCount: dataset.fileAssets?.length ?? 0,
    files:
      dataset.fileAssets?.map((asset: { id: string; originalName: string; mimeType: string; sizeBytes: number; createdAt: Date }) => ({
        id: asset.id,
        name: asset.originalName,
        mimeType: asset.mimeType,
        sizeBytes: asset.sizeBytes,
        createdAt: asset.createdAt,
      })) ?? [],
    metadataFiles: Array.isArray(metadata.files)
      ? metadata.files
      : [],
  };

  return {
    ...mapDepositDataset(dataset, userId),
    schema: Array.isArray(dataset.schemaJson) ? dataset.schemaJson : [],
    license: (dataset.metadataJson as any)?.license ?? null,
    refreshCadence: (dataset.metadataJson as any)?.refreshCadence ?? null,
    provenance: (dataset.metadataJson as any)?.provenance ?? null,
    artifactMetadata,
  };
}

export async function previewDepositDataset(datasetId: string, userId?: string) {
  // Check preview permission
  if (userId) {
    await authorizeDepositOperation(userId, DepositPermission.PREVIEW);
  }

  const dataset = await prisma.dataset.findUnique({
    where: { id: datasetId },
    select: {
      id: true,
      name: true,
      schemaJson: true,
      previewRowsJson: true,
      recordCount: true,
      columnCount: true,
      updatedAt: true,
    },
  });

  if (!dataset) {
    throw new HttpError(404, 'Dataset not found');
  }

  await prisma.datasetAccessLog.create({
    data: {
      datasetId,
      userId,
      action: 'PREVIEW',
    },
  });

  const detailed = await getDepositDatasetById(datasetId, userId);
  const rows = Array.isArray(dataset.previewRowsJson) ? dataset.previewRowsJson : [];
  const firstRow = rows.length > 0 && typeof rows[0] === 'object' && rows[0] !== null ? rows[0] : null;
  const columns = firstRow ? Object.keys(firstRow as Record<string, unknown>) : [];

  return {
    dataset: detailed,
    columns,
    rows,
    artifactMetadata: (detailed as any).artifactMetadata ?? { fileCount: 0, files: [] },
    previewJobId: `preview_${datasetId}`,
    generatedAt: new Date().toISOString(),
  };
}

export async function getDepositDatasetLineage(datasetId: string, userId?: string) {
  const dataset = await prisma.dataset.findUnique({
    where: { id: datasetId },
    select: {
      id: true,
      name: true,
      version: true,
      workspaceId: true,
      metadataJson: true,
      updatedAt: true,
      isDepositListed: true,
      depositStatus: true,
    },
  });

  if (!dataset || !dataset.isDepositListed || dataset.depositStatus !== 'AVAILABLE') {
    throw new HttpError(404, 'Dataset not found in central repository');
  }

  const siblings = await prisma.dataset.findMany({
    where: {
      workspaceId: dataset.workspaceId,
      name: dataset.name,
    },
    select: {
      id: true,
      name: true,
      version: true,
      updatedAt: true,
    },
    orderBy: { version: 'asc' },
  });

  const nodes: Array<{
    id: string;
    label: string;
    version: number | null;
    updatedAt: Date | null;
    active: boolean;
  }> = siblings.map((item) => ({
    id: item.id,
    label: `${item.name} v${item.version}`,
    version: item.version,
    updatedAt: item.updatedAt,
    active: item.id === datasetId,
  }));

  const edges: Array<{ from?: string; to: string; relation: 'DERIVED_FROM' | 'DECLARED_PARENT' }> = siblings
    .slice(1)
    .map((item, index) => ({
      from: siblings[index]?.id,
      to: item.id,
      relation: 'DERIVED_FROM' as const,
    }))
    .filter((edge) => Boolean(edge.from));

  const metadata = asObject(dataset.metadataJson);
  const declaredParents = Array.isArray(metadata.parentDatasetIds)
    ? (metadata.parentDatasetIds as unknown[]).filter((entry): entry is string => typeof entry === 'string')
    : [];

  declaredParents.forEach((parentId) => {
    if (!nodes.some((node) => node.id === parentId)) {
      nodes.push({
        id: parentId,
        label: `Dataset ${parentId}`,
        version: null,
        updatedAt: null,
        active: false,
      });
    }

    edges.push({
      from: parentId,
      to: datasetId,
      relation: 'DECLARED_PARENT' as const,
    });
  });

  await prisma.datasetAccessLog.create({
    data: {
      datasetId,
      userId,
      action: 'VIEW_DETAILS',
      metadataJson: {
        view: 'lineage',
      },
    },
  });

  return {
    datasetId,
    nodes,
    edges,
  };
}

export async function createDepositDatasetAccessRequest(
  datasetId: string,
  user: AuthUser,
  input: { justification?: string; requestedRole?: string },
) {
  const dataset = await prisma.dataset.findUnique({
    where: { id: datasetId },
    select: {
      id: true,
      name: true,
      isDepositListed: true,
      depositStatus: true,
    },
  });

  if (!dataset || !dataset.isDepositListed || dataset.depositStatus !== 'AVAILABLE') {
    throw new HttpError(404, 'Dataset not found in central repository');
  }

  const accessRequest = await prisma.accessRequest.create({
    data: {
      requesterId: user.id,
      requestedRole: input.requestedRole?.trim() || `DATASET_ACCESS:${datasetId}`,
      justification: input.justification?.trim() || `Access request for dataset ${dataset.name}`,
      status: 'PENDING',
    },
  });

  await prisma.datasetAccessLog.create({
    data: {
      datasetId,
      userId: user.id,
      action: 'VIEW_DETAILS',
      metadataJson: {
        accessRequestId: accessRequest.id,
      },
    },
  });

  return {
    ok: true as const,
    accessRequestId: accessRequest.id,
    status: accessRequest.status,
  };
}

type DepositBulkOperationInput = {
  datasetIds: string[];
  operation: 'ARCHIVE' | 'EXPORT' | 'APPLY_GOVERNANCE_POLICY';
  governancePolicy?: 'PUBLIC' | 'RESTRICTED' | 'CONTROLLED';
};

export async function runDepositBulkOperation(input: DepositBulkOperationInput, user: AuthUser) {
  if (!input.datasetIds.length) {
    throw new HttpError(400, 'datasetIds must contain at least one dataset id');
  }

  const datasets = await prisma.dataset.findMany({
    where: {
      id: { in: input.datasetIds },
      isDepositListed: true,
    },
    select: {
      id: true,
      name: true,
      createdById: true,
    },
  });

  if (!datasets.length) {
    throw new HttpError(404, 'No deposit datasets found for requested ids');
  }

  const isAdmin = Boolean(user.roles?.includes('ADMIN') || user.roles?.includes('SUPER_ADMIN'));
  const ownerDatasetIds = new Set(datasets.filter((dataset) => dataset.createdById === user.id).map((dataset) => dataset.id));
  const unauthorized = isAdmin ? [] : datasets.filter((dataset) => !ownerDatasetIds.has(dataset.id)).map((dataset) => dataset.id);

  if (unauthorized.length) {
    throw new HttpError(403, `Not authorized to perform bulk operation on datasets: ${unauthorized.join(', ')}`);
  }

  if (input.operation === 'ARCHIVE') {
    await prisma.dataset.updateMany({
      where: { id: { in: datasets.map((dataset) => dataset.id) } },
      data: {
        isDepositListed: false,
        depositStatus: 'ARCHIVED',
      },
    });
  }

  if (input.operation === 'APPLY_GOVERNANCE_POLICY') {
    if (!input.governancePolicy) {
      throw new HttpError(400, 'governancePolicy is required when operation is APPLY_GOVERNANCE_POLICY');
    }

    const accessLevel =
      input.governancePolicy === 'PUBLIC'
        ? 'OPEN'
        : input.governancePolicy === 'RESTRICTED'
          ? 'RESTRICTED'
          : 'APPROVAL_REQUIRED';

    await prisma.dataset.updateMany({
      where: { id: { in: datasets.map((dataset) => dataset.id) } },
      data: {
        accessLevel,
      },
    });
  }

  const exportManifest =
    input.operation === 'EXPORT'
      ? datasets.map((dataset) => ({
          datasetId: dataset.id,
          name: dataset.name,
          downloadUrl: `/api/v1/datasets/deposit/${dataset.id}/download`,
        }))
      : undefined;

  await prisma.datasetAccessLog.createMany({
    data: datasets.map((dataset) => ({
      datasetId: dataset.id,
      userId: user.id,
      action: 'VIEW_DETAILS',
      metadataJson: {
        bulk: true,
        operation: input.operation,
        governancePolicy: input.governancePolicy,
      } as Prisma.InputJsonValue,
    })),
  });

  return {
    ok: true as const,
    operation: input.operation,
    affectedDatasetIds: datasets.map((dataset) => dataset.id),
    exportManifest,
  };
}

type SavedView = {
  id: string;
  name: string;
  filters: Record<string, unknown>;
  pinnedFilters: string[];
  createdAt: string;
};

function extractSavedViews(user: { notificationPreferences: Prisma.JsonValue | null }): SavedView[] {
  const prefs = asObject(user.notificationPreferences);
  const datasetsPrefs = asObject(prefs.datasets as Prisma.JsonValue | null | undefined);
  const savedViews = datasetsPrefs.savedViews;
  if (!Array.isArray(savedViews)) {
    return [];
  }

  return savedViews.filter((entry): entry is SavedView => {
    if (!entry || typeof entry !== 'object') {
      return false;
    }

    const candidate = entry as Record<string, unknown>;
    return typeof candidate.id === 'string' && typeof candidate.name === 'string';
  });
}

export async function listDepositSavedViews(user: AuthUser) {
  const profile = await prisma.user.findUnique({
    where: { id: user.id },
    select: { notificationPreferences: true },
  });

  if (!profile) {
    throw new HttpError(404, 'User not found');
  }

  return {
    items: extractSavedViews(profile),
  };
}

export async function createDepositSavedView(
  user: AuthUser,
  payload: { name: string; filters?: Record<string, unknown>; pinnedFilters?: string[] },
) {
  const profile = await prisma.user.findUnique({
    where: { id: user.id },
    select: { notificationPreferences: true },
  });

  if (!profile) {
    throw new HttpError(404, 'User not found');
  }

  const prefs = asObject(profile.notificationPreferences);
  const datasetsPrefs = asObject(prefs.datasets as Prisma.JsonValue | null | undefined);
  const current = extractSavedViews(profile);

  const savedView: SavedView = {
    id: `view_${Date.now().toString(36)}`,
    name: payload.name.trim(),
    filters: payload.filters ?? {},
    pinnedFilters: Array.isArray(payload.pinnedFilters) ? payload.pinnedFilters : [],
    createdAt: new Date().toISOString(),
  };

  const next = [...current, savedView].slice(-20);

  await prisma.user.update({
    where: { id: user.id },
    data: {
      notificationPreferences: {
        ...prefs,
        datasets: {
          ...datasetsPrefs,
          savedViews: next,
        },
      } as Prisma.InputJsonValue,
    },
  });

  return {
    ok: true as const,
    savedView,
  };
}

export async function deleteDepositSavedView(user: AuthUser, viewId: string) {
  const profile = await prisma.user.findUnique({
    where: { id: user.id },
    select: { notificationPreferences: true },
  });

  if (!profile) {
    throw new HttpError(404, 'User not found');
  }

  const prefs = asObject(profile.notificationPreferences);
  const datasetsPrefs = asObject(prefs.datasets as Prisma.JsonValue | null | undefined);
  const next = extractSavedViews(profile).filter((item) => item.id !== viewId);

  await prisma.user.update({
    where: { id: user.id },
    data: {
      notificationPreferences: {
        ...prefs,
        datasets: {
          ...datasetsPrefs,
          savedViews: next,
        },
      } as Prisma.InputJsonValue,
    },
  });

  return { ok: true as const };
}

export async function setDepositFavorite(datasetId: string, user: AuthUser, favorite: boolean) {
  // Check favorite permission
  await authorizeDepositOperation(user.id, DepositPermission.FAVORITE);

  if (favorite) {
    await prisma.datasetFavorite.upsert({
      where: {
        userId_datasetId: {
          userId: user.id,
          datasetId,
        },
      },
      create: {
        userId: user.id,
        datasetId,
      },
      update: {},
    });
  } else {
    await prisma.datasetFavorite.deleteMany({
      where: {
        userId: user.id,
        datasetId,
      },
    });
  }

  await prisma.datasetAccessLog.create({
    data: {
      datasetId,
      userId: user.id,
      action: favorite ? 'FAVORITED' : 'UNFAVORITED',
    },
  });

  return { ok: true as const };
}

export async function pullDepositDataset(datasetId: string, input: PullDepositInput, user: AuthUser) {
  // Check permissions
  await authorizeDepositOperation(user.id, DepositPermission.PULL);

  if (!input.workspaceId) {
    throw new HttpError(400, 'workspaceId is required');
  }

  await assertWorkspaceAction(input.workspaceId, user, WorkspaceAction.UPLOAD_DATASET);

  const sourceDataset = await prisma.dataset.findUnique({
    where: { id: datasetId },
  });

  if (!sourceDataset || !sourceDataset.isDepositListed || sourceDataset.depositStatus !== 'AVAILABLE') {
    throw new HttpError(404, 'Dataset not found in central repository');
  }

  // Create the pull request and enqueue the job
  const pullRequest = await prisma.datasetPullRequest.create({
    data: {
      datasetId,
      requestedById: user.id,
      workspaceId: input.workspaceId,
      selectedFields: input.selectedColumns ?? [],
      queryJson: {
        mode: input.mode ?? 'COPY',
        rowLimit: input.rowLimit,
        filterJson: input.filterJson ?? {},
      } as Prisma.InputJsonValue,
      status: 'QUEUED',
    },
  });

  // Log the pull request action
  await prisma.datasetAccessLog.create({
    data: {
      datasetId,
      userId: user.id,
      action: 'PULL_REQUESTED',
      metadataJson: {
        pullRequestId: pullRequest.id,
        workspaceId: input.workspaceId,
        selectedFieldCount: input.selectedColumns?.length ?? 0,
        mode: input.mode ?? 'COPY',
        rowLimit: input.rowLimit,
        enqueuedAt: new Date().toISOString(),
      },
    },
  });

  let queueMode: 'redis' | 'postgres-fallback' = 'redis';

  // Enqueue the pull job for async processing
  try {
    const payload = {
      pullRequestId: pullRequest.id,
      datasetId,
      workspaceId: input.workspaceId,
      userId: user.id,
      mode: (input.mode ?? 'COPY') as 'COPY' | 'VIRTUAL_VIEW',
      rowLimit: input.rowLimit,
      selectedFields: input.selectedColumns,
      filterJson: input.filterJson,
    };

    if (await isRedisReachable()) {
      const pullJobProcessor = new PullJobProcessor(prisma);
      await pullJobProcessor.enqueuePullJob(payload);
    } else {
      queueMode = 'postgres-fallback';
      setTimeout(() => {
        void processPullJobWithoutQueue(prisma, payload).catch((fallbackError) => {
          console.error('Fallback pull job processing failed', fallbackError);
        });
      }, 0);
    }
  } catch (error) {
    queueMode = 'postgres-fallback';
    console.warn('Failed to enqueue pull job in Redis. Falling back to PostgreSQL-backed async processing.', error);

    setTimeout(() => {
      void processPullJobWithoutQueue(prisma, {
        pullRequestId: pullRequest.id,
        datasetId,
        workspaceId: input.workspaceId,
        userId: user.id,
        mode: (input.mode ?? 'COPY') as 'COPY' | 'VIRTUAL_VIEW',
        rowLimit: input.rowLimit,
        selectedFields: input.selectedColumns,
        filterJson: input.filterJson,
      }).catch((fallbackError) => {
        console.error('Fallback pull job processing failed', fallbackError);
      });
    }, 0);
  }

  return {
    jobId: pullRequest.id,
    status: pullRequest.status,
    message:
      queueMode === 'redis'
        ? 'Pull job queued for processing'
        : 'Pull job queued for PostgreSQL-backed processing (Redis unavailable)',
    estimatedTime: queueMode === 'redis' ? '2-5 minutes' : '2-8 minutes',
  };
}

export async function getDepositPullRequestStatus(pullRequestId: string, user: AuthUser) {
  const pullRequest = await prisma.datasetPullRequest.findUnique({
    where: { id: pullRequestId },
    select: {
      id: true,
      datasetId: true,
      requestedById: true,
      status: true,
      errorMessage: true,
      createdAt: true,
      updatedAt: true,
      completedAt: true,
      dataset: {
        select: {
          name: true,
        },
      },
    },
  });

  if (!pullRequest) {
    throw new HttpError(404, 'Pull request not found');
  }

  const isOwner = pullRequest.requestedById === user.id;
  const isAdmin = Boolean(user.roles?.includes('ADMIN') || user.roles?.includes('SUPER_ADMIN'));

  if (!isOwner && !isAdmin) {
    throw new HttpError(403, 'You do not have access to this pull request status');
  }

  return {
    jobId: pullRequest.id,
    datasetId: pullRequest.datasetId,
    datasetName: pullRequest.dataset?.name ?? null,
    status: pullRequest.status,
    errorMessage: pullRequest.errorMessage,
    createdAt: pullRequest.createdAt,
    updatedAt: pullRequest.updatedAt,
    completedAt: pullRequest.completedAt,
  };
}

export async function getDepositPullRequestStatusDebug(pullRequestId: string) {
  const pullRequest = await prisma.datasetPullRequest.findUnique({
    where: { id: pullRequestId },
    select: {
      id: true,
      datasetId: true,
      requestedById: true,
      workspaceId: true,
      status: true,
      errorMessage: true,
      createdAt: true,
      updatedAt: true,
      completedAt: true,
      dataset: {
        select: {
          name: true,
        },
      },
    },
  });

  if (!pullRequest) {
    throw new HttpError(404, 'Pull request not found');
  }

  return {
    jobId: pullRequest.id,
    datasetId: pullRequest.datasetId,
    datasetName: pullRequest.dataset?.name ?? null,
    requestedById: pullRequest.requestedById,
    workspaceId: pullRequest.workspaceId,
    status: pullRequest.status,
    errorMessage: pullRequest.errorMessage,
    createdAt: pullRequest.createdAt,
    updatedAt: pullRequest.updatedAt,
    completedAt: pullRequest.completedAt,
  };
}

export async function triggerFallbackPullByRequestId(pullRequestId: string) {
  const pullRequest = await prisma.datasetPullRequest.findUnique({
    where: { id: pullRequestId },
    select: {
      id: true,
      datasetId: true,
      workspaceId: true,
      requestedById: true,
      selectedFields: true,
      queryJson: true,
      status: true,
    },
  });

  if (!pullRequest) {
    throw new HttpError(404, 'Pull request not found');
  }

  if (pullRequest.status === 'RUNNING') {
    throw new HttpError(409, 'Pull request is already running');
  }

  const query =
    pullRequest.queryJson && typeof pullRequest.queryJson === 'object' && !Array.isArray(pullRequest.queryJson)
      ? (pullRequest.queryJson as Record<string, unknown>)
      : {};

  const mode = query.mode === 'VIRTUAL_VIEW' ? 'VIRTUAL_VIEW' : 'COPY';
  const rowLimit = typeof query.rowLimit === 'number' ? query.rowLimit : undefined;
  const filterJson =
    query.filterJson && typeof query.filterJson === 'object' && !Array.isArray(query.filterJson)
      ? (query.filterJson as Record<string, unknown>)
      : undefined;

  // Reset to QUEUED before forcing fallback execution to replay lifecycle transitions.
  await prisma.datasetPullRequest.update({
    where: { id: pullRequest.id },
    data: {
      status: 'QUEUED',
      errorMessage: null,
      completedAt: null,
    },
  });

  setTimeout(() => {
    void processPullJobWithoutQueue(prisma, {
      pullRequestId: pullRequest.id,
      datasetId: pullRequest.datasetId,
      workspaceId: pullRequest.workspaceId,
      userId: pullRequest.requestedById,
      mode,
      rowLimit,
      selectedFields: pullRequest.selectedFields,
      filterJson,
    }).catch((error) => {
      console.error('Manual fallback pull processing failed', error);
    });
  }, 0);

  return {
    ok: true as const,
    jobId: pullRequest.id,
    status: 'QUEUED' as const,
    message: 'Fallback pull execution triggered',
  };
}

function toCsv(rows: Array<Record<string, unknown>>) {
  if (!rows.length) {
    return '';
  }

  const headers = Object.keys(rows[0]);
  const escapeCell = (value: unknown) => {
    const raw = value == null ? '' : String(value);
    if (raw.includes('"') || raw.includes(',') || raw.includes('\n')) {
      return `"${raw.replace(/"/g, '""')}"`;
    }
    return raw;
  };

  const lines = [
    headers.join(','),
    ...rows.map((row) => headers.map((header) => escapeCell(row[header])).join(',')),
  ];

  return lines.join('\n');
}

export async function getDepositDatasetDownload(datasetId: string, user?: AuthUser) {
  const dataset = await prisma.dataset.findUnique({
    where: { id: datasetId },
    select: {
      id: true,
      name: true,
      previewRowsJson: true,
      schemaJson: true,
      mimeType: true,
      isDepositListed: true,
      depositStatus: true,
    },
  });

  if (!dataset || !dataset.isDepositListed || dataset.depositStatus !== 'AVAILABLE') {
    throw new HttpError(404, 'Dataset not found in central repository');
  }

  const rows = Array.isArray(dataset.previewRowsJson)
    ? (dataset.previewRowsJson as Array<Record<string, unknown>>)
    : [];

  const content = toCsv(rows);
  const baseName = dataset.name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '') || dataset.id;

  return {
    fileName: `${baseName}.csv`,
    contentType: 'text/csv; charset=utf-8',
    content,
  };
}

export async function archiveDepositDataset(datasetId: string, user: AuthUser) {
  const dataset = await prisma.dataset.findUnique({
    where: { id: datasetId },
    select: { id: true, createdById: true, isDepositListed: true },
  });

  if (!dataset || !dataset.isDepositListed) {
    throw new HttpError(404, 'Dataset not found in central repository');
  }

  const isAdmin = Boolean(user.roles?.includes('ADMIN') || user.roles?.includes('SUPER_ADMIN'));
  const isOwner = dataset.createdById === user.id;

  if (!isAdmin && !isOwner) {
    throw new HttpError(403, 'Only the dataset owner or admin can archive this dataset');
  }

  await prisma.dataset.update({
    where: { id: datasetId },
    data: {
      isDepositListed: false,
      depositStatus: 'ARCHIVED',
    },
  });

  return { ok: true as const };
}

function mapSeverityFromAction(action: string): 'LOW' | 'MEDIUM' | 'HIGH' {
  if (/DELETE|REJECT|SUSPEND|FAIL|ARCHIVE/i.test(action)) return 'HIGH';
  if (/PULL|APPROVE|UPDATE|ROLE|STATUS|REGISTER|FAVORIT/i.test(action)) return 'MEDIUM';
  return 'LOW';
}

export async function getDatasetAuditTrail(datasetId: string) {
  const logs = await prisma.datasetAccessLog.findMany({
    where: { datasetId },
    orderBy: { createdAt: 'desc' },
    take: 50,
    include: {
      user: {
        select: { firstname: true, surname: true, email: true },
      },
    },
  });

  return {
    events: logs.map((log) => ({
      id: log.id,
      action: log.action,
      actor: log.user
        ? `${log.user.firstname} ${log.user.surname}`.trim() || log.user.email
        : 'System',
      createdAt: log.createdAt.toISOString(),
      severity: mapSeverityFromAction(log.action),
    })),
  };
}

