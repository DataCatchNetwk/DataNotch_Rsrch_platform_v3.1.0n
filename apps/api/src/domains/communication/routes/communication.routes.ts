import { Router } from 'express';
import communicationRoutes from '../../../modules/communication/communication.module.js';
import messagesRoutes from '../../../modules/communication/messages.module.js';
import adminCommunicationRoutes from '../../../routes/admin-communication.js';
import userCommunicationRoutes from '../../../routes/user-communication.js';
import supportRoutes from '../../../routes/support.js';

const router = Router();

router.get('/_health', (_req, res) => {
  res.json({ domain: 'communication', status: 'ok', stage: 'adapter' });
});

router.use('/main', communicationRoutes);
router.use('/messages', messagesRoutes);
router.use('/admin', adminCommunicationRoutes);
router.use('/user', userCommunicationRoutes);
router.use('/support', supportRoutes);

export default router;
