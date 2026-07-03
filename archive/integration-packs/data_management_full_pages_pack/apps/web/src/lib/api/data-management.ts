export type DataManagementSummary = {
  files: number;
  folders: number;
  archives: number;
  uploadedToday: number;
  connectedSources: number;
  datasets: number;
  rawDatasets: number;
  cleanDatasets: number;
  harmonizedDatasets: number;
  featureSets: number;
};

export type RawFileAsset = {
  id: string;
  workspaceId: string;
  name: string;
  kind: 'csv' | 'xlsx' | 'json' | 'parquet' | 'pdf' | 'docx' | 'image' | 'folder' | 'zip' | 'other';
  size: string;
  path: string;
  status: 'uploaded' | 'extracted' | 'indexed' | 'candidate' | 'registered';
  datasetCandidate: boolean;
  createdAt: string;
};

export type DataSource = {
  id: string;
  name: string;
  engine: string;
  sourceClass: string;
  owner: string;
  environment: string;
  records: number;
  status: 'healthy' | 'degraded' | 'offline';
  latencyMs: number | null;
  lastSync: string;
};

export type DatasetAsset = {
  id: string;
  name: string;
  stage: 'raw' | 'clean' | 'harmonized' | 'feature_set';
  source: string;
  owner: string;
  records: number;
  variables: number;
  qualityScore: number;
  version: string;
  status: 'draft' | 'active' | 'approved' | 'restricted';
  updatedAt: string;
};

const API_BASE = process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:4000';

async function request<T>(path: string, init?: RequestInit): Promise<T> {
  const response = await fetch(`${API_BASE}${path}`, {
    ...init,
    headers: {
      'Content-Type': 'application/json',
      ...(init?.headers || {}),
    },
    cache: 'no-store',
  });

  if (!response.ok) {
    throw new Error(`Data Management API failed: ${response.status}`);
  }

  return response.json();
}

export const dataManagementApi = {
  summary: () => request<DataManagementSummary>('/api/data-management/summary'),
  files: () => request<RawFileAsset[]>('/api/data-management/files'),
  sources: () => request<DataSource[]>('/api/data-management/sources'),
  datasets: (stage?: string) => request<DatasetAsset[]>(`/api/data-management/datasets${stage ? `?stage=${stage}` : ''}`),
  lineage: () => request('/api/data-management/lineage'),
  catalog: () => request('/api/data-management/catalog'),
  registerFileAsDataset: (fileId: string) =>
    request(`/api/data-management/files/${fileId}/register-dataset`, { method: 'POST' }),
  sendDatasetToPreparation: (datasetId: string) =>
    request(`/api/data-management/datasets/${datasetId}/send-to-preparation`, { method: 'POST' }),
  workspaceHandoff: (payload: unknown) =>
    request('/api/data-management/workspace-handoff', { method: 'POST', body: JSON.stringify(payload) }),
};
