import { NotificationSeverity, NotificationType, type InboxMessageCategory, type InboxMessageType } from '@prisma/client';
import { prisma } from '../../../db/prisma.js';
import { HttpError } from '../../../utils/errors.js';
import { createNotification } from '../../../services/notifications.service.js';

type AuthLikeUser = {
  id: string;
  email: string;
  roles: string[];
};

function isAdmin(roles: string[]) {
  return roles.includes('ADMIN') || roles.includes('SUPER_ADMIN');
}

async function notifyParticipants(userIds: string[], title: string, description: string) {
  await Promise.all(
    userIds.map((userId) =>
      createNotification({
        userId,
        type: NotificationType.REQUEST_COMMENT,
        title,
        description,
        severity: NotificationSeverity.INFO,
      }),
    ),
  );
}

export class InboxService {
  private extractThreadId(metadataJson: unknown): string | null {
    if (!metadataJson || typeof metadataJson !== 'object') return null;
    const record = metadataJson as Record<string, unknown>;
    const threadId = record.threadId;
    return typeof threadId === 'string' && threadId.trim().length > 0 ? threadId : null;
  }

  private async resolveStarredThreadIds(userId: string) {
    const logs = await prisma.communicationAuditLog.findMany({
      where: {
        actorUserId: userId,
        action: { in: ['INBOX_THREAD_STARRED', 'INBOX_THREAD_UNSTARRED'] },
      },
      orderBy: { createdAt: 'desc' },
      take: 2000,
      select: {
        action: true,
        metadataJson: true,
      },
    });

    const latestByThread = new Map<string, boolean>();
    for (const log of logs) {
      const threadId = this.extractThreadId(log.metadataJson);
      if (!threadId || latestByThread.has(threadId)) continue;
      latestByThread.set(threadId, log.action === 'INBOX_THREAD_STARRED');
    }

    return new Set(Array.from(latestByThread.entries()).filter(([, isStarred]) => isStarred).map(([threadId]) => threadId));
  }

  async createThread(input: {
    actor: AuthLikeUser;
    subject: string;
    category: InboxMessageCategory;
    body?: string;
    messageType?: InboxMessageType;
    participantIds: string[];
    assetType?: string;
    assetId?: string;
    attachmentUrl?: string;
    sendEmailCopy?: boolean;
  }) {
    const participantIds = Array.from(new Set([input.actor.id, ...input.participantIds.filter(Boolean)]));

    const thread = await prisma.inboxThread.create({
      data: {
        subject: input.subject,
        category: input.category,
        assetType: input.assetType,
        assetId: input.assetId,
        createdById: input.actor.id,
        participants: {
          create: participantIds.map((userId) => ({
            userId,
            participantRole: userId === input.actor.id ? 'OWNER' : 'MEMBER',
          })),
        },
      },
      include: {
        participants: true,
      },
    });

    let message = null;
    if (input.body?.trim()) {
      message = await prisma.inboxMessage.create({
        data: {
          threadId: thread.id,
          senderId: input.actor.id,
          body: input.body.trim(),
          messageType: input.messageType ?? 'TEXT',
          attachmentUrl: input.attachmentUrl,
          emailCopySent: Boolean(input.sendEmailCopy),
        },
      });

      await prisma.inboxThread.update({ where: { id: thread.id }, data: { updatedAt: new Date() } });
    }

    const notifyIds = participantIds.filter((id) => id !== input.actor.id);
    if (notifyIds.length) {
      await notifyParticipants(
        notifyIds,
        `New thread: ${input.subject}`,
        `${input.actor.email} created a ${input.category.toLowerCase()} thread.`,
      );
    }

    if (input.sendEmailCopy && notifyIds.length) {
      const recipients = await prisma.user.findMany({
        where: { id: { in: notifyIds } },
        select: { email: true },
      });

      if (recipients.length) {
        await prisma.emailLog.createMany({
          data: recipients.map((recipient) => ({
            recipientEmail: recipient.email,
            senderId: input.actor.id,
            subject: input.subject,
            body: input.body ?? null,
            status: 'PENDING',
          })),
        });
      }
    }

    await prisma.communicationAuditLog.create({
      data: {
        actorUserId: input.actor.id,
        action: 'INBOX_THREAD_CREATED',
        metadataJson: {
          threadId: thread.id,
          category: input.category,
          participantCount: participantIds.length,
        },
      },
    });

    return { thread, message };
  }

  async listInbox(user: AuthLikeUser, folder: 'inbox' | 'drafts' | 'spam' | 'deleted' | 'sent' | 'starred' = 'inbox') {
    const admin = isAdmin(user.roles);
    const spamCategories: InboxMessageCategory[] = ['SYSTEM_ALERT', 'BROADCAST'];
    const inboxCategories: InboxMessageCategory[] = [
      'USER_MESSAGE',
      'SUPPORT_TICKET',
      'STUDY_REQUEST',
      'DATASET_REQUEST',
      'APPROVAL_REQUEST',
      'SYSTEM_ALERT',
    ];
    const starredThreadIds = await this.resolveStarredThreadIds(user.id);
    const starredFilter = folder === 'starred' ? { id: { in: Array.from(starredThreadIds) } } : {};

    if (folder === 'starred' && starredThreadIds.size === 0) {
      return [];
    }

    const mapItem = (item: {
      id: string;
      subject: string;
      category: InboxMessageCategory;
      status: 'OPEN' | 'CLOSED' | 'ARCHIVED';
      assetType: string | null;
      updatedAt: Date;
      createdBy?: { firstname: string | null; surname: string | null; email: string };
    }) => ({
      id: item.id,
      subject: item.subject,
      category: item.category,
      status: item.status,
      assetType: item.assetType,
      updatedAt: item.updatedAt,
      createdByName: item.createdBy ? `${item.createdBy.firstname ?? ''} ${item.createdBy.surname ?? ''}`.trim() || item.createdBy.email : undefined,
      isStarred: starredThreadIds.has(item.id),
    });

    if (admin) {
      const whereByFolder =
        folder === 'drafts'
          ? {
              createdById: user.id,
              status: { not: 'ARCHIVED' as const },
              messages: { none: {} },
            }
          : folder === 'sent'
            ? {
                createdById: user.id,
                status: { not: 'ARCHIVED' as const },
                messages: {
                  some: {
                    senderId: user.id,
                  },
                },
              }
          : folder === 'deleted'
            ? {
                status: 'ARCHIVED' as const,
              }
            : folder === 'spam'
              ? {
                  category: { in: spamCategories },
                  status: { not: 'ARCHIVED' as const },
                }
              : {
                  category: { in: inboxCategories },
                  status: { not: 'ARCHIVED' as const },
                };

      const items = await prisma.inboxThread.findMany({
        where: {
          ...whereByFolder,
          ...starredFilter,
        },
        orderBy: { updatedAt: 'desc' },
        include: {
          createdBy: { select: { firstname: true, surname: true, email: true } },
        },
      });

      return items.map(mapItem);
    }

    const whereByFolder =
      folder === 'drafts'
        ? {
            createdById: user.id,
            status: { not: 'ARCHIVED' as const },
            participants: {
              some: {
                userId: user.id,
              },
            },
            messages: { none: {} },
          }
        : folder === 'sent'
          ? {
              participants: {
                some: {
                  userId: user.id,
                },
              },
              status: { not: 'ARCHIVED' as const },
              messages: {
                some: {
                  senderId: user.id,
                },
              },
            }
        : folder === 'deleted'
          ? {
              participants: {
                some: {
                  userId: user.id,
                },
              },
              OR: [
                { status: 'ARCHIVED' as const },
                {
                  participants: {
                    some: {
                      userId: user.id,
                      isArchived: true,
                    },
                  },
                },
              ],
            }
          : folder === 'spam'
            ? {
                participants: {
                  some: {
                    userId: user.id,
                    isArchived: false,
                  },
                },
                status: { not: 'ARCHIVED' as const },
                category: { in: spamCategories },
              }
            : {
                participants: {
                  some: {
                    userId: user.id,
                    isArchived: false,
                  },
                },
                status: { not: 'ARCHIVED' as const },
                category: { notIn: spamCategories },
              };

    const items = await prisma.inboxThread.findMany({
      where: {
        ...whereByFolder,
        ...starredFilter,
      },
      orderBy: { updatedAt: 'desc' },
      include: {
        createdBy: { select: { firstname: true, surname: true, email: true } },
      },
    });

    return items.map(mapItem);
  }

  async listSent(userId: string) {
    const sent = await prisma.inboxMessage.findMany({
      where: { senderId: userId },
      orderBy: { createdAt: 'desc' },
      include: {
        thread: {
          select: {
            id: true,
            subject: true,
            category: true,
          },
        },
      },
      take: 200,
    });

    return sent.map((item) => ({
      id: item.id,
      threadId: item.threadId,
      threadSubject: item.thread.subject,
      threadCategory: item.thread.category,
      body: item.body,
      messageType: item.messageType,
      createdAt: item.createdAt,
    }));
  }

  async ensureThreadAccess(threadId: string, user: AuthLikeUser) {
    const thread = await prisma.inboxThread.findUnique({
      where: { id: threadId },
      include: {
        participants: {
          include: {
            user: { select: { id: true, firstname: true, surname: true, email: true } },
          },
        },
        messages: {
          orderBy: { createdAt: 'asc' },
          include: {
            sender: { select: { id: true, firstname: true, surname: true, email: true } },
          },
        },
      },
    });

    if (!thread) throw new HttpError(404, 'Thread not found');

    const allowed = isAdmin(user.roles) || thread.createdById === user.id || thread.participants.some((p) => p.userId === user.id);
    if (!allowed) throw new HttpError(403, 'Not authorized to access this thread');

    return thread;
  }

  async getThread(threadId: string, user: AuthLikeUser) {
    return this.ensureThreadAccess(threadId, user);
  }

  async reply(
    threadId: string,
    user: AuthLikeUser,
    input: { body: string; messageType?: InboxMessageType; attachmentUrl?: string; sendEmailCopy?: boolean },
  ) {
    const thread = await this.ensureThreadAccess(threadId, user);

    const message = await prisma.inboxMessage.create({
      data: {
        threadId,
        senderId: user.id,
        body: input.body,
        messageType: input.messageType ?? 'TEXT',
        attachmentUrl: input.attachmentUrl,
        emailCopySent: Boolean(input.sendEmailCopy),
      },
    });

    await prisma.inboxThread.update({ where: { id: threadId }, data: { updatedAt: new Date() } });

    const notifyIds = thread.participants.map((p) => p.userId).filter((id) => id !== user.id);
    if (notifyIds.length) {
      await notifyParticipants(
        notifyIds,
        `New reply: ${thread.subject}`,
        `${user.email} replied in ${thread.subject}.`,
      );
    }

    if (input.sendEmailCopy && notifyIds.length) {
      const recipients = await prisma.user.findMany({
        where: { id: { in: notifyIds } },
        select: { email: true },
      });

      if (recipients.length) {
        await prisma.emailLog.createMany({
          data: recipients.map((recipient) => ({
            recipientEmail: recipient.email,
            senderId: user.id,
            subject: `RE: ${thread.subject}`,
            body: input.body,
            status: 'PENDING',
          })),
        });
      }
    }

    await prisma.communicationAuditLog.create({
      data: {
        actorUserId: user.id,
        action: 'INBOX_THREAD_REPLIED',
        metadataJson: {
          threadId,
          messageId: message.id,
          messageType: message.messageType,
        },
      },
    });

    return message;
  }

  async broadcast(input: { actor: AuthLikeUser; subject: string; body: string; category?: InboxMessageCategory; sendEmailCopy?: boolean }) {
    const recentBroadcasts = await prisma.inboxThread.count({
      where: {
        createdById: input.actor.id,
        category: 'BROADCAST',
        createdAt: { gte: new Date(Date.now() - 10 * 60 * 1000) },
      },
    });

    if (recentBroadcasts >= 5) {
      throw new HttpError(429, 'Broadcast limit reached. Try again in a few minutes.');
    }

    const recipients = await prisma.user.findMany({
      where: {
        id: { not: input.actor.id },
      },
      select: { id: true },
    });

    if (recipients.length > 1000) {
      throw new HttpError(400, 'Broadcast audience exceeds policy limit (1000 recipients).');
    }

    return this.createThread({
      actor: input.actor,
      subject: input.subject,
      category: input.category ?? 'BROADCAST',
      body: input.body,
      messageType: 'ANNOUNCEMENT',
      participantIds: recipients.map((item) => item.id),
      sendEmailCopy: input.sendEmailCopy,
    });
  }

  async externalEmail(input: { senderId: string; recipientEmail: string; subject: string; body: string }) {
    return prisma.emailLog.create({
      data: {
        senderId: input.senderId,
        recipientEmail: input.recipientEmail,
        subject: input.subject,
        body: input.body,
        status: 'PENDING',
      },
    });
  }

  async markRead(threadId: string, userId: string) {
    await prisma.inboxParticipant.upsert({
      where: { threadId_userId: { threadId, userId } },
      update: { lastReadAt: new Date(), isArchived: false },
      create: {
        threadId,
        userId,
        participantRole: 'MEMBER',
        lastReadAt: new Date(),
      },
    });

    return { ok: true };
  }

  async setThreadStarred(threadId: string, user: AuthLikeUser, starred: boolean) {
    await this.ensureThreadAccess(threadId, user);

    await prisma.communicationAuditLog.create({
      data: {
        actorUserId: user.id,
        action: starred ? 'INBOX_THREAD_STARRED' : 'INBOX_THREAD_UNSTARRED',
        metadataJson: {
          threadId,
          starred,
        },
      },
    });

    return { ok: true, threadId, starred };
  }

  async archiveThread(threadId: string, user: AuthLikeUser) {
    const thread = await prisma.inboxThread.findUnique({
      where: { id: threadId },
      include: {
        participants: {
          where: { userId: user.id },
          select: { participantRole: true },
        },
      },
    });
    if (!thread) throw new HttpError(404, 'Thread not found');

    const isOwnerParticipant = thread.participants.some((participant) => participant.participantRole === 'OWNER');
    if (!isAdmin(user.roles) && thread.createdById !== user.id && !isOwnerParticipant) {
      throw new HttpError(403, 'Not authorized to archive this thread');
    }

    await prisma.inboxThread.update({
      where: { id: threadId },
      data: { status: 'ARCHIVED' },
    });

    await prisma.inboxParticipant.updateMany({
      where: { threadId },
      data: { isArchived: true },
    });

    await prisma.communicationAuditLog.create({
      data: {
        actorUserId: user.id,
        action: 'INBOX_THREAD_ARCHIVED',
        metadataJson: { threadId },
      },
    });

    return { ok: true };
  }
}

export const inboxService = new InboxService();

