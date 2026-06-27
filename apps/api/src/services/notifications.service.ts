import type { Notification, NotificationSeverity, NotificationType } from '@prisma/client';
import { prisma } from '../db/prisma.js';
import { HttpError } from '../utils/errors.js';
import { emitToUser } from '../realtime/notifications.gateway.js';

type CreateNotificationInput = {
  userId: string;
  workspaceId?: string;
  type: NotificationType;
  title: string;
  description: string;
  severity?: NotificationSeverity;
  link?: string;
};

function serializeNotification(notification: Notification) {
  return {
    id: notification.id,
    userId: notification.userId,
    workspaceId: notification.workspaceId,
    type: notification.type.toLowerCase(),
    title: notification.title,
    description: notification.description,
    severity: notification.severity.toLowerCase(),
    isRead: notification.isRead,
    readAt: notification.readAt,
    link: notification.link,
    createdAt: notification.createdAt,
  };
}

export async function createNotification(data: CreateNotificationInput) {
  const notification = await prisma.notification.create({
    data,
  });

  emitToUser(data.userId, 'notification', serializeNotification(notification));

  const unreadCount = await prisma.notification.count({
    where: {
      userId: data.userId,
      isRead: false,
    },
  });

  emitToUser(data.userId, 'notification:unread-count', { count: unreadCount });

  return serializeNotification(notification);
}

export async function notifyWorkspaceMembers(
  workspaceId: string,
  data: Omit<CreateNotificationInput, 'userId' | 'workspaceId'>,
) {
  const memberships = await prisma.workspaceMember.findMany({
    where: {
      workspaceId,
      isActive: true,
    },
    select: {
      userId: true,
    },
  });

  await Promise.all(
    memberships.map((membership) =>
      createNotification({
        ...data,
        userId: membership.userId,
        workspaceId,
      }),
    ),
  );
}

export async function getMyNotifications(userId: string) {
  const notifications = await prisma.notification.findMany({
    where: { userId },
    orderBy: { createdAt: 'desc' },
    take: 100,
  });

  return notifications.map(serializeNotification);
}

export async function getUnreadCount(userId: string) {
  const count = await prisma.notification.count({
    where: {
      userId,
      isRead: false,
    },
  });

  return { count };
}

export async function markAsRead(userId: string, notificationId: string) {
  const existing = await prisma.notification.findFirst({
    where: {
      id: notificationId,
      userId,
    },
  });

  if (!existing) {
    throw new HttpError(404, 'Notification not found');
  }

  const notification = existing.isRead
    ? existing
    : await prisma.notification.update({
        where: { id: notificationId },
        data: {
          isRead: true,
          readAt: new Date(),
        },
      });

  const unreadCount = await getUnreadCount(userId);
  emitToUser(userId, 'notification:unread-count', unreadCount);

  return serializeNotification(notification);
}

export async function markAllAsRead(userId: string) {
  await prisma.notification.updateMany({
    where: {
      userId,
      isRead: false,
    },
    data: {
      isRead: true,
      readAt: new Date(),
    },
  });

  const unreadCount = await getUnreadCount(userId);
  emitToUser(userId, 'notification:unread-count', unreadCount);

  return unreadCount;
}