import { Router } from 'express'
import { authenticate } from '../../middleware/authenticate.js'
import { asyncHandler } from '../../utils/async-handler.js'
import { GenomicsController } from './genomics.controller.js'
import { GenomicsService } from './genomics.service.js'

const service = new GenomicsService()
const controller = new GenomicsController(service)

const router = Router()

router.use(authenticate)
router.get('/catalog', asyncHandler(controller.catalog))
router.get('/runs', asyncHandler(controller.listRuns))
router.post('/runs', asyncHandler(controller.launch))
router.get('/runs/:runId', asyncHandler(controller.getRun))
router.get('/datasets/:datasetId/summary', asyncHandler(controller.datasetSummary))

export default router
