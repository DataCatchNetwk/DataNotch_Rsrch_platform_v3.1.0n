'use client'

import * as React from 'react'
import { io, type Socket } from 'socket.io-client'
import type { RealtimeMonitoringPayload } from '@/lib/api/system-monitoring-realtime-client'
import { monitoringWsBase } from '@/lib/monitoring-realtime-config'

export function useSystemMonitoringWebSocket(enabled = false) {
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
      setError('Missing auth token for realtime websocket.')
      setConnected(false)
      return
    }

    setError(null)
    setConnected(false)

    const socket: Socket = io(monitoringWsBase, {
      transports: ['websocket'],
      auth: { token },
    })

    socket.on('connect', () => {
      setConnected(true)
      setError(null)
    })

    socket.on('disconnect', () => {
      setConnected(false)
      setError('Realtime WebSocket disconnected.')
    })

    socket.on('connect_error', () => {
      setError('Realtime WebSocket connection error.')
    })

    socket.on('system-monitoring:snapshot', (payload: RealtimeMonitoringPayload) => {
      setData(payload)
      setLastEventAtMs(Date.now())
    })

    return () => {
      socket.disconnect()
      setConnected(false)
    }
  }, [enabled])

  return { data, connected, error, lastEventAtMs }
}
