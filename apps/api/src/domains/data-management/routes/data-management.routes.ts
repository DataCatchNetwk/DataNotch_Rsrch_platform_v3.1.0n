import { Router } from 'express';
import databaseRoutes from '../../../routes/database.js';
import datasetRegistryRoutes from '../../../routes/dataset-registry.js';
import dataDepositRoutes from '../../../routes/data-deposit.js';

const router = Router();

router.get('/_health', (_req, res) => {
  res.json({ domain: 'data-management', status: 'ok', stage: 'adapter' });
});

router.use('/database', databaseRoutes);
router.use('/v1/database', databaseRoutes);
router.use('/dataset-registry', datasetRegistryRoutes);
router.use('/v1/dataset-registry', datasetRegistryRoutes);
router.use('/v1/datasets/deposit', dataDepositRoutes);

export default router;
