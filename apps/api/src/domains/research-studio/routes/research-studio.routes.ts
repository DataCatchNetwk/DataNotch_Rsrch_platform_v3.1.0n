import { Router } from 'express';
import cohortsRoutes from '../../../routes/cohorts.js';
import researchLifecycleRoutes from '../../../routes/research-lifecycle.js';

const router = Router();

router.get('/_health', (_req, res) => {
  res.json({ domain: 'research-studio', status: 'ok', stage: 'adapter' });
});

router.use('/cohorts', cohortsRoutes);
router.use('/v1/cohorts', cohortsRoutes);
router.use('/research-lifecycle', researchLifecycleRoutes);
router.use('/v1/research-lifecycle', researchLifecycleRoutes);

export default router;
