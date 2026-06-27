import { Router } from 'express';
import multer from 'multer';
import {
	createSupportRequest,
	getSupportRequestById,
	listAdminSupportRequests,
	listMySupportRequests,
	replySupportRequest,
	updateSupportRequest,
} from '../controllers/support.controller.js';
import { authenticate } from '../middleware/authenticate.js';
import { authenticateOptional } from '../middleware/authenticate-optional.js';
import { authorize } from '../middleware/authorize.js';
import { asyncHandler } from '../utils/async-handler.js';

const router = Router();
const supportUpload = multer({
	storage: multer.memoryStorage(),
	limits: { fileSize: 8 * 1024 * 1024, files: 1 },
}).single('attachment');

router.post('/', authenticateOptional, supportUpload, asyncHandler(createSupportRequest));
router.get('/mine', authenticate, asyncHandler(listMySupportRequests));
router.get('/admin', authenticate, authorize('ADMIN', 'SUPER_ADMIN'), asyncHandler(listAdminSupportRequests));
router.get('/:ticketId', authenticate, asyncHandler(getSupportRequestById));
router.post('/:ticketId/reply', authenticate, supportUpload, asyncHandler(replySupportRequest));
router.patch('/:ticketId', authenticate, authorize('ADMIN', 'SUPER_ADMIN'), asyncHandler(updateSupportRequest));

export default router;
