import { Router } from 'express';
import { authenticate } from '../../middleware/authenticate.js';
import { authorize } from '../../middleware/authorize.js';
import { asyncHandler } from '../../utils/async-handler.js';
import { messagesController } from './messages.controller.js';

const router = Router();

router.use(authenticate);
router.post('/thread', asyncHandler(messagesController.createThread));
router.get('/inbox', asyncHandler(messagesController.inbox));
router.get('/sent', asyncHandler(messagesController.sent));
router.get('/thread/:id', asyncHandler(messagesController.getThread));
router.post('/thread/:id/reply', asyncHandler(messagesController.reply));
router.post('/broadcast', authorize('ADMIN', 'SUPER_ADMIN'), asyncHandler(messagesController.broadcast));
router.post('/external-email', asyncHandler(messagesController.externalEmail));
router.patch('/thread/:id/read', asyncHandler(messagesController.markRead));
router.patch('/thread/:id/star', asyncHandler(messagesController.setStarred));
router.delete('/thread/:id', asyncHandler(messagesController.deleteThread));

export default router;
