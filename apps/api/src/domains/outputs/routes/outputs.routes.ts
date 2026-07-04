import { Router } from 'express';
import notificationRoutes from '../../../routes/notifications.js';

const router = Router();

router.get('/_health', (_req, res) => {
  res.json({ domain: 'outputs', status: 'ok', stage: 'adapter' });
});

router.use('/notifications', notificationRoutes);

export default router;
