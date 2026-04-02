import { Router } from 'express'
import { authenticate } from '../../middleware/authenticate.js'
import { asyncHandler } from '../../utils/async-handler.js'
import { StatisticsController } from './statistics.controller.js'
import { StatisticsService } from './statistics.service.js'

const service = new StatisticsService()
const controller = new StatisticsController(service)

const router = Router()

router.use(authenticate)
router.get('/catalog', asyncHandler(controller.catalog))
router.get('/runs', asyncHandler(controller.listRuns))
router.post('/runs', asyncHandler(controller.launch))
router.get('/runs/:runId', asyncHandler(controller.getRun))
router.get('/runs/:runId/summary', asyncHandler(controller.summary))

export default router
