import { Router } from 'express';
import sdohRoutes from '../../../routes/sdoh.js';
import pipelineRoutes from '../../../routes/pipelines.js';
import analysisJobsRoutes from '../../../modules/analysis-jobs/analysis-jobs.module.js';
import statisticsRoutes from '../../../modules/statistics/statistics.module.js';
import mlRoutes from '../../../modules/ml/ml.module.js';
import survivalRoutes from '../../../modules/survival/survival.module.js';
import genomicsRoutes from '../../../modules/genomics/genomics.module.js';
import experimentTrackingRoutes from '../../../modules/experiment-tracking/experiment-tracking.module.js';

const router = Router();

router.get('/_health', (_req, res) => {
  res.json({ domain: 'analytics-ai', status: 'ok', stage: 'adapter' });
});

router.use('/sdoh', sdohRoutes);
router.use('/pipeline-runs', pipelineRoutes);
router.use('/analysis-jobs', analysisJobsRoutes);
router.use('/statistics', statisticsRoutes);
router.use('/ml', mlRoutes);
router.use('/survival', survivalRoutes);
router.use('/genomics', genomicsRoutes);
router.use('/experiments', experimentTrackingRoutes);

export default router;
