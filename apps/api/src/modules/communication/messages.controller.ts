import type { Request, Response } from 'express';
import type { InboxMessageCategory, InboxMessageType } from '@prisma/client';
import { HttpError } from '../../utils/errors.js';
import { inboxService } from './services/inbox.service.js';
import { prisma } from '../../db/prisma.js';

const ALLOWED_CATEGORIES = new Set<InboxMessageCategory>([
  'USER_MESSAGE',
  'ADMIN_MESSAGE',
  'STUDY_REQUEST',
  'DATASET_REQUEST',
  'REVIEW_REQUEST',
  'APPROVAL_REQUEST',
  'SUPPORT_TICKET',
  'MEETING_INVITATION',
  'SYSTEM_ALERT',
  'ANNOUNCEMENT',
  'BROADCAST',
]);

function requireUser(req: Request) {
  if (!req.user) {
    throw new HttpError(401, 'Authentication required');
  }

  return req.user;
}

function parseCategory(value: unknown, fallback: InboxMessageCategory): InboxMessageCategory {
  const candidate = typeof value === 'string' ? (value.toUpperCase() as InboxMessageCategory) : fallback;
  if (!ALLOWED_CATEGORIES.has(candidate)) {
    throw new HttpError(400, 'Invalid message category');
  }
  return candidate;
}

function enforceCategoryPolicy(category: InboxMessageCategory, roles: string[]) {
  const isAdmin = roles.includes('ADMIN') || roles.includes('SUPER_ADMIN');
  if (isAdmin) return;

  const allowedForUser = new Set<InboxMessageCategory>([
    'USER_MESSAGE',
    'SUPPORT_TICKET',
    'STUDY_REQUEST',
    'DATASET_REQUEST',
    'REVIEW_REQUEST',
  ]);

  if (!allowedForUser.has(category)) {
    throw new HttpError(403, `Category ${category} is admin-restricted`);
  }
}

function parseMessageType(value: unknown, fallback: InboxMessageType = 'TEXT'): InboxMessageType {
  const allowed: InboxMessageType[] = ['TEXT', 'MEETING_INVITATION', 'ANNOUNCEMENT', 'SUPPORT', 'SYSTEM'];
  const candidate = typeof value === 'string' ? (value.toUpperCase() as InboxMessageType) : fallback;
  if (!allowed.includes(candidate)) {
    throw new HttpError(400, 'Invalid message type');
  }
  return candidate;
}

export class MessagesController {
  createThread = async (req: Request, res: Response): Promise<void> => {
    const user = requireUser(req);
    const subject = typeof req.body?.subject === 'string' ? req.body.subject.trim() : '';
    const body = typeof req.body?.body === 'string' ? req.body.body.trim() : '';

    if (!subject) throw new HttpError(400, 'subject is required');

    const category = parseCategory(req.body?.category, 'USER_MESSAGE');
    enforceCategoryPolicy(category, user.roles);

    const asStringArray = (value: unknown) =>
      Array.isArray(value) ? value.filter((v: unknown): v is string => typeof v === 'string').map((v) => v.trim()).filter(Boolean) : [];

    const recipientEmails = asStringArray(req.body?.recipientEmails);
    const ccEmails = asStringArray(req.body?.ccEmails);
    const bccEmails = asStringArray(req.body?.bccEmails);
    const allEmails = Array.from(new Set([...recipientEmails, ...ccEmails, ...bccEmails]));

    let participantIdsFromEmails: string[] = [];
    if (allEmails.length) {
      const users = await prisma.user.findMany({
        where: { email: { in: allEmails } },
        select: { id: true },
      });
      participantIdsFromEmails = users.map((userRecord) => userRecord.id);
    }

    const participantIds = Array.from(new Set([
      ...(
        Array.isArray(req.body?.participantIds)
          ? req.body.participantIds.filter((v: unknown): v is string => typeof v === 'string')
          : []
      ),
      ...participantIdsFromEmails,
    ]));

    const result = await inboxService.createThread({
      actor: { id: user.id, email: user.email, roles: user.roles },
      subject,
      category,
      body,
      messageType: parseMessageType(req.body?.messageType),
      participantIds,
      assetType: typeof req.body?.assetType === 'string' ? req.body.assetType : undefined,
      assetId: typeof req.body?.assetId === 'string' ? req.body.assetId : undefined,
      sendEmailCopy: Boolean(req.body?.sendEmailCopy),
    });

    res.status(201).json(result);
  };

  inbox = async (req: Request, res: Response): Promise<void> => {
    const user = requireUser(req);
    const folderQuery = typeof req.query?.folder === 'string' ? req.query.folder.toLowerCase() : 'inbox';
    const folder: 'inbox' | 'drafts' | 'spam' | 'deleted' | 'sent' | 'starred' =
      folderQuery === 'drafts' || folderQuery === 'spam' || folderQuery === 'deleted' || folderQuery === 'sent' || folderQuery === 'starred'
        ? folderQuery
        : 'inbox';
    const items = await inboxService.listInbox({ id: user.id, email: user.email, roles: user.roles }, folder);
    res.json({ items });
  };

  sent = async (req: Request, res: Response): Promise<void> => {
    const user = requireUser(req);
    const items = await inboxService.listSent(user.id);
    res.json({ items });
  };

  getThread = async (req: Request, res: Response): Promise<void> => {
    const user = requireUser(req);
    const thread = await inboxService.getThread(req.params.id, { id: user.id, email: user.email, roles: user.roles });
    res.json(thread);
  };

  reply = async (req: Request, res: Response): Promise<void> => {
    const user = requireUser(req);
    const body = typeof req.body?.body === 'string' ? req.body.body.trim() : '';
    if (!body) throw new HttpError(400, 'body is required');

    const message = await inboxService.reply(req.params.id, { id: user.id, email: user.email, roles: user.roles }, {
      body,
      messageType: parseMessageType(req.body?.messageType),
      attachmentUrl: typeof req.body?.attachmentUrl === 'string' ? req.body.attachmentUrl : undefined,
      sendEmailCopy: Boolean(req.body?.sendEmailCopy),
    });

    res.status(201).json(message);
  };

  broadcast = async (req: Request, res: Response): Promise<void> => {
    const user = requireUser(req);
    const subject = typeof req.body?.subject === 'string' ? req.body.subject.trim() : '';
    const body = typeof req.body?.body === 'string' ? req.body.body.trim() : '';
    if (!subject || !body) throw new HttpError(400, 'subject and body are required');

    const result = await inboxService.broadcast({
      actor: { id: user.id, email: user.email, roles: user.roles },
      subject,
      body,
      category: parseCategory(req.body?.category, 'BROADCAST'),
      sendEmailCopy: Boolean(req.body?.sendEmailCopy),
    });

    res.status(201).json(result);
  };

  externalEmail = async (req: Request, res: Response): Promise<void> => {
    const user = requireUser(req);
    const recipientEmail = typeof req.body?.recipientEmail === 'string' ? req.body.recipientEmail.trim() : '';
    const subject = typeof req.body?.subject === 'string' ? req.body.subject.trim() : '';
    const body = typeof req.body?.body === 'string' ? req.body.body.trim() : '';

    if (!recipientEmail || !subject || !body) throw new HttpError(400, 'recipientEmail, subject, and body are required');

    const emailLog = await inboxService.externalEmail({
      senderId: user.id,
      recipientEmail,
      subject,
      body,
    });

    res.status(201).json(emailLog);
  };

  markRead = async (req: Request, res: Response): Promise<void> => {
    const user = requireUser(req);
    const result = await inboxService.markRead(req.params.id, user.id);
    res.json(result);
  };

  setStarred = async (req: Request, res: Response): Promise<void> => {
    const user = requireUser(req);
    const starred = typeof req.body?.starred === 'boolean' ? req.body.starred : true;
    const result = await inboxService.setThreadStarred(req.params.id, { id: user.id, email: user.email, roles: user.roles }, starred);
    res.json(result);
  };

  deleteThread = async (req: Request, res: Response): Promise<void> => {
    const user = requireUser(req);
    const result = await inboxService.archiveThread(req.params.id, { id: user.id, email: user.email, roles: user.roles });
    res.json(result);
  };
}

export const messagesController = new MessagesController();

