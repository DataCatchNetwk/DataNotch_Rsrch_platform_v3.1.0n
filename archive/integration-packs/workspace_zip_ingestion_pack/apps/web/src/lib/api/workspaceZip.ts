export type WorkspaceFileNode = {
  id: string;
  kind: 'FOLDER' | 'FILE' | 'ARCHIVE';
  name: string;
  relativePath: string;
  extension?: string;
  sizeBytes: number;
  isDatasetCandidate: boolean;
  datasetId?: string | null;
  children?: WorkspaceFileNode[];
};

const API_BASE = process.env.NEXT_PUBLIC_API_URL ?? '';

export async function uploadWorkspaceZip(workspaceId: string, file: File) {
  const form = new FormData();
  form.append('file', file);
  const res = await fetch(`${API_BASE}/api/workspaces/${workspaceId}/uploads/zip`, {
    method: 'POST',
    body: form,
  });
  if (!res.ok) throw new Error(await res.text());
  return res.json();
}

export async function fetchWorkspaceFiles(workspaceId: string): Promise<WorkspaceFileNode[]> {
  const res = await fetch(`${API_BASE}/api/workspaces/${workspaceId}/files`);
  if (!res.ok) throw new Error(await res.text());
  return res.json();
}

export async function registerWorkspaceFileDataset(workspaceId: string, fileId: string) {
  const res = await fetch(`${API_BASE}/api/workspaces/${workspaceId}/files/${fileId}/register-dataset`, {
    method: 'POST',
  });
  if (!res.ok) throw new Error(await res.text());
  return res.json();
}

export async function sendWorkspaceFileToPreparation(workspaceId: string, fileId: string, stage = 'DATA_PROFILING') {
  const res = await fetch(`${API_BASE}/api/workspaces/${workspaceId}/files/${fileId}/send-to-preparation`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ stage }),
  });
  if (!res.ok) throw new Error(await res.text());
  return res.json();
}

export async function fetchWorkspaceRegistryDatasets(workspaceId: string) {
  const res = await fetch(`${API_BASE}/api/dataset-registry/from-workspace/${workspaceId}`);
  if (!res.ok) throw new Error(await res.text());
  return res.json();
}
