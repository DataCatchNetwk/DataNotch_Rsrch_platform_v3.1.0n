import { Router } from 'express'
import { authenticate } from '../../middleware/authenticate.js'
import { authorize } from '../../middleware/authorize.js'
import { asyncHandler } from '../../utils/async-handler.js'
import { SystemMonitoringController } from './system-monitoring.controller.js'
import { SystemMonitoringService } from './system-monitoring.service.js'

const service = new SystemMonitoringService()
const controller = new SystemMonitoringController(service)
export const systemMonitoringService = service

const router = Router()

router.use(authenticate, authorize('ADMIN', 'SUPER_ADMIN'))
router.get('/overview', asyncHandler(controller.overview))
router.get('/alerts', asyncHandler(controller.alerts))
router.get('/metrics', asyncHandler(controller.metrics))
router.get('/services', asyncHandler(controller.services))
router.get('/queue', asyncHandler(controller.queue))
router.get('/logs', asyncHandler(controller.logs))
router.post('/actions/refresh', asyncHandler(controller.refresh))
router.post('/actions/retry-failed', asyncHandler(controller.retryFailed))
router.post('/actions/clear-queue', asyncHandler(controller.clearQueue))

export default router
