'use client'

import { apiFetch } from '@/lib/api'

export type SystemHealth = 'Healthy' | 'Warning' | 'Critical'
export type ServiceStatus = 'Online' | 'Degraded' | 'Offline'
export type AlertTone = 'healthy' | 'warning' | 'critical'
export type LogLevel = 'INFO' | 'WARN' | 'ERROR'

export type MonitoringOverview = {
  health: SystemHealth
  uptime: string
  environment: 'Production' | 'Staging' | 'Development'
  lastSync: string
  autoRefreshEnabled: boolean
}

export type MonitoringAlert = {
  id: string
  title: string
  text: string
  tone: AlertTone
  ctaPath: string
}

export type TimePoint = { label: string; value: number }

export type MonitoringMetrics = {
  apiLatencyMs: number
  workerStatus: ServiceStatus
  queueDepth: number
  failureRate: number
  cpuLoad: number
  memoryUsage: number
  apiLatencyTrend: TimePoint[]
  cpuTrend: TimePoint[]
  memoryTrend: TimePoint[]
  queueTrend: TimePoint[]
}

export type ServiceHealthItem = {
  key: string
  title: string
  status: ServiceStatus
  helper: string
}

export type QueueBreakdown = {
  queued: number
  processing: number
  failed: number
  delayed: number
  completed: number
}

export type MonitoringLogItem = {
  id: string
  level: LogLevel
  message: string
  source: string
  time: string
}

export type MonitoringActionResult = { ok: true; message: string }

function getToken() {
  if (typeof window === 'undefined') return undefined
  return localStorage.getItem('auth_token') ?? undefined
}

function request<T>(path: string, init?: { method?: string; body?: unknown }) {
  return apiFetch<T>(`/v1/system-monitoring${path}`, {
    method: init?.method,
    body: init?.body,
    token: getToken(),
  })
}

export const getMonitoringOverview = () => request<MonitoringOverview>('/overview')
export const getMonitoringAlerts = () => request<MonitoringAlert[]>('/alerts')
export const getMonitoringMetrics = () => request<MonitoringMetrics>('/metrics')
export const getMonitoringServices = () => request<ServiceHealthItem[]>('/services')
export const getMonitoringQueue = () => request<QueueBreakdown>('/queue')
export const getMonitoringLogs = () => request<MonitoringLogItem[]>('/logs')
export const refreshMonitoring = () => request<MonitoringActionResult>('/actions/refresh', { method: 'POST' })
export const retryFailedJobs = () => request<MonitoringActionResult>('/actions/retry-failed', { method: 'POST' })
export const clearMonitoringQueue = () => request<MonitoringActionResult>('/actions/clear-queue', { method: 'POST' })
