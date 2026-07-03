export type OutputType =
  | 'dashboard'
  | 'visualization'
  | 'report'
  | 'publication'
  | 'manuscript'
  | 'executive_summary'
  | 'presentation'
  | 'data_export'
  | 'model_export'
  | 'api_output';

const API_BASE = process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:4000/api';

export async function listOutputs(workspaceId?: string) {
  const q = workspaceId ? `?workspaceId=${encodeURIComponent(workspaceId)}` : '';
  const res = await fetch(`${API_BASE}/outputs${q}`, { cache: 'no-store' });
  if (!res.ok) throw new Error('Failed to load outputs');
  return res.json();
}

export async function createOutput(payload: {
  workspaceId: string;
  outputType: OutputType;
  title: string;
  analysisJobId?: string;
}) {
  const res = await fetch(`${API_BASE}/outputs`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });
  if (!res.ok) throw new Error('Failed to create output');
  return res.json();
}

export async function generateAllOutputs(workspaceId: string, analysisJobId?: string) {
  const res = await fetch(`${API_BASE}/outputs/generate-all`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ workspaceId, analysisJobId }),
  });
  if (!res.ok) throw new Error('Failed to generate outputs');
  return res.json();
}

export async function exportOutput(id: string, format: string) {
  const res = await fetch(`${API_BASE}/outputs/${id}/export`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ format }),
  });
  if (!res.ok) throw new Error('Failed to export output');
  return res.json();
}
