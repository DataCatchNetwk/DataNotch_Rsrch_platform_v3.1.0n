import type { Request, Response } from 'express'
import { SystemMonitoringService } from './system-monitoring.service.js'

export class SystemMonitoringController {
  constructor(private readonly service: SystemMonitoringService) {}

  overview = async (_req: Request, res: Response) => {
    res.json(await this.service.overview())
  }

  alerts = async (_req: Request, res: Response) => {
    res.json(await this.service.alerts())
  }

  metrics = async (_req: Request, res: Response) => {
    res.json(await this.service.metrics())
  }

  services = async (_req: Request, res: Response) => {
    res.json(await this.service.services())
  }

  queue = async (_req: Request, res: Response) => {
    res.json(await this.service.queue())
  }

  logs = async (_req: Request, res: Response) => {
    res.json(await this.service.logs())
  }

  refresh = async (_req: Request, res: Response) => {
    res.json(await this.service.refresh())
  }

  retryFailed = async (_req: Request, res: Response) => {
    res.json(await this.service.retryFailed())
  }

  clearQueue = async (_req: Request, res: Response) => {
    res.json(await this.service.clearQueue())
  }
}
