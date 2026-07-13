import { Router } from 'express';
import { adminOverview, dashboard, listPending, approve } from '../controllers/users.controller.js';
import { authenticate } from '../middleware/authenticate.js';
import { authorize } from '../middleware/authorize.js';
import { asyncHandler } from '../utils/async-handler.js';

const router = Router();

router.get('/admin/overview', authenticate, authorize('ADMIN'), asyncHandler(adminOverview));
router.get('/pending', authenticate, authorize('ADMIN'), asyncHandler(listPending));
router.post('/:userId/approve', authenticate, authorize('ADMIN'), asyncHandler(approve));
router.get('/:userId/dashboard', authenticate, asyncHandler(dashboard));

export default router;
