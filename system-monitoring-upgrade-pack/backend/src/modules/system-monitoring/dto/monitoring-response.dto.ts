
export class MonitoringOverviewDto {
  health!: "Healthy" | "Warning" | "Critical";
  uptime!: string;
  environment!: "Production" | "Staging" | "Development";
  lastSync!: string;
  autoRefreshEnabled!: boolean;
}

export class MonitoringAlertDto {
  id!: string;
  title!: string;
  text!: string;
  tone!: "healthy" | "warning" | "critical";
  ctaPath!: string;
}

export class TimePointDto { label!: string; value!: number; }

export class MonitoringMetricsDto {
  apiLatencyMs!: number;
  workerStatus!: "Online" | "Degraded" | "Offline";
  queueDepth!: number;
  failureRate!: number;
  cpuLoad!: number;
  memoryUsage!: number;
  apiLatencyTrend!: TimePointDto[];
  cpuTrend!: TimePointDto[];
  memoryTrend!: TimePointDto[];
  queueTrend!: TimePointDto[];
}

export class ServiceHealthItemDto {
  key!: string;
  title!: string;
  status!: "Online" | "Degraded" | "Offline";
  helper!: string;
}

export class QueueBreakdownDto {
  queued!: number;
  processing!: number;
  failed!: number;
  delayed!: number;
  completed!: number;
}

export class MonitoringLogItemDto {
  id!: string;
  level!: "INFO" | "WARN" | "ERROR";
  message!: string;
  source!: string;
  time!: string;
}

export class MonitoringActionResultDto {
  ok!: true;
  message!: string;
}
