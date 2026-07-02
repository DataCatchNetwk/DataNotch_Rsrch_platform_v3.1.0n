import { apiRequest } from '@/src/lib/api/client';

export type DatasetRegistryStage = 'raw' | 'clean' | 'harmonized' | 'features';

export type DatasetRegistryItem = {
  id: string;
  name: string;
  stage: DatasetRegistryStage;
  source: string;
  owner: string;
  records: number;
  variables: number;
  qualityScore: number;
  status: string;
  version: string;
  lastUpdated: string;
  tags: string[];
  sizeBytes: number;
  workspace: string;
  domain: string;
};

export type DatasetRegistrySummary = {
  totals: Record<DatasetRegistryStage | 'records' | 'variables' | 'storageBytes', number>;
  qualityScore: number;
  updatedAt: string;
};

export type DatasetLineagePayload = {
  nodes: Array<{ id: string; label: string; stage: string }>;
  edges: Array<{ from: string; to: string; operation: string; description?: string | null }>;
};

const basePath = '/v1/dataset-registry';

export const datasetRegistryApi = {
  summary() {
    return apiRequest<DatasetRegistrySummary>(`${basePath}/summary`);
  },

  byStage(stage: DatasetRegistryStage) {
    return apiRequest<{ items: DatasetRegistryItem[] }>(`${basePath}/${stage}`).then((response) => response.items);
  },

  catalog() {
    return apiRequest<{ items: DatasetRegistryItem[] }>(`${basePath}/catalog`).then((response) => response.items);
  },

  lineage() {
    return apiRequest<DatasetLineagePayload>(`${basePath}/lineage`);
  },

  profile(datasetId: string) {
    return apiRequest<{ ok: boolean; message: string; datasetId: string }>(`${basePath}/${datasetId}/profile`, {
      method: 'POST',
      json: {},
    });
  },

  handoff(datasetId: string, target: string) {
    return apiRequest<{ ok: boolean; message: string; datasetId: string; target: string; status: string }>(
      `${basePath}/${datasetId}/handoff`,
      {
        method: 'POST',
        json: { target },
      },
    );
  },

  requestAccess(datasetId: string, justification?: string) {
    return apiRequest<{ ok: boolean; message: string; datasetId: string; status: string }>(
      `${basePath}/${datasetId}/request-access`,
      {
        method: 'POST',
        json: { justification },
      },
    );
  },
};
