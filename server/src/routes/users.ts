import { Router } from 'express';
import { adminOverview, dashboard, listPending, approve } from '../controllers/users.controller.js';
import { authenticate } from '../middleware/authenticate.js';
import { asyncHandler } from '../utils/async-handler.js';

const router = Router();

router.get('/admin/overview', authenticate, asyncHandler(adminOverview));
router.get('/pending', authenticate, asyncHandler(listPending));
router.post('/:userId/approve', authenticate, asyncHandler(approve));
router.get('/:userId/dashboard', authenticate, asyncHandler(dashboard));

export default router;