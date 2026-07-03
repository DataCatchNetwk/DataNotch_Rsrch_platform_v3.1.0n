import express from 'express';
import { userCommunicationService, AssetType } from './userCommunication.service';

export const userCommunicationRouter = express.Router();

// Replace this demo user with your real auth middleware.
function requireUser(req: express.Request, _res: express.Response, next: express.NextFunction) {
  (req as any).user = { id: req.header('x-user-id') || 'demo-user-001' };
  next();
}

userCommunicationRouter.use(requireUser);

userCommunicationRouter.get('/summary', async (req, res) => {
  res.json(await userCommunicationService.getSidebarSummary((req as any).user.id));
});

userCommunicationRouter.get('/inbox', async (req, res) => {
  res.json(await userCommunicationService.getInbox((req as any).user.id));
});

userCommunicationRouter.get('/assets/:assetType/:assetId/discussion', async (req, res) => {
  const { assetType, assetId } = req.params;
  res.json(await userCommunicationService.getAssetDiscussion(assetType as AssetType, assetId));
});

userCommunicationRouter.post('/assets/:assetType/:assetId/messages', async (req, res) => {
  const { assetType, assetId } = req.params;
  const { body } = req.body;
  if (!body || body.trim().length < 1) return res.status(400).json({ error: 'Message body is required' });
  res.status(201).json(await userCommunicationService.sendAssetMessage({
    userId: (req as any).user.id,
    assetType: assetType as AssetType,
    assetId,
    body,
  }));
});
