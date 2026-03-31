
export type SystemHealth = "Healthy" | "Warning" | "Critical";
export type ServiceStatus = "Online" | "Degraded" | "Offline";
export type AlertTone = "healthy" | "warning" | "critical";
export type LogLevel = "INFO" | "WARN" | "ERROR";

export type MonitoringOverview = {
  health: SystemHealth;
  uptime: string;
  environment: "Production" | "Staging" | "Development";
  lastSync: string;
  autoRefreshEnabled: boolean;
};

export type MonitoringAlert = {
  id: string;
  title: string;
  text: string;
  tone: AlertTone;
  ctaPath: string;
};

export type TimePoint = {
  label: string;
  value: number;
};

export type MonitoringMetrics = {
  apiLatencyMs: number;
  workerStatus: ServiceStatus;
  queueDepth: number;
  failureRate: number;
  cpuLoad: number;
  memoryUsage: number;
  apiLatencyTrend: TimePoint[];
  cpuTrend: TimePoint[];
  memoryTrend: TimePoint[];
  queueTrend: TimePoint[];
};

export type ServiceHealthItem = {
  key: string;
  title: string;
  status: ServiceStatus;
  helper: string;
};

export type QueueBreakdown = {
  queued: number;
  processing: number;
  failed: number;
  delayed: number;
  completed: number;
};

export type MonitoringLogItem = {
  id: string;
  level: LogLevel;
  message: string;
  source: string;
  time: string;
};

export type MonitoringActionResult = {
  ok: true;
  message: string;
};

const API_BASE = process.env.NEXT_PUBLIC_API_BASE_URL?.replace(/\/$/, "") ?? "http://localhost:4000";
const API_PREFIX = "/api/v1";

async function request<T>(path: string, init?: RequestInit): Promise<T> {
  const res = await fetch(`${API_BASE}${API_PREFIX}${path}`, {
    ...init,
    credentials: "include",
    cache: "no-store",
    headers: { "Content-Type": "application/json", ...(init?.headers ?? {}) },
  });
  if (!res.ok) throw new Error(`Request failed: ${res.status}`);
  return (await res.json()) as T;
}

export const getMonitoringOverview = () => request<MonitoringOverview>("/system-monitoring/overview");
export const getMonitoringAlerts = () => request<MonitoringAlert[]>("/system-monitoring/alerts");
export const getMonitoringMetrics = () => request<MonitoringMetrics>("/system-monitoring/metrics");
export const getMonitoringServices = () => request<ServiceHealthItem[]>("/system-monitoring/services");
export const getMonitoringQueue = () => request<QueueBreakdown>("/system-monitoring/queue");
export const getMonitoringLogs = () => request<MonitoringLogItem[]>("/system-monitoring/logs");
export const refreshMonitoring = () => request<MonitoringActionResult>("/system-monitoring/actions/refresh", { method: "POST" });
export const retryFailedJobs = () => request<MonitoringActionResult>("/system-monitoring/actions/retry-failed", { method: "POST" });
export const clearMonitoringQueue = () => request<MonitoringActionResult>("/system-monitoring/actions/clear-queue", { method: "POST" });
