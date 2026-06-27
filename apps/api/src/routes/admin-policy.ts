import { Router } from 'express';
import {
  adminPolicyApproveRegistration,
  adminPolicyBulkRole,
  adminPolicyBulkStatus,
  adminPolicyExportAudit,
  adminPolicyRejectRegistration,
} from '../controllers/admin-policy.controller.js';
import { authenticate } from '../middleware/authenticate.js';
import { authorize } from '../middleware/authorize.js';
import { validateBody, validateParams } from '../middleware/validate.js';
import {
  adminPolicyApprovalDecisionSchema,
  adminPolicyBulkRoleSchema,
  adminPolicyBulkStatusSchema,
  adminRequestIdParamsSchema,
} from './schemas.js';
import { asyncHandler } from '../utils/async-handler.js';

const router = Router();

router.use(authenticate, authorize('ADMIN', 'SUPER_ADMIN'));

router.post('/users/bulk-role', validateBody(adminPolicyBulkRoleSchema), asyncHandler(adminPolicyBulkRole));
router.post('/users/bulk-status', validateBody(adminPolicyBulkStatusSchema), asyncHandler(adminPolicyBulkStatus));
router.post(
  '/registrations/:requestId/approve',
  validateParams(adminRequestIdParamsSchema),
  validateBody(adminPolicyApprovalDecisionSchema),
  asyncHandler(adminPolicyApproveRegistration),
);
router.post(
  '/registrations/:requestId/reject',
  validateParams(adminRequestIdParamsSchema),
  validateBody(adminPolicyApprovalDecisionSchema),
  asyncHandler(adminPolicyRejectRegistration),
);
router.get('/audit-events/export', asyncHandler(adminPolicyExportAudit));

export default router;
