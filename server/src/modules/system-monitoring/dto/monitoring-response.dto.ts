export type SystemHealth = 'Healthy' | 'Warning' | 'Critical'
export type ServiceStatus = 'Online' | 'Degraded' | 'Offline'
export type AlertTone = 'healthy' | 'warning' | 'critical'
export type LogLevel = 'INFO' | 'WARN' | 'ERROR'

export type MonitoringOverviewDto = {
  health: SystemHealth
  uptime: string
  environment: 'Production' | 'Staging' | 'Development'
  lastSync: string
  autoRefreshEnabled: boolean
}

export type MonitoringAlertDto = {
  id: string
  title: string
  text: string
  tone: AlertTone
  ctaPath: string
}

export type TimePointDto = {
  label: string
  value: number
}

export type MonitoringMetricsDto = {
  apiLatencyMs: number
  workerStatus: ServiceStatus
  queueDepth: number
  failureRate: number
  cpuLoad: number
  memoryUsage: number
  apiLatencyTrend: TimePointDto[]
  cpuTrend: TimePointDto[]
  memoryTrend: TimePointDto[]
  queueTrend: TimePointDto[]
}

export type ServiceHealthItemDto = {
  key: string
  title: string
  status: ServiceStatus
  helper: string
}

export type QueueBreakdownDto = {
  queued: number
  processing: number
  failed: number
  delayed: number
  completed: number
}

export type MonitoringLogItemDto = {
  id: string
  level: LogLevel
  message: string
  source: string
  time: string
}

export type MonitoringActionResultDto = {
  ok: true
  message: string
}
