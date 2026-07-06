import { apiRequest } from '@/src/lib/api/client';
import { apiPathUrl } from '@/lib/api-base';

export type DepositAccessibility = 'PUBLIC' | 'RESTRICTED' | 'CONTROLLED';
export type DepositDomain =
  | 'HEALTH'
  | 'SOCIAL'
  | 'CLIMATE'
  | 'ECONOMIC'
  | 'DEMOGRAPHIC'
  | 'EDUCATION'
  | 'ENVIRONMENT'
  | 'MOBILITY'
  | 'GENOMICS'
  | 'IMAGING'
  | 'WEARABLE'
  | 'SURVEY'
  | 'OTHER';

export interface DepositDatasetSummary {
  id: string;
  slug: string;
  name: string;
  description: string;
  domain: DepositDomain;
  tags: string[];
  sourceName?: string | null;
  sourceUrl?: string | null;
  sizeBytes?: number | null;
  rowCount?: number | null;
  columnCount?: number | null;
  recordCount?: number | null;
  updatedAt: string;
  accessibility: DepositAccessibility;
  isFavorite?: boolean;
}

export type DepositDataset = DepositDatasetSummary;

export interface DepositDatasetDetail extends DepositDatasetSummary {
  schema?: Array<{ name: string; type: string; nullable?: boolean }>;
  license?: string | null;
  refreshCadence?: string | null;
  provenance?: string | null;
}

export interface DepositPreviewResponse {
  dataset: DepositDatasetDetail;
  columns: string[];
  rows: Array<Record<string, unknown>>;
  artifactMetadata?: {
    fileCount?: number;
    files?: Array<{
      id?: string;
      name?: string;
      mimeType?: string;
      sizeBytes?: number;
      createdAt?: string;
    }>;
  };
  previewJobId?: string;
  generatedAt: string;
}

export interface PullToWorkspacePayload {
  workspaceId: string;
  mode: 'COPY' | 'VIRTUAL_VIEW';
  selectedColumns?: string[];
  rowLimit?: number;
  filterJson?: Record<string, unknown>;
}

export interface PullDepositResponse {
  jobId: string;
  status: 'QUEUED' | 'RUNNING' | 'COMPLETED' | 'FAILED' | string;
  message?: string;
  estimatedTime?: string;
}

export interface PullDepositStatusResponse {
  jobId: string;
  datasetId: string;
  datasetName: string | null;
  status: 'QUEUED' | 'RUNNING' | 'COMPLETED' | 'FAILED' | string;
  errorMessage?: string | null;
  createdAt?: string;
  updatedAt?: string;
  completedAt?: string | null;
}

export interface DepositLineageResponse {
  datasetId: string;
  nodes: Array<{
    id: string;
    label: string;
    version?: number | null;
    updatedAt?: string | null;
    active: boolean;
  }>;
  edges: Array<{
    from?: string;
    to: string;
    relation: 'DERIVED_FROM' | 'DECLARED_PARENT';
  }>;
}

export interface DepositSavedView {
  id: string;
  name: string;
  filters: Record<string, unknown>;
  pinnedFilters: string[];
  createdAt: string;
}

export async function listDepositDatasets(params?: {
  search?: string;
  domain?: string;
  accessibility?: string;
  favoritesOnly?: boolean;
  page?: number;
  pageSize?: number;
}) {
  const qs = new URLSearchParams();
  if (params?.search) qs.set('search', params.search);
  if (params?.domain) qs.set('domain', params.domain);
  if (params?.accessibility) qs.set('accessibility', params.accessibility);
  if (params?.favoritesOnly) qs.set('favoritesOnly', 'true');
  if (params?.page) qs.set('page', String(params.page));
  if (params?.pageSize) qs.set('pageSize', String(params.pageSize));

  const query = qs.toString();
  return apiRequest<{ items: DepositDatasetSummary[]; total: number; page: number; pageSize: number }>(
    `/v1/datasets/deposit${query ? `?${query}` : ''}`,
  );
}

export async function getDepositDataset(id: string) {
  return apiRequest<DepositDatasetDetail>(`/v1/datasets/deposit/${id}`);
}

export async function previewDepositDataset(id: string) {
  return apiRequest<DepositPreviewResponse>(`/v1/datasets/deposit/${id}/preview`);
}

export async function pullDepositDataset(id: string, body: PullToWorkspacePayload) {
  return apiRequest<PullDepositResponse>(`/v1/datasets/deposit/${id}/pull`, {
    method: 'POST',
    json: body,
  });
}

export async function getDepositPullStatus(pullRequestId: string) {
  return apiRequest<PullDepositStatusResponse>(`/v1/datasets/deposit/pull-requests/${pullRequestId}`);
}

export function getDepositPullStatusStreamUrl(pullRequestId: string) {
  return apiPathUrl(`/v1/datasets/deposit/pull-requests/${pullRequestId}/stream`);
}

export async function getDepositDatasetLineage(datasetId: string) {
  return apiRequest<DepositLineageResponse>(`/v1/datasets/deposit/${datasetId}/lineage`);
}

export async function createDepositAccessRequest(
  datasetId: string,
  payload: { justification?: string; requestedRole?: string },
) {
  return apiRequest<{ ok: true; accessRequestId: string; status: string }>(
    `/v1/datasets/deposit/${datasetId}/access-request`,
    {
      method: 'POST',
      json: payload,
    },
  );
}

export async function bulkDepositOperation(payload: {
  datasetIds: string[];
  operation: 'ARCHIVE' | 'EXPORT' | 'APPLY_GOVERNANCE_POLICY';
  governancePolicy?: 'PUBLIC' | 'RESTRICTED' | 'CONTROLLED';
}) {
  return apiRequest<{
    ok: true;
    operation: string;
    affectedDatasetIds: string[];
    exportManifest?: Array<{ datasetId: string; name: string; downloadUrl: string }>;
  }>('/v1/datasets/deposit/bulk', {
    method: 'POST',
    json: payload,
  });
}

export async function listDepositSavedViews() {
  return apiRequest<{ items: DepositSavedView[] }>('/v1/datasets/deposit/saved-views');
}

export async function createDepositSavedView(payload: {
  name: string;
  filters?: Record<string, unknown>;
  pinnedFilters?: string[];
}) {
  return apiRequest<{ ok: true; savedView: DepositSavedView }>('/v1/datasets/deposit/saved-views', {
    method: 'POST',
    json: payload,
  });
}

export async function deleteDepositSavedView(viewId: string) {
  return apiRequest<{ ok: true }>(`/v1/datasets/deposit/saved-views/${viewId}`, {
    method: 'DELETE',
  });
}

export async function toggleFavoriteDataset(id: string, favorite: boolean) {
  return apiRequest<{ ok: true }>(`/v1/datasets/deposit/${id}/favorite`, {
    method: 'POST',
    json: { favorite },
  });
}

export async function favoriteDepositDataset(id: string) {
  return toggleFavoriteDataset(id, true);
}

export async function unfavoriteDepositDataset(id: string) {
  return toggleFavoriteDataset(id, false);
}
