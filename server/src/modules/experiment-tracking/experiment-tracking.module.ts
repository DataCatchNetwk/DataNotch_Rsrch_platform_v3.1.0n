import { Router } from 'express'
import { authenticate } from '../../middleware/authenticate.js'
import { asyncHandler } from '../../utils/async-handler.js'
import { ExperimentTrackingController } from './experiment-tracking.controller.js'
import { ExperimentTrackingService } from './experiment-tracking.service.js'

const service = new ExperimentTrackingService()
const controller = new ExperimentTrackingController(service)

const router = Router()

router.use(authenticate)
router.get('/', asyncHandler(controller.list))
router.post('/', asyncHandler(controller.create))
router.get('/:experimentId', asyncHandler(controller.getById))
router.get('/:experimentId/runs', asyncHandler(controller.listRuns))
router.post('/:experimentId/runs', asyncHandler(controller.attachRun))
router.patch('/:experimentId/champion', asyncHandler(controller.setChampion))
router.get('/:experimentId/compare', asyncHandler(controller.compareRuns))

export default router
