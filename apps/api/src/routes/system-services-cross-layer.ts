import { Router } from 'express';
import { platformCrossLayerService } from '../services/platform-cross-layer.service.js';

const router = Router();

router.get('/jobs', async (_req, res, next) => {
  try {
    res.json(await platformCrossLayerService.jobs());
  } catch (error) {
    next(error);
  }
});

router.get('/notifications', async (_req, res, next) => {
  try {
    res.json(await platformCrossLayerService.notifications());
  } catch (error) {
    next(error);
  }
});

export default router;
