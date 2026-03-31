import { emitSystemMonitoringSnapshot } from './notifications.gateway.js'
import { systemMonitoringService } from '../modules/system-monitoring/system-monitoring.module.js'

let timer: NodeJS.Timeout | null = null

export function startSystemMonitoringRealtime() {
  if (timer) {
    return
  }

  timer = setInterval(() => {
    void systemMonitoringService
      .buildRealtimeSnapshot()
      .then((snapshot) => emitSystemMonitoringSnapshot(snapshot))
      .catch(() => {
        // Keep realtime loop resilient to transient data errors.
      })
  }, 3000)
}

export function stopSystemMonitoringRealtime() {
  if (!timer) {
    return
  }
  clearInterval(timer)
  timer = null
}
