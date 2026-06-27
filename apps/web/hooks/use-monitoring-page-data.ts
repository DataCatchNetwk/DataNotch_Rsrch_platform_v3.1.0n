'use client'

import * as React from 'react'
import type { RealtimeMonitoringPayload } from '@/lib/api/system-monitoring-realtime-client'
import {
  getMonitoringAlerts,
  getMonitoringLogs,
  getMonitoringMetrics,
  getMonitoringOverview,
  getMonitoringQueue,
  getMonitoringServices,
  type MonitoringLogItem,
  type MonitoringMetrics,
} from '@/lib/api/system-monitoring-api-client'

type MonitoringAction = () => Promise<{ ok: true; message: string }>

export function useMonitoringPageData() {
  const [overview, setOverview] = React.useState<Awaited<ReturnType<typeof getMonitoringOverview>> | null>(null)
  const [alerts, setAlerts] = React.useState<Awaited<ReturnType<typeof getMonitoringAlerts>>>([])
  const [metrics, setMetrics] = React.useState<Awaited<ReturnType<typeof getMonitoringMetrics>> | null>(null)
  const [services, setServices] = React.useState<Awaited<ReturnType<typeof getMonitoringServices>>>([])
  const [queue, setQueue] = React.useState<Awaited<ReturnType<typeof getMonitoringQueue>> | null>(null)
  const [logs, setLogs] = React.useState<Awaited<ReturnType<typeof getMonitoringLogs>>>([])
  const [loading, setLoading] = React.useState(true)
  const [actionLoading, setActionLoading] = React.useState<string | null>(null)
  const [error, setError] = React.useState<string | null>(null)

  const load = React.useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const [overviewRes, alertsRes, metricsRes, servicesRes, queueRes, logsRes] = await Promise.all([
        getMonitoringOverview(),
        getMonitoringAlerts(),
        getMonitoringMetrics(),
        getMonitoringServices(),
        getMonitoringQueue(),
        getMonitoringLogs(),
      ])

      setOverview(overviewRes)
      setAlerts(alertsRes)
      setMetrics(metricsRes)
      setServices(servicesRes)
      setQueue(queueRes)
      setLogs(logsRes)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load monitoring.')
    } finally {
      setLoading(false)
    }
  }, [])

  React.useEffect(() => {
    void load()
  }, [load])

  const applyRealtimeSnapshot = React.useCallback((payload: RealtimeMonitoringPayload) => {
    setOverview(payload.overview)
    setQueue(payload.queue)
    setLogs((current) => {
      const merged = [...payload.logs, ...current]
      const deduped = Array.from(new Map(merged.map((item) => [item.id, item])).values())
      return deduped.slice(0, 12)
    })
    setMetrics((previous) => {
      if (!previous) return previous

      return {
        ...previous,
        apiLatencyMs: payload.metrics.apiLatencyMs,
        workerStatus: payload.metrics.workerStatus,
        queueDepth: payload.metrics.queueDepth,
        failureRate: payload.metrics.failureRate,
        cpuLoad: payload.metrics.cpuLoad,
        memoryUsage: payload.metrics.memoryUsage,
      }
    })
  }, [])

  const runAction = React.useCallback(async (key: string, fn: MonitoringAction) => {
    setActionLoading(key)
    try {
      const result = await fn()
      await load()
      return result
    } finally {
      setActionLoading(null)
    }
  }, [load])

  return {
    overview,
    alerts,
    metrics,
    services,
    queue,
    logs,
    loading,
    actionLoading,
    error,
    load,
    applyRealtimeSnapshot,
    runAction,
  }
}