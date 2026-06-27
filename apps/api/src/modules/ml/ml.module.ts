import { Router } from 'express'
import { authenticate } from '../../middleware/authenticate.js'
import { asyncHandler } from '../../utils/async-handler.js'
import { MlController } from './ml.controller.js'
import { MlService } from './ml.service.js'

const service = new MlService()
const controller = new MlController(service)

const router = Router()

router.use(authenticate)
router.get('/catalog', asyncHandler(controller.catalog))
router.get('/runs', asyncHandler(controller.listRuns))
router.post('/runs', asyncHandler(controller.launch))
router.get('/runs/:runId', asyncHandler(controller.getRun))
router.get('/runs/:runId/recommendations', asyncHandler(controller.recommendations))

export default router
