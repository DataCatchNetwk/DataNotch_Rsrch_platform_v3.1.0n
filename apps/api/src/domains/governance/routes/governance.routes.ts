import { Router } from 'express';
import adminGovernanceRoutes from '../../../routes/admin-governance.js';
import adminPolicyRoutes from '../../../routes/admin-policy.js';
import governanceCrossLayerRoutes from '../../../routes/governance-cross-layer.js';

const router = Router();

router.get('/_health', (_req, res) => {
  res.json({ domain: 'governance', status: 'ok', stage: 'adapter' });
});

router.use('/admin-governance', adminGovernanceRoutes);
router.use('/admin-policy', adminPolicyRoutes);
router.use('/cross-layer', governanceCrossLayerRoutes);

export default router;
