import { Router } from 'express';
import workspacesRoutes from '../../../routes/workspaces.js';
import workspaceZipRoutes from '../../../routes/workspaceZip.routes.js';

const router = Router();

router.get('/_health', (_req, res) => {
  res.json({ domain: 'workspace-intake', status: 'ok', stage: 'adapter' });
});

// Mounted at /api; expose both /api/* and /api/v1/* compatibility paths.
router.use('/workspaces', workspacesRoutes);
router.use('/v1/workspaces', workspacesRoutes);
router.use('/workspace-zip', workspaceZipRoutes);
router.use('/v1/workspace-zip', workspaceZipRoutes);

export default router;
