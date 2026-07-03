const API_BASE = process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:4000';

async function api<T>(path: string, options?: RequestInit): Promise<T> {
  const res = await fetch(`${API_BASE}/api/data-preparation${path}`, {
    ...options,
    headers: { 'Content-Type': 'application/json', ...(options?.headers || {}) },
  });
  if (!res.ok) throw new Error(`Data Preparation API failed: ${res.status}`);
  return res.json();
}

export const dataPreparationApi = {
  overview: () => api('/overview'),
  stage: (stage: string) => api(`/stage/${stage}`),
  runProfiling: (datasetId?: string) => api('/profiling/run', { method: 'POST', body: JSON.stringify({ datasetId }) }),
  runCleaning: (datasetId?: string) => api('/cleaning/run', { method: 'POST', body: JSON.stringify({ datasetId }) }),
  runHarmonization: (datasetId?: string) => api('/harmonization/run', { method: 'POST', body: JSON.stringify({ datasetId }) }),
  runFeatures: (datasetId?: string) => api('/features/run', { method: 'POST', body: JSON.stringify({ datasetId }) }),
  runQuality: (datasetId?: string) => api('/quality/run', { method: 'POST', body: JSON.stringify({ datasetId }) }),
  createVersion: (datasetId?: string, notes?: string) =>
    api('/versioning/create', { method: 'POST', body: JSON.stringify({ datasetId, notes }) }),
  handoffResearchStudio: (datasetId: string) =>
    api('/handoff/research-studio', { method: 'POST', body: JSON.stringify({ datasetId }) }),
};
