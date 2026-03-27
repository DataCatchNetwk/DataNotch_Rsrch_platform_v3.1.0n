import { Router } from 'express';
import { create, getById, list } from '../controllers/health-data.controller.js';
import { authenticate } from '../middleware/authenticate.js';
import { authorize } from '../middleware/authorize.js';
import { validateBody } from '../middleware/validate.js';
import { createHealthDataSchema } from './schemas.js';
import { asyncHandler } from '../utils/async-handler.js';

const router = Router();

router.get('/', authenticate, authorize('ADMIN', 'ANALYST'), asyncHandler(list));
router.get('/:id', authenticate, authorize('ADMIN', 'ANALYST'), asyncHandler(getById));
router.post('/', authenticate, authorize('ADMIN'), validateBody(createHealthDataSchema), asyncHandler(create));

export default router;
