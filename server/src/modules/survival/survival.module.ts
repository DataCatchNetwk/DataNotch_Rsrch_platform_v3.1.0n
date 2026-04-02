import { Router } from 'express'
import { authenticate } from '../../middleware/authenticate.js'
import { asyncHandler } from '../../utils/async-handler.js'
import { SurvivalController } from './survival.controller.js'
import { SurvivalService } from './survival.service.js'

const service = new SurvivalService()
const controller = new SurvivalController(service)

const router = Router()

router.use(authenticate)
router.get('/catalog', asyncHandler(controller.catalog))
router.get('/runs', asyncHandler(controller.listRuns))
router.post('/runs', asyncHandler(controller.launch))
router.get('/runs/:runId', asyncHandler(controller.getRun))
router.get('/runs/:runId/curves', asyncHandler(controller.curves))

export default router
