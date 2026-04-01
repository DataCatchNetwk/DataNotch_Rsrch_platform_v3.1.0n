import { Router } from 'express';
import { authenticate } from '../middleware/authenticate.js';
import { requireDebugAdminToken } from '../middleware/debug-admin-token.js';
import { asyncHandler } from '../utils/async-handler.js';
import {
  debugPullStatus,
  favorite,
  getById,
  list,
  listPublic,
  preview,
  pull,
  pullStatus,
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
router.get('/:datasetId', asyncHandler(getById));
router.get('/:datasetId/preview', asyncHandler(preview));

router.post('/:datasetId/pull', authenticate, asyncHandler(pull));
router.post('/:datasetId/favorite', authenticate, asyncHandler(favorite));

export default router;
