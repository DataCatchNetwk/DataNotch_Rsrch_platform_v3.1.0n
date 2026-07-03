const API_BASE = process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:4000/api';

export async function handoffAnalysisToOutputs(analysisJobId: string, payload: {
  workspaceId: string;
  outputType?: string;
  title?: string;
}) {
  const res = await fetch(`${API_BASE}/analysis-jobs/${analysisJobId}/handoff-to-outputs`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });
  if (!res.ok) throw new Error('Failed to handoff analysis result to outputs');
  return res.json();
}
