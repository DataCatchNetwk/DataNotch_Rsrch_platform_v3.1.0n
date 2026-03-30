import { Router } from 'express';
import { authenticate } from '../middleware/authenticate.js';
import { validateBody } from '../middleware/validate.js';
import { asyncHandler } from '../utils/async-handler.js';
import {
  cancelPipelineRunRecord,
  createPipelineRunRecord,
  getPipelineAutoscalingRecommendation,
  getPipelineMonitoringMetrics,
  getPipelineRunRecord,
  listPipelineMonitoringRuns,
  listWorkspacePipelineRuns,
  retryPipelineRunFromStageRecord,
  retryPipelineRunFromFailedStageRecord,
  resumePipelineRunRecord,
  streamPipelineRunEvents,
  tailPipelineRunLiveLog,
} from '../controllers/pipelines.controller.js';
import {
  cancelPipelineRunSchema,
  createPipelineRunSchema,
  resumePipelineRunSchema,
  retryPipelineRunFromStageSchema,
  retryPipelineRunFromFailedStageSchema,
} from '../pipelines/schemas.js';

const router = Router();

router.get('/:runId/events', asyncHandler(streamPipelineRunEvents));

router.use(authenticate);
router.post('/', validateBody(createPipelineRunSchema), asyncHandler(createPipelineRunRecord));
router.get('/monitoring/runs', asyncHandler(listPipelineMonitoringRuns));
router.get('/monitoring/metrics', asyncHandler(getPipelineMonitoringMetrics));
router.get('/monitoring/autoscaling-recommendation', asyncHandler(getPipelineAutoscalingRecommendation));
router.get('/workspace/:workspaceId', asyncHandler(listWorkspacePipelineRuns));
router.get('/:runId', asyncHandler(getPipelineRunRecord));
router.get('/:runId/live-log-tail', asyncHandler(tailPipelineRunLiveLog));
router.post('/:runId/cancel', validateBody(cancelPipelineRunSchema), asyncHandler(cancelPipelineRunRecord));
router.post('/:runId/resume', validateBody(resumePipelineRunSchema), asyncHandler(resumePipelineRunRecord));
router.post('/:runId/retry-from-stage', validateBody(retryPipelineRunFromStageSchema), asyncHandler(retryPipelineRunFromStageRecord));
router.post(
  '/:runId/retry-from-failed-stage',
  validateBody(retryPipelineRunFromFailedStageSchema),
  asyncHandler(retryPipelineRunFromFailedStageRecord),
);

export default router;