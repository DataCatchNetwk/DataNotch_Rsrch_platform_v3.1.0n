import type { Request, Response } from 'express';
import {
  approveGovernanceAccessRequest,
  bulkAssignGovernanceRole,
  bulkSuspendGovernanceUsers,
  listGovernanceAccessRequests,
  listGovernanceAuditEvents,
  listGovernanceUsers,
  rejectGovernanceAccessRequest,
  updateGovernanceUserRole,
  updateGovernanceUserStatus,
} from '../services/admin-governance.service.js';
import type { BulkRoleActionDto, BulkSuspendActionDto } from '../services/admin-governance.dto.js';

export async function governanceUsers(req: Request, res: Response) {
  const result = await listGovernanceUsers({
    search: typeof req.query.search === 'string' ? req.query.search : undefined,
    role: typeof req.query.role === 'string' ? req.query.role as never : undefined,
    status: typeof req.query.status === 'string' ? req.query.status as never : undefined,
  });
  res.json(result);
}

export async function governanceUpdateRole(req: Request, res: Response) {
  res.json(await updateGovernanceUserRole(req.user!, req.params.userId!, req.body.role));
}

export async function governanceUpdateStatus(req: Request, res: Response) {
  res.json(await updateGovernanceUserStatus(req.user!, req.params.userId!, req.body.status));
}

export async function governanceBulkRole(req: Request, res: Response) {
  res.json(await bulkAssignGovernanceRole(req.user!, req.body as BulkRoleActionDto));
}

export async function governanceBulkSuspend(req: Request, res: Response) {
  res.json(await bulkSuspendGovernanceUsers(req.user!, req.body as BulkSuspendActionDto));
}

export async function governanceAccessRequests(_req: Request, res: Response) {
  res.json(await listGovernanceAccessRequests());
}

export async function governanceApproveAccessRequest(req: Request, res: Response) {
  res.json(await approveGovernanceAccessRequest(req.user!, req.params.requestId!));
}

export async function governanceRejectAccessRequest(req: Request, res: Response) {
  res.json(await rejectGovernanceAccessRequest(req.user!, req.params.requestId!));
}

export async function governanceAuditEvents(_req: Request, res: Response) {
  res.json(await listGovernanceAuditEvents());
}