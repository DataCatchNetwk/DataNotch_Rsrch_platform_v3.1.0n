import { Router } from 'express';
import {
  governanceAccessRequests,
  governanceApproveAccessRequest,
  governanceAuditEvents,
  governanceBulkRole,
  governanceBulkSuspend,
  governanceRejectAccessRequest,
  governanceUpdateRole,
  governanceUpdateStatus,
  governanceUsers,
} from '../controllers/admin-governance.controller.js';
import { authenticate } from '../middleware/authenticate.js';
import { authorize } from '../middleware/authorize.js';
import { validateBody, validateParams } from '../middleware/validate.js';
import {
  adminRequestIdParamsSchema,
  adminUpdateUserRoleSchema,
  adminUpdateUserStatusSchema,
  adminUserIdParamsSchema,
  governanceBulkRoleSchema,
  governanceBulkSuspendSchema,
} from './schemas.js';
import { asyncHandler } from '../utils/async-handler.js';

const router = Router();

router.use(authenticate, authorize('ADMIN', 'SUPER_ADMIN'));

router.get('/users', asyncHandler(governanceUsers));
router.patch('/users/:userId/role', validateParams(adminUserIdParamsSchema), validateBody(adminUpdateUserRoleSchema), asyncHandler(governanceUpdateRole));
router.patch('/users/:userId/status', validateParams(adminUserIdParamsSchema), validateBody(adminUpdateUserStatusSchema), asyncHandler(governanceUpdateStatus));
router.post('/users/bulk-role', validateBody(governanceBulkRoleSchema), asyncHandler(governanceBulkRole));
router.post('/users/bulk-suspend', validateBody(governanceBulkSuspendSchema), asyncHandler(governanceBulkSuspend));
router.get('/access-requests', asyncHandler(governanceAccessRequests));
router.post('/access-requests/:requestId/approve', validateParams(adminRequestIdParamsSchema), asyncHandler(governanceApproveAccessRequest));
router.post('/access-requests/:requestId/reject', validateParams(adminRequestIdParamsSchema), asyncHandler(governanceRejectAccessRequest));
router.get('/audit-events', asyncHandler(governanceAuditEvents));

export default router;