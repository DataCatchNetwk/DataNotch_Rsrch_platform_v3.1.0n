import { Router } from 'express';
import { authenticate } from '../middleware/authenticate.js';
import { requireDebugAdminToken } from '../middleware/debug-admin-token.js';
import { asyncHandler } from '../utils/async-handler.js';
import {
  auditTrail,
  bulkOperation,
  createAccessRequest,
  createSavedView,
  deleteSavedView,
  debugPullStatus,
  download,
  favorite,
  getById,
  lineage,
  list,
  listSavedViews,
  listPublic,
  preview,
  pull,
  pullStatus,
  remove,
  streamPullStatus,
  triggerFallbackPull,
} from '../controllers/data-deposit.controller.js';

const router = Router();

router.get('/', asyncHandler(list));
router.get('/public', asyncHandler(listPublic));
router.post(
  '/debug/pull-requests/:pullRequestId/process-fallback',
  requireDebugAdminToken,
  asyncHandler(triggerFallbackPull),
);
router.get(
  '/debug/pull-requests/:pullRequestId/status',
  requireDebugAdminToken,
  asyncHandler(debugPullStatus),
);
router.get('/pull-requests/:pullRequestId', authenticate, asyncHandler(pullStatus));
router.get('/pull-requests/:pullRequestId/stream', authenticate, asyncHandler(streamPullStatus));
router.get('/saved-views', authenticate, asyncHandler(listSavedViews));
router.get('/:datasetId/download', asyncHandler(download));
router.get('/:datasetId/lineage', asyncHandler(lineage));
router.get('/:datasetId/audit', asyncHandler(auditTrail));
router.get('/:datasetId', asyncHandler(getById));
router.get('/:datasetId/preview', asyncHandler(preview));

router.post('/bulk', authenticate, asyncHandler(bulkOperation));
router.post('/saved-views', authenticate, asyncHandler(createSavedView));
router.post('/:datasetId/pull', authenticate, asyncHandler(pull));
router.post('/:datasetId/favorite', authenticate, asyncHandler(favorite));
router.post('/:datasetId/access-request', authenticate, asyncHandler(createAccessRequest));
router.delete('/:datasetId', authenticate, asyncHandler(remove));
router.delete('/saved-views/:viewId', authenticate, asyncHandler(deleteSavedView));

export default router;
