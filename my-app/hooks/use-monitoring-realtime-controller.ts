'use client'

import * as React from 'react'
import type { RealtimeMonitoringPayload } from '@/lib/api/system-monitoring-realtime-client'
import {
  monitoringWsAutoRecoverEnabled,
  monitoringWsRecoveryThreshold,
} from '@/lib/monitoring-realtime-config'
import { useSystemMonitoringSSE } from '@/hooks/use-system-monitoring-sse'
import { useSystemMonitoringWebSocket } from '@/hooks/use-system-monitoring-websocket'

export type MonitoringRealtimeMode = 'off' | 'sse' | 'ws'

type UseMonitoringRealtimeControllerArgs = {
  onSnapshot: (payload: RealtimeMonitoringPayload) => void
}

export function useMonitoringRealtimeController({ onSnapshot }: UseMonitoringRealtimeControllerArgs) {
  const [realtimeMode, setRealtimeMode] = React.useState<MonitoringRealtimeMode>('sse')
  const [fallbackNotice, setFallbackNotice] = React.useState<string | null>(null)
  const [wsRecoveryArmed, setWsRecoveryArmed] = React.useState(false)
  const [stableSseEvents, setStableSseEvents] = React.useState(0)
  const lastCountedSseEventRef = React.useRef<number | null>(null)

  const sse = useSystemMonitoringSSE(realtimeMode === 'sse')
  const ws = useSystemMonitoringWebSocket(realtimeMode === 'ws')

  const realtimeData = realtimeMode === 'ws' ? ws.data : realtimeMode === 'sse' ? sse.data : null
  const realtimeConnected = realtimeMode === 'ws' ? ws.connected : realtimeMode === 'sse' ? sse.connected : false
  const realtimeError = realtimeMode === 'ws' ? ws.error : realtimeMode === 'sse' ? sse.error : null
  const lastEventAtMs = realtimeMode === 'ws' ? ws.lastEventAtMs : realtimeMode === 'sse' ? sse.lastEventAtMs : null
  const lastEventLabel = lastEventAtMs
    ? new Date(lastEventAtMs).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })
    : 'No event yet'

  const handleRealtimeModeChange = React.useCallback((mode: MonitoringRealtimeMode) => {
    setRealtimeMode(mode)
    setFallbackNotice(null)
    setWsRecoveryArmed(false)
    setStableSseEvents(0)
    lastCountedSseEventRef.current = null
  }, [])

  React.useEffect(() => {
    if (!realtimeData) return
    onSnapshot(realtimeData)
  }, [onSnapshot, realtimeData])

  React.useEffect(() => {
    if (realtimeMode !== 'ws') return
    if (!ws.error) return

    setRealtimeMode('sse')
    setWsRecoveryArmed(monitoringWsAutoRecoverEnabled)
    setStableSseEvents(0)
    lastCountedSseEventRef.current = null
    setFallbackNotice(
      monitoringWsAutoRecoverEnabled
        ? `WebSocket became unstable. Automatically switched to SSE. Will retry WebSocket after ${monitoringWsRecoveryThreshold} stable SSE events.`
        : 'WebSocket became unstable. Automatically switched to SSE. Automatic WebSocket recovery is disabled by environment configuration.',
    )
  }, [realtimeMode, ws.error])

  React.useEffect(() => {
    if (realtimeMode !== 'sse') return
    if (!wsRecoveryArmed) return
    if (!sse.lastEventAtMs) return
    if (lastCountedSseEventRef.current === sse.lastEventAtMs) return

    lastCountedSseEventRef.current = sse.lastEventAtMs

    setStableSseEvents((current) => {
      const next = current + 1
      if (next >= monitoringWsRecoveryThreshold) {
        setWsRecoveryArmed(false)
        setRealtimeMode('ws')
        setFallbackNotice(`SSE remained stable for ${monitoringWsRecoveryThreshold} events. Retrying WebSocket.`)
        return 0
      }

      return next
    })
  }, [realtimeMode, wsRecoveryArmed, sse.lastEventAtMs])

  const healthPanel = React.useMemo(() => {
    const recoveryProgressLabel = wsRecoveryArmed
      ? `${stableSseEvents}/${monitoringWsRecoveryThreshold} SSE events`
      : null

    return {
      modeLabel: realtimeMode.toUpperCase(),
      connectionLabel: realtimeConnected ? 'Connected' : 'Disconnected',
      lastEventLabel,
      autoRecoveryLabel: monitoringWsAutoRecoverEnabled ? 'Enabled' : 'Disabled',
      recoveryProgressLabel,
      fallbackNotice,
      showRecoveryProgress: wsRecoveryArmed,
    }
  }, [fallbackNotice, lastEventLabel, realtimeConnected, realtimeMode, stableSseEvents, wsRecoveryArmed])

  return {
    realtimeMode,
    handleRealtimeModeChange,
    realtimeConnected,
    realtimeError,
    healthPanel,
  }
}