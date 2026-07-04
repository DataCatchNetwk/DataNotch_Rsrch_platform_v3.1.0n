import { Router } from 'express';
import opsRoutes from '../../../routes/ops.js';
import systemMonitoringRealtimeRoutes from '../../../modules/system-monitoring-realtime/system-monitoring-realtime.module.js';
import systemMonitoringRoutes from '../../../modules/system-monitoring/system-monitoring.module.js';
import systemServicesCrossLayerRoutes from '../../../routes/system-services-cross-layer.js';

const router = Router();

router.get('/_health', (_req, res) => {
  res.json({ domain: 'system-services', status: 'ok', stage: 'adapter' });
});

router.use('/ops', opsRoutes);
router.use('/system-monitoring/realtime', systemMonitoringRealtimeRoutes);
router.use('/system-monitoring', systemMonitoringRoutes);
router.use('/cross-layer', systemServicesCrossLayerRoutes);

export default router;
