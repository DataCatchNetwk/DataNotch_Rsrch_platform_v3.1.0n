import { Router } from 'express';
import {
  adminAccessSummary,
  adminApproveRegistration,
  adminAuditEvents,
  adminMonitoring,
  adminOverview,
  adminRegistrations,
  adminRejectRegistration,
  adminUpdateUserRole,
  adminUpdateUserStatus,
  adminUsers,
} from '../controllers/admin.controller.js';
import { authenticate } from '../middleware/authenticate.js';
import { authorize } from '../middleware/authorize.js';
import { validateBody, validateParams } from '../middleware/validate.js';
import {
  adminRequestIdParamsSchema,
  adminUpdateUserRoleSchema,
  adminUpdateUserStatusSchema,
  adminUserIdParamsSchema,
} from './schemas.js';
import { asyncHandler } from '../utils/async-handler.js';

const router = Router();

router.use(authenticate, authorize('ADMIN', 'SUPER_ADMIN'));

router.get('/overview', asyncHandler(adminOverview));
router.get('/users', asyncHandler(adminUsers));
router.patch(
  '/users/:userId/role',
  validateParams(adminUserIdParamsSchema),
  validateBody(adminUpdateUserRoleSchema),
  asyncHandler(adminUpdateUserRole),
);
router.patch(
  '/users/:userId/status',
  validateParams(adminUserIdParamsSchema),
  validateBody(adminUpdateUserStatusSchema),
  asyncHandler(adminUpdateUserStatus),
);
router.get('/registrations', asyncHandler(adminRegistrations));
router.post(
  '/registrations/:requestId/approve',
  validateParams(adminRequestIdParamsSchema),
  asyncHandler(adminApproveRegistration),
);
router.post(
  '/registrations/:requestId/reject',
  validateParams(adminRequestIdParamsSchema),
  asyncHandler(adminRejectRegistration),
);
router.get('/access-summary', asyncHandler(adminAccessSummary));
router.get('/audit-events', asyncHandler(adminAuditEvents));
router.get('/monitoring', asyncHandler(adminMonitoring));

export default router;