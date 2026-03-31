import fs from 'node:fs';
import path from 'node:path';
import { randomUUID } from 'node:crypto';
import type {
  SupportMessageAuthorType,
  SupportTicket,
  SupportTicketCategory,
  SupportTicketPriority,
  SupportTicketSource,
  SupportTicketStatus,
} from '@prisma/client';
import { prisma } from '../db/prisma.js';
import { HttpError } from '../utils/errors.js';

const SUPPORT_UPLOAD_DIR = path.resolve(process.cwd(), 'uploads', 'support');

type CreateSupportTicketInput = {
  subject?: string;
  description?: string;
  requesterEmail?: string;
  requesterName?: string;
  category?: string;
  source?: SupportTicketSource;
  requesterId?: string;
  attachment?: Express.Multer.File;
};

type ListAdminTicketsFilters = {
  status?: string;
  priority?: string;
  search?: string;
};

type UpdateSupportTicketInput = {
  status?: string;
  priority?: string;
  assignedToId?: string | null;
};

const supportCategories: SupportTicketCategory[] = [
  'LOGIN',
  'BILLING',
  'TECHNICAL',
  'DATASET',
  'ACCESS',
  'ACCOUNT',
  'SECURITY',
  'OTHER',
];

const supportStatuses: SupportTicketStatus[] = [
  'OPEN',
  'TRIAGED',
  'IN_PROGRESS',
  'WAITING_FOR_USER',
  'RESOLVED',
  'CLOSED',
  'SPAM',
];

const supportPriorities: SupportTicketPriority[] = ['LOW', 'MEDIUM', 'HIGH', 'CRITICAL'];

function inferPriority(category: SupportTicketCategory): SupportTicketPriority {
  switch (category) {
    case 'SECURITY':
      return 'CRITICAL';
    case 'ACCESS':
    case 'LOGIN':
      return 'HIGH';
    case 'TECHNICAL':
    case 'DATASET':
      return 'MEDIUM';
    default:
      return 'LOW';
  }
}

function normalizeStatus(status: string | undefined): SupportTicketStatus | undefined {
  if (!status) return undefined;
  const value = status.toUpperCase() as SupportTicketStatus;
  if (!supportStatuses.includes(value)) {
    throw new HttpError(400, 'Invalid support status');
  }

  return value;
}

function normalizePriority(priority: string | undefined): SupportTicketPriority | undefined {
  if (!priority) return undefined;
  const value = priority.toUpperCase() as SupportTicketPriority;
  if (!supportPriorities.includes(value)) {
    throw new HttpError(400, 'Invalid support priority');
  }

  return value;
}

function normalizeCategory(category: string | undefined): SupportTicketCategory {
  const value = (category ?? 'OTHER').toUpperCase() as SupportTicketCategory;
  if (!supportCategories.includes(value)) {
    throw new HttpError(400, 'Invalid support category');
  }

  return value;
}

function saveAttachment(file: Express.Multer.File | undefined) {
  if (!file) return { attachmentUrl: null, attachmentName: null };

  fs.mkdirSync(SUPPORT_UPLOAD_DIR, { recursive: true });
  const ext = path.extname(file.originalname);
  const fileName = `${Date.now()}-${randomUUID().slice(0, 8)}${ext}`;
  const targetPath = path.join(SUPPORT_UPLOAD_DIR, fileName);

  if (file.buffer) {
    fs.writeFileSync(targetPath, file.buffer);
  } else {
    fs.copyFileSync(file.path, targetPath);
  }

  return {
    attachmentUrl: `/uploads/support/${fileName}`,
    attachmentName: file.originalname,
  };
}

async function nextTicketNumber() {
  const year = new Date().getUTCFullYear();
  const total = await prisma.supportTicket.count();
  return `SUP-${year}-${String(total + 1).padStart(5, '0')}`;
}

function canAccessTicket(userId: string, userEmail: string, ticket: Pick<SupportTicket, 'requesterEmail' | 'createdByUserId'>) {
  return ticket.createdByUserId === userId || ticket.requesterEmail.toLowerCase() === userEmail.toLowerCase();
}

export async function createSupportTicket(input: CreateSupportTicketInput) {
  const subject = input.subject?.trim();
  const description = input.description?.trim();
  const requesterEmail = input.requesterEmail?.trim().toLowerCase();

  if (!subject) throw new HttpError(400, 'Subject is required');
  if (!description) throw new HttpError(400, 'Description is required');
  if (!requesterEmail) throw new HttpError(400, 'Requester email is required');

  const category = normalizeCategory(input.category);
  const priority = inferPriority(category);
  const ticketNumber = await nextTicketNumber();
  const attachment = saveAttachment(input.attachment);

  return prisma.supportTicket.create({
    data: {
      ticketNumber,
      subject,
      description,
      requesterEmail,
      requesterName: input.requesterName?.trim() || null,
      category,
      priority,
      status: 'OPEN',
      source: input.source ?? 'API',
      tags: [],
      attachmentUrl: attachment.attachmentUrl,
      attachmentName: attachment.attachmentName,
      createdByUserId: input.requesterId ?? null,
      messages: {
        create: {
          authorType: input.requesterId ? 'USER' : 'SYSTEM',
          authorUserId: input.requesterId ?? null,
          body: description,
          isInternal: false,
          attachmentUrl: attachment.attachmentUrl,
          attachmentName: attachment.attachmentName,
        },
      },
      activities: {
        create: {
          actorUserId: input.requesterId ?? null,
          type: 'TICKET_CREATED',
          description: 'Support ticket created',
        },
      },
    },
    include: {
      messages: {
        include: {
          authorUser: {
            select: { id: true, firstname: true, surname: true, email: true },
          },
        },
        orderBy: { createdAt: 'asc' },
      },
      assignedTo: {
        select: { id: true, firstname: true, surname: true, email: true },
      },
    },
  });
}

export async function listSupportTicketsForUser(identity: { userId: string; email: string }) {
  return prisma.supportTicket.findMany({
    where: {
      OR: [
        { createdByUserId: identity.userId },
        { requesterEmail: identity.email.toLowerCase() },
      ],
    },
    orderBy: { createdAt: 'desc' },
  });
}

export async function listSupportTicketsForAdmin(filters: ListAdminTicketsFilters) {
  const status = normalizeStatus(filters.status);
  const priority = normalizePriority(filters.priority);
  const search = filters.search?.trim();

  return prisma.supportTicket.findMany({
    where: {
      ...(status ? { status } : {}),
      ...(priority ? { priority } : {}),
      ...(search
        ? {
            OR: [
              { ticketNumber: { contains: search, mode: 'insensitive' } },
              { subject: { contains: search, mode: 'insensitive' } },
              { requesterEmail: { contains: search, mode: 'insensitive' } },
            ],
          }
        : {}),
    },
    include: {
      assignedTo: {
        select: { id: true, firstname: true, surname: true, email: true },
      },
    },
    orderBy: { createdAt: 'desc' },
  });
}

export async function getSupportTicketDetail(ticketId: string) {
  const ticket = await prisma.supportTicket.findUnique({
    where: { id: ticketId },
    include: {
      assignedTo: {
        select: { id: true, firstname: true, surname: true, email: true },
      },
      createdByUser: {
        select: { id: true, firstname: true, surname: true, email: true },
      },
      messages: {
        include: {
          authorUser: {
            select: { id: true, firstname: true, surname: true, email: true },
          },
        },
        orderBy: { createdAt: 'asc' },
      },
      activities: {
        orderBy: { createdAt: 'desc' },
      },
    },
  });

  if (!ticket) throw new HttpError(404, 'Support ticket not found');
  return ticket;
}

export async function getSupportTicketForUser(ticketId: string, identity: { userId: string; email: string; isAdmin: boolean }) {
  const ticket = await getSupportTicketDetail(ticketId);
  if (identity.isAdmin) return ticket;

  if (!canAccessTicket(identity.userId, identity.email, ticket)) {
    throw new HttpError(403, 'Forbidden');
  }

  return ticket;
}

export async function addSupportReply(
  ticketId: string,
  input: { message?: string; isInternal?: boolean; attachment?: Express.Multer.File },
  actor: { userId: string; email: string; isAdmin: boolean },
) {
  const ticket = await getSupportTicketForUser(ticketId, actor);
  const body = input.message?.trim();
  if (!body) throw new HttpError(400, 'Reply message is required');

  const attachment = saveAttachment(input.attachment);
  const internal = actor.isAdmin ? Boolean(input.isInternal) : false;
  const authorType: SupportMessageAuthorType = actor.isAdmin ? 'ADMIN' : 'USER';

  await prisma.$transaction(async (tx) => {
    await tx.supportMessage.create({
      data: {
        ticketId: ticket.id,
        authorType,
        authorUserId: actor.userId,
        body,
        isInternal: internal,
        attachmentUrl: attachment.attachmentUrl,
        attachmentName: attachment.attachmentName,
      },
    });

    const updates: {
      status: SupportTicketStatus;
      firstResponseAt?: Date;
    } = {
      status: actor.isAdmin ? 'WAITING_FOR_USER' : 'OPEN',
    };

    if (actor.isAdmin && !ticket.firstResponseAt) {
      updates.firstResponseAt = new Date();
    }

    await tx.supportTicket.update({
      where: { id: ticket.id },
      data: updates,
    });

    await tx.supportActivity.create({
      data: {
        ticketId: ticket.id,
        actorUserId: actor.userId,
        type: 'REPLY_ADDED',
        description: actor.isAdmin ? 'Admin added a reply' : 'Requester added a reply',
      },
    });
  });

  return getSupportTicketDetail(ticketId);
}

export async function updateSupportTicket(
  ticketId: string,
  input: UpdateSupportTicketInput,
  actorUserId: string,
) {
  const ticket = await getSupportTicketDetail(ticketId);
  const status = normalizeStatus(input.status);
  const priority = normalizePriority(input.priority);

  if (!status && !priority && input.assignedToId === undefined) {
    throw new HttpError(400, 'No update fields provided');
  }

  if (input.assignedToId) {
    const assignee = await prisma.user.findUnique({ where: { id: input.assignedToId } });
    if (!assignee) {
      throw new HttpError(404, 'Assignee not found');
    }
  }

  const now = new Date();

  await prisma.$transaction(async (tx) => {
    await tx.supportTicket.update({
      where: { id: ticket.id },
      data: {
        ...(status ? { status } : {}),
        ...(priority ? { priority } : {}),
        ...(input.assignedToId !== undefined ? { assignedToId: input.assignedToId || null } : {}),
        ...(status === 'RESOLVED' ? { resolvedAt: now } : {}),
        ...(status === 'CLOSED' ? { closedAt: now } : {}),
      },
    });

    await tx.supportActivity.create({
      data: {
        ticketId: ticket.id,
        actorUserId,
        type: 'TICKET_UPDATED',
        description: 'Support ticket was updated',
        metaJson: {
          status: status ?? null,
          priority: priority ?? null,
          assignedToId: input.assignedToId ?? null,
        },
      },
    });
  });

  return getSupportTicketDetail(ticket.id);
}
