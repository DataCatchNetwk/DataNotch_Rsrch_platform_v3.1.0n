import type { Request, Response } from 'express'
import { SystemMonitoringRealtimeService } from './system-monitoring-realtime.service.js'

export class SystemMonitoringRealtimeController {
  constructor(private readonly service: SystemMonitoringRealtimeService) {}

  stream = async (req: Request, res: Response) => {
    await this.service.stream(req, res)
  }
}