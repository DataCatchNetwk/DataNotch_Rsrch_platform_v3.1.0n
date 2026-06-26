import { Router } from 'express';
import { authenticate } from '../../middleware/authenticate.js';
import { authorize } from '../../middleware/authorize.js';
import { asyncHandler } from '../../utils/async-handler.js';
import { communicationController } from './communication.controller.js';

const router = Router();

router.use(authenticate);
router.get('/rooms', asyncHandler(communicationController.listRooms));
router.post('/rooms', asyncHandler(communicationController.createRoom));
router.get('/rooms/:roomId', asyncHandler(communicationController.roomState));
router.post('/rooms/:roomId/messages', asyncHandler(communicationController.sendMessage));
router.post('/rooms/:roomId/call/start', asyncHandler(communicationController.startCall));
router.post('/call-sessions/:callSessionId/end', asyncHandler(communicationController.endCall));
router.get('/monitoring', authorize('ADMIN', 'SUPER_ADMIN'), asyncHandler(communicationController.monitoring));
router.get('/audit', authorize('ADMIN', 'SUPER_ADMIN'), asyncHandler(communicationController.audit));

export default router;
