import { Router } from 'express';
import dataPreparationRoutes from '../../../routes/data-preparation.js';

const router = Router();

router.get('/_health', (_req, res) => {
  res.json({ domain: 'data-preparation', status: 'ok', stage: 'adapter' });
});

// Mounted at /api; expose both /api/* and /api/v1/* compatibility paths.
router.use('/data-preparation', dataPreparationRoutes);
router.use('/v1/data-preparation', dataPreparationRoutes);

export default router;
