import type { Request, Response } from 'express';
import {
  approveRegistration,
  getAccessSummary,
  getAdminOverview,
  getAdminUsers,
  getAuditEvents,
  getMonitoring,
  getRegistrations,
  rejectRegistration,
  updateAdminUserRole,
  updateAdminUserStatus,
} from '../services/admin.service.js';

export async function adminOverview(_req: Request, res: Response) {
  res.json(await getAdminOverview());
}

export async function adminUsers(_req: Request, res: Response) {
  res.json(await getAdminUsers());
}

export async function adminUpdateUserRole(req: Request, res: Response) {
  res.json(await updateAdminUserRole(req.params.userId!, req.body.role));
}

export async function adminUpdateUserStatus(req: Request, res: Response) {
  res.json(await updateAdminUserStatus(req.params.userId!, req.body.status));
}

export async function adminRegistrations(_req: Request, res: Response) {
  res.json(await getRegistrations());
}

export async function adminApproveRegistration(req: Request, res: Response) {
  const reviewerUserId = req.user?.id ?? 'system-admin';
  res.json(await approveRegistration(req.params.requestId!, reviewerUserId));
}

export async function adminRejectRegistration(req: Request, res: Response) {
  const reviewerUserId = req.user?.id ?? 'system-admin';
  res.json(await rejectRegistration(req.params.requestId!, reviewerUserId));
}

export async function adminAccessSummary(_req: Request, res: Response) {
  res.json(await getAccessSummary());
}

export async function adminAuditEvents(_req: Request, res: Response) {
  res.json(await getAuditEvents());
}

export async function adminMonitoring(_req: Request, res: Response) {
  res.json(await getMonitoring());
}