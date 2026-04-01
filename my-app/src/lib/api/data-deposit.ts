import { apiRequest } from '@/src/lib/api/client';

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
  recordCount?: number | null;
  updatedAt: string;
  accessibility: DepositAccessibility;
  isFavorite?: boolean;
}

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

export async function toggleFavoriteDataset(id: string, favorite: boolean) {
  return apiRequest<{ ok: true }>(`/v1/datasets/deposit/${id}/favorite`, {
    method: 'POST',
    json: { favorite },
  });
}
