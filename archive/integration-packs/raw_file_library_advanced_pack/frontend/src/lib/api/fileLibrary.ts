export type RawFileAsset = {
  id: string;
  workspaceId: string;
  name: string;
  path: string;
  kind: 'file' | 'folder' | 'archive';
  mimeType?: string;
  sizeBytes: number;
  checksum?: string;
  status: 'uploaded' | 'indexed' | 'extracted' | 'registered' | 'failed';
  datasetCandidate: boolean;
  createdAt: string;
};

export type FileLibraryOverview = {
  totalFiles: number;
  folders: number;
  archives: number;
  uploadedToday: number;
  datasetCandidates: number;
  extractedAssets: number;
};

const API_BASE = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:4000';

export async function getFileLibrary(workspaceId = 'default') {
  const res = await fetch(`${API_BASE}/api/file-library?workspaceId=${workspaceId}`, { cache: 'no-store' });
  if (!res.ok) throw new Error('Failed to load file library');
  return res.json() as Promise<{ overview: FileLibraryOverview; assets: RawFileAsset[] }>;
}

export async function uploadWorkspaceFiles(workspaceId: string, files: File[]) {
  const form = new FormData();
  form.append('workspaceId', workspaceId);
  files.forEach((file) => form.append('files', file));
  const res = await fetch(`${API_BASE}/api/file-library/upload`, { method: 'POST', body: form });
  if (!res.ok) throw new Error('Upload failed');
  return res.json();
}

export async function extractArchive(assetId: string) {
  const res = await fetch(`${API_BASE}/api/file-library/${assetId}/extract`, { method: 'POST' });
  if (!res.ok) throw new Error('Extraction failed');
  return res.json();
}

export async function registerFileAsDataset(assetId: string) {
  const res = await fetch(`${API_BASE}/api/file-library/${assetId}/register-dataset`, { method: 'POST' });
  if (!res.ok) throw new Error('Dataset registration failed');
  return res.json();
}

export async function sendFileToProfiling(assetId: string) {
  const res = await fetch(`${API_BASE}/api/file-library/${assetId}/send-to-profiling`, { method: 'POST' });
  if (!res.ok) throw new Error('Profiling handoff failed');
  return res.json();
}
