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
analysisJobsRouter.post('/bulk/archive', validateBody(bulkJobActionSchema), asyncHandler(analysisJobsController.archiveBulk))
analysisJobsRouter.post('/bulk/restore', validateBody(bulkJobActionSchema), asyncHandler(analysisJobsController.restoreBulk))
analysisJobsRouter.post('/bulk/retry', validateBody(bulkJobActionSchema), asyncHandler(analysisJobsController.retryBulk))
analysisJobsRouter.post('/bulk/cancel', validateBody(bulkJobActionSchema), asyncHandler(analysisJobsController.cancelBulk))
analysisJobsRouter.post('/bulk/delete', validateBody(bulkJobActionSchema), asyncHandler(analysisJobsController.deleteBulk))
analysisJobsRouter.get('/:jobId', asyncHandler(analysisJobsController.getById))
analysisJobsRouter.post('/:jobId/archive', asyncHandler(analysisJobsController.archive))
analysisJobsRouter.post('/:jobId/restore', asyncHandler(analysisJobsController.restore))
analysisJobsRouter.post('/:jobId/duplicate', asyncHandler(analysisJobsController.duplicate))
analysisJobsRouter.post('/:jobId/retry', asyncHandler(analysisJobsController.retry))
analysisJobsRouter.post('/:jobId/cancel', asyncHandler(analysisJobsController.cancel))
analysisJobsRouter.delete('/:jobId', asyncHandler(analysisJobsController.delete))
analysisJobsRouter.get('/:jobId/download', asyncHandler(analysisJobsController.downloadOutput))
analysisJobsRouter.get('/:jobId/logs/download', asyncHandler(analysisJobsController.downloadLogs))

export default analysisJobsRouter
