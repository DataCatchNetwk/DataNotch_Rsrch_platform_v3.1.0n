export type DatasetStage = 'raw' | 'clean' | 'harmonized' | 'features' | 'lineage' | 'catalog';

export type RegistryDataset = {
  id: string;
  name: string;
  stage: DatasetStage;
  source: string;
  owner: string;
  records: number;
  variables: number;
  qualityScore: number;
  status: 'Imported' | 'Profiling' | 'Clean' | 'Approved' | 'Restricted' | 'Ready' | 'Needs Review';
  version: string;
  lastUpdated: string;
  nextAction: string;
  tags: string[];
};

export type LineageNode = {
  id: string;
  label: string;
  type: string;
  status: string;
};

export type LineageEdge = {
  from: string;
  to: string;
  label: string;
};

const API_BASE = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:4000';

async function getJson<T>(path: string): Promise<T> {
  const res = await fetch(`${API_BASE}${path}`, { cache: 'no-store' });
  if (!res.ok) throw new Error(`Request failed: ${res.status}`);
  return res.json();
}

async function postJson<T>(path: string, body: unknown): Promise<T> {
  const res = await fetch(`${API_BASE}${path}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
  if (!res.ok) throw new Error(`Request failed: ${res.status}`);
  return res.json();
}

export const datasetRegistryApi = {
  summary: () => getJson<any>('/api/dataset-registry/summary'),
  raw: () => getJson<RegistryDataset[]>('/api/dataset-registry/raw'),
  clean: () => getJson<RegistryDataset[]>('/api/dataset-registry/clean'),
  harmonized: () => getJson<RegistryDataset[]>('/api/dataset-registry/harmonized'),
  features: () => getJson<RegistryDataset[]>('/api/dataset-registry/features'),
  lineage: () => getJson<{ nodes: LineageNode[]; edges: LineageEdge[] }>('/api/dataset-registry/lineage'),
  catalog: () => getJson<RegistryDataset[]>('/api/dataset-registry/catalog'),
  handoff: (id: string, target: string) => postJson(`/api/dataset-registry/${id}/handoff`, { target }),
  profile: (id: string) => postJson(`/api/dataset-registry/${id}/profile`, {}),
  requestAccess: (id: string) => postJson(`/api/dataset-registry/${id}/request-access`, {}),
};
