import { Router } from 'express';
import { authenticate } from '../middleware/authenticate.js';
import { asyncHandler } from '../utils/async-handler.js';
import { userCommunicationService, type AssetType } from '../services/user-communication.service.js';

const router = Router();

router.use(authenticate);

router.get(
  '/summary',
  asyncHandler(async (req, res) => {
    res.json(await userCommunicationService.getSidebarSummary(req.user!.id));
  })
);

router.get(
  '/inbox',
  asyncHandler(async (req, res) => {
    res.json(await userCommunicationService.getInbox(req.user!.id));
  })
);

router.get(
  '/assets/:assetType/:assetId/discussion',
  asyncHandler(async (req, res) => {
    const { assetType, assetId } = req.params;
    res.json(await userCommunicationService.getAssetDiscussion(assetType as AssetType, assetId));
  })
);

router.post(
  '/assets/:assetType/:assetId/messages',
  asyncHandler(async (req, res) => {
    const { assetType, assetId } = req.params;
    const body = typeof req.body?.body === 'string' ? req.body.body.trim() : '';
    if (!body) {
      return res.status(400).json({ error: 'Message body is required' });
    }

    const result = await userCommunicationService.sendAssetMessage({
      userId: req.user!.id,
      assetType: assetType as AssetType,
      assetId,
      body,
    });
    res.status(201).json(result);
  })
);

export default router;
