import { api } from '@/lib/api/client';

export type OpsHealth = {
  status: 'ready' | 'degraded';
  generatedAt: string;
  environment: string;
  checks: {
    database: { ok: boolean; latencyMs: number | null; message: string };
    queue: { backend: string; redisReachable: boolean; mode: string };
    workers: WorkerSummary;
  };
  requestId?: string;
};

export type WorkerSummary = {
  queued: number;
  active: number;
  retrying: number;
  failed: number;
  completed: number;
  canceled: number;
};

export type OpsSummary = {
  generatedAt: string;
  system: {
    environment: string;
    queueBackend: string;
    redisReachable: boolean;
    authNetworkBlockEnabled: boolean;
    authNetworkFailClosed: boolean;
  };
  totals: {
    users: number;
    workspaces: number;
    datasets: number;
    pipelineRuns: number;
    communicationRooms: number;
  };
  workers: WorkerSummary;
  recommendations: string[];
};

export type WorkerJobItem = {
  id: string;
  pipelineRunId: string;
  pipelineStepId?: string | null;
  queueName: string;
  jobName: string;
  workerType: string;
  status: string;
  attempt: number;
  progressPercent: number;
  startedAt?: string | null;
  completedAt?: string | null;
  updatedAt: string;
  errorJson?: unknown;
};

export async function getOpsHealth() {
  const { data } = await api.get('/v1/ops/health');
  return data as OpsHealth;
}

export async function getOpsSummary() {
  const { data } = await api.get('/v1/ops/admin/summary');
  return data as OpsSummary;
}

export async function getWorkerJobs(status?: string) {
  const { data } = await api.get('/v1/ops/admin/worker-jobs', { params: status ? { status } : undefined });
  return (data?.items ?? []) as WorkerJobItem[];
}

export async function retryWorkerJob(jobId: string) {
  const { data } = await api.post(`/v1/ops/admin/worker-jobs/${jobId}/retry`);
  return data as { job: WorkerJobItem };
}

export async function cancelWorkerJob(jobId: string) {
  const { data } = await api.post(`/v1/ops/admin/worker-jobs/${jobId}/cancel`);
  return data as { job: WorkerJobItem };
}