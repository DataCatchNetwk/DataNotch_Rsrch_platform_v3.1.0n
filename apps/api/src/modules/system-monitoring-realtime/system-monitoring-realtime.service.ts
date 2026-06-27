import type { Request, Response } from 'express'
import { HttpError } from '../../utils/errors.js'
import { verifyToken } from '../../utils/jwt.js'
import { emitSystemMonitoringSnapshot } from '../../realtime/notifications.gateway.js'
import { systemMonitoringService } from '../system-monitoring/system-monitoring.module.js'

export class SystemMonitoringRealtimeService {
  private timer: NodeJS.Timeout | null = null

  buildSnapshot() {
    return systemMonitoringService.buildRealtimeSnapshot()
  }

  ensureMonitoringAccess(req: Request) {
    const queryToken = req.query.token
    if (typeof queryToken === 'string' && queryToken.trim()) {
      const user = verifyToken(queryToken)
      if (user.roles.includes('ADMIN') || user.roles.includes('SUPER_ADMIN')) {
        return user
      }
      throw new HttpError(403, 'Admin role required for monitoring stream')
    }

    const header = req.headers.authorization
    if (typeof header === 'string' && header.startsWith('Bearer ')) {
      const user = verifyToken(header.slice(7))
      if (user.roles.includes('ADMIN') || user.roles.includes('SUPER_ADMIN')) {
        return user
      }
      throw new HttpError(403, 'Admin role required for monitoring stream')
    }

    throw new HttpError(401, 'Missing monitoring stream token')
  }

  async stream(req: Request, res: Response) {
    this.ensureMonitoringAccess(req)

    res.setHeader('Content-Type', 'text/event-stream')
    res.setHeader('Cache-Control', 'no-cache, no-transform')
    res.setHeader('Connection', 'keep-alive')

    const send = async () => {
      const snapshot = await this.buildSnapshot()
      res.write(`data: ${JSON.stringify(snapshot)}\n\n`)
    }

    await send()
    const timer = setInterval(() => {
      void send()
    }, 3000)

    req.on('close', () => {
      clearInterval(timer)
      res.end()
    })
  }

  startBroadcastLoop() {
    if (this.timer) {
      return
    }

    this.timer = setInterval(() => {
      void this.buildSnapshot()
        .then((snapshot) => emitSystemMonitoringSnapshot(snapshot))
        .catch(() => {
          // Keep realtime monitoring broadcasts resilient to transient telemetry failures.
        })
    }, 3000)
  }

  stopBroadcastLoop() {
    if (!this.timer) {
      return
    }

    clearInterval(this.timer)
    this.timer = null
  }
}