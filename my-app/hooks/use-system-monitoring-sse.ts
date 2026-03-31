'use client'

import * as React from 'react'
import type { RealtimeMonitoringPayload } from '@/lib/api/system-monitoring-realtime-client'
import { monitoringApiBase, monitoringApiPrefix } from '@/lib/monitoring-realtime-config'

export function useSystemMonitoringSSE(enabled = true) {
  const [data, setData] = React.useState<RealtimeMonitoringPayload | null>(null)
  const [connected, setConnected] = React.useState(false)
  const [error, setError] = React.useState<string | null>(null)
  const [lastEventAtMs, setLastEventAtMs] = React.useState<number | null>(null)

  React.useEffect(() => {
    if (!enabled) {
      setConnected(false)
      setError(null)
      return
    }

    const token = localStorage.getItem('auth_token')
    if (!token) {
      setError('Missing auth token for realtime stream.')
      setConnected(false)
      return
    }

    setError(null)
    setConnected(false)

    const url = `${monitoringApiBase}${monitoringApiPrefix}/system-monitoring/stream?token=${encodeURIComponent(token)}`
    const es = new EventSource(url)

    es.onopen = () => {
      setConnected(true)
      setError(null)
    }

    es.onmessage = (event) => {
      try {
        const parsed = JSON.parse(event.data) as RealtimeMonitoringPayload
        setData(parsed)
        setLastEventAtMs(Date.now())
      } catch {
        setError('Failed to parse realtime monitoring payload.')
      }
    }

    es.onerror = () => {
      setConnected(false)
      setError('Realtime SSE connection lost.')
      es.close()
    }

    return () => {
      es.close()
      setConnected(false)
    }
  }, [enabled])

  return { data, connected, error, lastEventAtMs }
}
