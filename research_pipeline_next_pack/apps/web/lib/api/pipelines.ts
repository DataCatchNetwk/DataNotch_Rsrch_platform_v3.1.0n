import type { PipelineMetrics, PipelineState } from '../types/pipeline';

const API = process.env.NEXT_PUBLIC_API_BASE_URL ?? 'http://localhost:4000';

export async function fetchPipelines(): Promise<{ items: PipelineState[]; metrics: PipelineMetrics }> {
  const res = await fetch(`${API}/api/pipelines`, { cache: 'no-store' });
  if (!res.ok) throw new Error('Failed to load pipelines');
  return res.json();
}

export async function fetchPipeline(pipelineId: string): Promise<PipelineState> {
  const res = await fetch(`${API}/api/pipelines/${pipelineId}`, { cache: 'no-store' });
  if (!res.ok) throw new Error('Failed to load pipeline');
  return res.json();
}

export async function retryPipelineStage(pipelineId: string, stage: string): Promise<PipelineState> {
  const res = await fetch(`${API}/api/pipelines/${pipelineId}/retry/${stage}`, {
    method: 'POST',
    cache: 'no-store',
  });
  if (!res.ok) throw new Error('Failed to retry pipeline stage');
  return res.json();
}
