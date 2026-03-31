import { Router } from 'express'
import { asyncHandler } from '../../utils/async-handler.js'
import { SystemMonitoringRealtimeController } from './system-monitoring-realtime.controller.js'
import { SystemMonitoringRealtimeService } from './system-monitoring-realtime.service.js'

const service = new SystemMonitoringRealtimeService()
const controller = new SystemMonitoringRealtimeController(service)

export const systemMonitoringRealtimeService = service

const router = Router()
router.get('/stream', asyncHandler(controller.stream))

export default router