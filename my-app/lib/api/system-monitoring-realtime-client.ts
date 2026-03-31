export type RealtimeMonitoringPayload = {
  overview: {
    health: 'Healthy' | 'Warning' | 'Critical'
    uptime: string
    environment: 'Production' | 'Staging' | 'Development'
    lastSync: string
    autoRefreshEnabled: boolean
  }
  metrics: {
    apiLatencyMs: number
    workerStatus: 'Online' | 'Degraded' | 'Offline'
    queueDepth: number
    failureRate: number
    cpuLoad: number
    memoryUsage: number
  }
  queue: {
    queued: number
    processing: number
    failed: number
    delayed: number
    completed: number
  }
  logs: Array<{
    id: string
    level: 'INFO' | 'WARN' | 'ERROR'
    message: string
    source: string
    time: string
  }>
}
