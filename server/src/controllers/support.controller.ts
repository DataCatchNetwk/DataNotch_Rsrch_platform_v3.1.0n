import type { Request, Response } from 'express';
import { HttpError } from '../utils/errors.js';
import {
  addSupportReply,
  createSupportTicket,
  getSupportTicketForUser,
  listSupportTicketsForAdmin,
  listSupportTicketsForUser,
  updateSupportTicket,
} from '../services/support.service.js';

function requireUser(req: Request) {
  if (!req.user) {
    throw new HttpError(401, 'Authentication required');
  }

  return req.user;
}

export async function createSupportRequest(req: Request, res: Response) {
  const requesterId = req.user?.id;
  const requesterEmail = req.user?.email || req.body?.requesterEmail;
  const requesterName = req.body?.requesterName;

  const source = requesterId ? 'USER_DASHBOARD' : 'LOGIN_PAGE';

  const ticket = await createSupportTicket({
    subject: req.body?.subject,
    description: req.body?.description,
    requesterEmail,
    requesterName,
    category: req.body?.category,
    requesterId,
    source,
    attachment: req.file,
  });

  res.status(201).json(ticket);
}

export async function listMySupportRequests(req: Request, res: Response) {
  const user = requireUser(req);
  const tickets = await listSupportTicketsForUser({ userId: user.id, email: user.email });
  res.json({ tickets });
}

export async function listAdminSupportRequests(req: Request, res: Response) {
  const tickets = await listSupportTicketsForAdmin({
    status: req.query.status as string | undefined,
    priority: req.query.priority as string | undefined,
    search: req.query.search as string | undefined,
  });
  res.json({ tickets });
}

export async function getSupportRequestById(req: Request, res: Response) {
  const user = requireUser(req);
  const isAdmin = user.roles.includes('ADMIN') || user.roles.includes('SUPER_ADMIN');
  const ticket = await getSupportTicketForUser(req.params.ticketId!, {
    userId: user.id,
    email: user.email,
    isAdmin,
  });
  res.json(ticket);
}

export async function replySupportRequest(req: Request, res: Response) {
  const user = requireUser(req);
  const isAdmin = user.roles.includes('ADMIN') || user.roles.includes('SUPER_ADMIN');
  const ticket = await addSupportReply(
    req.params.ticketId!,
    {
      message: req.body?.message,
      isInternal: req.body?.isInternal === 'true' || req.body?.isInternal === true,
      attachment: req.file,
    },
    {
      userId: user.id,
      email: user.email,
      isAdmin,
    },
  );

  res.json(ticket);
}

export async function updateSupportRequest(req: Request, res: Response) {
  const user = requireUser(req);
  const ticket = await updateSupportTicket(
    req.params.ticketId!,
    {
      status: req.body?.status,
      priority: req.body?.priority,
      assignedToId: req.body?.assignedToId,
    },
    user.id,
  );
  res.json(ticket);
}
