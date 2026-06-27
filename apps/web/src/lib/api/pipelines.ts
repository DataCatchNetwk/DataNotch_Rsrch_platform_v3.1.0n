import {
  cancelPipelineRun,
  createPipelineRun,
  getPipelineRun,
  listWorkspacePipelineRuns,
  resumePipelineRun,
  type PipelineRun,
} from "./workspaces";
import { apiRequest } from "./client";
import { io } from "socket.io-client";

const RAW_API_BASE =
  process.env.NEXT_PUBLIC_API_BASE_URL ??
  process.env.NEXT_PUBLIC_API_URL ??
  "http://localhost:3001";

const API_BASE = RAW_API_BASE.replace(/\/+$/, "");
const SOCKET_BASE =
  process.env.NEXT_PUBLIC_SOCKET_URL ??
  RAW_API_BASE.replace(/\/api(?:\/v\d+)?$/i, "").replace(/\/+$/, "");

function getStoredToken() {
  if (typeof window === "undefined") {
    return null;
  }

  try {
    return window.localStorage.getItem("auth_token");
  } catch {
    return null;
  }
}

export {
  cancelPipelineRun,
  createPipelineRun,
  getPipelineRun,
  listWorkspacePipelineRuns,
  resumePipelineRun,
  type PipelineRun,
};

export type PipelineMonitoringMetrics = {
  totalRuns: number;
  runningRuns: number;
  queuedRuns: number;
  failedRuns: number;
  succeededRuns: number;
  canceledRuns: number;
  activeStages: number;
  recentFailures: number;
  successRate: number;
};

export type PipelineStreamTailEvent = {
  streamId: string;
  id: string;
  pipelineRunId: string;
  eventType: string;
  level: string;
  message: string;
  stepOrder?: number;
  createdAt: string;
  dataJson?: unknown;
};

export type PipelineAutoscalingRecommendation = {
  generatedAt: string;
  targetJobsPerReplica: number;
  minReplicas: number;
  maxReplicas: number;
  queues: Array<{
    queue: string;
    waiting: number;
    active: number;
    desiredReplicas: number;
    maxSuggestedReplicas: number;
    reason: string;
  }>;
};

export function createPipelineEventStream(runId: string) {
  const token = getStoredToken();
  const url = `${API_BASE}/pipeline-runs/${runId}/events${token ? `?token=${encodeURIComponent(token)}` : ""}`;
  return new EventSource(url);
}

export async function listPipelineMonitoringRuns(limit = 50) {
  const query = Number.isFinite(limit) ? `?limit=${Math.max(1, Math.min(200, Math.floor(limit)))}` : "";
  const data = await apiRequest<{ runs: PipelineRun[] }>(`/pipeline-runs/monitoring/runs${query}`);
  return data.runs;
}

export async function getPipelineMonitoringMetrics() {
  const data = await apiRequest<{ metrics: PipelineMonitoringMetrics }>("/pipeline-runs/monitoring/metrics");
  return data.metrics;
}

export async function retryPipelineRunFromFailedStage(runId: string, payload?: { reason?: string; stepOrder?: number }) {
  const data = await apiRequest<{ run: PipelineRun }>(`/pipeline-runs/${runId}/retry-from-failed-stage`, {
    method: "POST",
    json: payload ?? {},
  });
  return data.run;
}

export async function retryPipelineRunFromStage(runId: string, payload: { reason?: string; stepOrder: number }) {
  const data = await apiRequest<{ run: PipelineRun }>(`/pipeline-runs/${runId}/retry-from-stage`, {
    method: "POST",
    json: payload,
  });
  return data.run;
}

export async function tailPipelineRunLiveLog(runId: string, count = 60) {
  const query = Number.isFinite(count) ? `?count=${Math.max(1, Math.min(200, Math.floor(count)))}` : "";
  const data = await apiRequest<{ events: PipelineStreamTailEvent[] }>(`/pipeline-runs/${runId}/live-log-tail${query}`);
  return data.events;
}

export async function getPipelineAutoscalingRecommendation() {
  const data = await apiRequest<{ recommendation: PipelineAutoscalingRecommendation }>(
    "/pipeline-runs/monitoring/autoscaling-recommendation",
  );
  return data.recommendation;
}

export function connectPipelineSocket(runId?: string) {
  const token = getStoredToken();
  const socket = io(SOCKET_BASE, {
    auth: token ? { token } : undefined,
    withCredentials: true,
    transports: ["websocket", "polling"],
  });

  socket.on("connect", () => {
    if (runId) {
      socket.emit("pipelines:subscribe", { runId });
    }
  });

  return socket;
}