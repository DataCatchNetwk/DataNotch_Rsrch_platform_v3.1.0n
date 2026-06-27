import type { Request, Response } from 'express';
import { getAdminOverview, getUserDashboard } from '../services/dashboard.service.js';
import { getPendingUsers, approveUser } from '../services/auth.service.js';
import { HttpError } from '../utils/errors.js';

export async function dashboard(req: Request, res: Response) {
  if (!req.user) {
    throw new HttpError(401, 'Authentication required');
  }

  const canAccess = req.user.id === req.params.userId || req.user.roles.includes('ADMIN');
  if (!canAccess) {
    throw new HttpError(403, 'You do not have access to this dashboard');
  }

  const result = await getUserDashboard(req.params.userId);
  res.json(result);
}

export async function listPending(req: Request, res: Response) {
  if (!req.user?.roles.includes('ADMIN')) {
    throw new HttpError(403, 'Admin access required');
  }
  const users = await getPendingUsers();
  res.json({ users });
}

export async function approve(req: Request, res: Response) {
  if (!req.user?.roles.includes('ADMIN')) {
    throw new HttpError(403, 'Admin access required');
  }
  const result = await approveUser(req.params.userId);
  res.json(result);
}

export async function adminOverview(req: Request, res: Response) {
  if (!req.user?.roles.includes('ADMIN')) {
    throw new HttpError(403, 'Admin access required');
  }
  const result = await getAdminOverview();
  res.json(result);
}