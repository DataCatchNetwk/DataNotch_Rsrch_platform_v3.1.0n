const API_BASE = process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:4000';

export async function sendDatasetToPreparation(datasetId: string, stage = 'profiling') {
  const res = await fetch(`${API_BASE}/api/data-preparation/${stage}/run`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ datasetId }),
  });
  if (!res.ok) throw new Error('Failed to hand off dataset to Data Preparation');
  return res.json();
}
