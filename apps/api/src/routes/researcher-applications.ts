import { Router } from 'express';
import multer from 'multer';
import {
  listApplications,
  getApplicationById,
  reviewApplicationById,
  requestMoreInfoById,
} from '../controllers/researcher-application.controller.js';
import { authenticate } from '../middleware/authenticate.js';
import { authorize } from '../middleware/authorize.js';
import { asyncHandler } from '../utils/async-handler.js';

const router = Router();

// All admin routes require authentication and an admin-equivalent role.
router.use(authenticate, authorize('ADMIN'));

router.get('/', asyncHandler(listApplications));
router.get('/:id', asyncHandler(getApplicationById));
router.patch('/:id/review', asyncHandler(reviewApplicationById));
router.patch('/:id/request-more-info', asyncHandler(requestMoreInfoById));

export default router;
