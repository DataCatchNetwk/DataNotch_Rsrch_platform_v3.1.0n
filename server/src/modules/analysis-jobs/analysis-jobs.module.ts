import { Router } from 'express'
import { authenticate } from '../../middleware/authenticate.js'
import { validateBody } from '../../middleware/validate.js'
import { asyncHandler } from '../../utils/async-handler.js'
import { AnalysisJobsController } from './analysis-jobs.controller.js'
import { AnalysisJobsService } from './analysis-jobs.service.js'
import { bulkJobActionSchema } from './dto/bulk-job-action.dto.js'

const analysisJobsService = new AnalysisJobsService()
const analysisJobsController = new AnalysisJobsController(analysisJobsService)

const analysisJobsRouter = Router()

analysisJobsRouter.use(authenticate)
analysisJobsRouter.get('/', asyncHandler(analysisJobsController.list))
analysisJobsRouter.post('/bulk/retry', validateBody(bulkJobActionSchema), asyncHandler(analysisJobsController.retryBulk))
analysisJobsRouter.post('/bulk/cancel', validateBody(bulkJobActionSchema), asyncHandler(analysisJobsController.cancelBulk))
analysisJobsRouter.get('/:jobId', asyncHandler(analysisJobsController.getById))
analysisJobsRouter.post('/:jobId/retry', asyncHandler(analysisJobsController.retry))
analysisJobsRouter.post('/:jobId/cancel', asyncHandler(analysisJobsController.cancel))
analysisJobsRouter.get('/:jobId/download', asyncHandler(analysisJobsController.downloadOutput))
analysisJobsRouter.get('/:jobId/logs/download', asyncHandler(analysisJobsController.downloadLogs))

export default analysisJobsRouter
