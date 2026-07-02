import { Router } from 'express';
import { platformCrossLayerService, type HandoffPayload, type PlatformStage } from '../services/platform-cross-layer.service.js';

const validStages = new Set<PlatformStage>([
  'WORKSPACE_INTAKE',
  'DATA_MANAGEMENT',
  'DATA_PREPARATION',
  'RESEARCH_STUDIO',
  'ANALYTICS_AI',
  'OUTPUTS',
]);

const router = Router();

router.get('/overview', async (_req, res, next) => {
  try {
    res.json(await platformCrossLayerService.overview());
  } catch (error) {
    next(error);
  }
});

router.get('/stages/:stage', async (req, res, next) => {
  try {
    const stage = String(req.params.stage).toUpperCase() as PlatformStage;
    if (!validStages.has(stage)) {
      res.status(400).json({ message: `Invalid stage: ${req.params.stage}` });
      return;
    }
    res.json(await platformCrossLayerService.stage(stage));
  } catch (error) {
    next(error);
  }
});

router.post('/handoff', async (req, res, next) => {
  try {
    const payload = req.body as HandoffPayload;
    if (!payload?.sourceStage || !payload?.targetStage || !payload?.artifactId || !payload?.artifactType || !payload?.requestedBy) {
      res.status(400).json({ message: 'sourceStage, targetStage, artifactId, artifactType, and requestedBy are required.' });
      return;
    }

    if (!validStages.has(payload.sourceStage) || !validStages.has(payload.targetStage)) {
      res.status(400).json({ message: 'sourceStage and targetStage must be valid platform lifecycle stages.' });
      return;
    }

    res.status(201).json(await platformCrossLayerService.handoff(payload));
  } catch (error) {
    next(error);
  }
});

export default router;
