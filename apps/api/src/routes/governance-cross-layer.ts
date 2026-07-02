import { Router } from 'express';
import { platformCrossLayerService } from '../services/platform-cross-layer.service.js';

const router = Router();

router.get('/audit', async (_req, res, next) => {
  try {
    res.json(await platformCrossLayerService.audit());
  } catch (error) {
    next(error);
  }
});

router.get('/lineage', async (_req, res, next) => {
  try {
    res.json(await platformCrossLayerService.lineage());
  } catch (error) {
    next(error);
  }
});

export default router;
