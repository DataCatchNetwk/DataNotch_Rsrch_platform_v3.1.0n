import type { Request, Response } from 'express';
import {
  approveRegistration,
  bulkRoleUpdate,
  bulkStatusUpdate,
  exportAuditEvents,
  rejectRegistration,
} from '../services/admin-policy-ops.service.js';
import type { ApprovalDecisionDto, BulkRoleActionDto, BulkStatusActionDto } from '../services/admin-policy.dto.js';

export async function adminPolicyBulkRole(req: Request, res: Response) {
  res.json(await bulkRoleUpdate(req.user!, req.body as BulkRoleActionDto));
}

export async function adminPolicyBulkStatus(req: Request, res: Response) {
  res.json(await bulkStatusUpdate(req.user!, req.body as BulkStatusActionDto));
}

export async function adminPolicyApproveRegistration(req: Request, res: Response) {
  res.json(await approveRegistration(req.user!, req.params.requestId!, req.body as ApprovalDecisionDto));
}

export async function adminPolicyRejectRegistration(req: Request, res: Response) {
  res.json(await rejectRegistration(req.user!, req.params.requestId!, req.body as ApprovalDecisionDto));
}

export async function adminPolicyExportAudit(req: Request, res: Response) {
  const csv = await exportAuditEvents(req.user!);
  res.setHeader('Content-Type', 'text/csv; charset=utf-8');
  res.setHeader('Content-Disposition', 'attachment; filename="admin-audit-events.csv"');
  res.send(csv);
}
