import { Router } from 'express';
import { authenticate } from '../middleware/authenticate.js';
import { asyncHandler } from '../utils/async-handler.js';
import {
  listMyNotifications,
  readAllNotifications,
  readNotification,
  unreadNotificationCount,
} from '../controllers/notifications.controller.js';

const router = Router();

router.use(authenticate);

router.get('/', asyncHandler(listMyNotifications));
router.get('/unread-count', asyncHandler(unreadNotificationCount));
router.patch('/read-all', asyncHandler(readAllNotifications));
router.patch('/:notificationId/read', asyncHandler(readNotification));

export default router;