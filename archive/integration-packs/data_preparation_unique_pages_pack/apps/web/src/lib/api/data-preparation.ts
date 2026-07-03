export type PrepStage =
  | 'profiling'
  | 'cleaning'
  | 'harmonization'
  | 'features'
  | 'quality'
  | 'versions';

const API_BASE = process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:4000';

async function request<T>(path: string, options?: RequestInit): Promise<T> {
  const res = await fetch(`${API_BASE}${path}`, {
    headers: { 'Content-Type': 'application/json', ...(options?.headers || {}) },
    ...options,
  });
  if (!res.ok) throw new Error(await res.text());
  return res.json();
}

export const dataPreparationApi = {
  stage: (stage: PrepStage, datasetId = 'sdoh-demo') =>
    request(`/api/data-preparation/stages/${stage}?datasetId=${datasetId}`),

  runStage: (stage: PrepStage, datasetId = 'sdoh-demo') =>
    request(`/api/data-preparation/stages/${stage}/run`, {
      method: 'POST',
      body: JSON.stringify({ datasetId }),
    }),

  previewChanges: (stage: PrepStage, datasetId = 'sdoh-demo') =>
    request(`/api/data-preparation/stages/${stage}/preview?datasetId=${datasetId}`),

  saveVersion: (stage: PrepStage, datasetId = 'sdoh-demo') =>
    request(`/api/data-preparation/stages/${stage}/save-version`, {
      method: 'POST',
      body: JSON.stringify({ datasetId }),
    }),

  handoffFromDatabaseStudio: (payload: {
    queryId?: string;
    sourceConnectionId: string;
    datasetName: string;
    sql: string;
  }) =>
    request('/api/data-preparation/handoff/database-studio', {
      method: 'POST',
      body: JSON.stringify(payload),
    }),
};
