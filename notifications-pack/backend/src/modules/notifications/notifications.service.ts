import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { NotificationsGateway } from './notifications.gateway';
import { ListNotificationsDto } from './dto/list-notifications.dto';
import { UpdateNotificationPreferencesDto } from './dto/update-preferences.dto';

interface CreateNotificationInput {
  userId: string;
  actorId?: string | null;
  title: string;
  message: string;
  category?:
    | 'SYSTEM'
    | 'DATASET'
    | 'WORKSPACE'
    | 'COLLABORATION'
    | 'REVIEW'
    | 'REQUEST'
    | 'ANALYSIS'
    | 'REPORT'
    | 'BILLING'
    | 'SECURITY';
  priority?: 'LOW' | 'NORMAL' | 'HIGH' | 'CRITICAL';
  actionLabel?: string | null;
  actionUrl?: string | null;
  entityType?: string | null;
  entityId?: string | null;
  icon?: string | null;
  metadata?: Record<string, unknown> | null;
}

@Injectable()
export class NotificationsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly gateway: NotificationsGateway,
  ) {}

  async listForUser(userId: string, query: ListNotificationsDto) {
    const take = Number(query.limit ?? 20);

    const items = await this.prisma.notification.findMany({
      where: {
        userId,
        ...(query.status ? { status: query.status } : {}),
        ...(query.category ? { category: query.category } : {}),
      },
      orderBy: [{ createdAt: 'desc' }, { id: 'desc' }],
      take: take + 1,
      ...(query.cursor
        ? {
            skip: 1,
            cursor: { id: query.cursor },
          }
        : {}),
      include: {
        actor: {
          select: {
            id: true,
            name: true,
            email: true,
            image: true,
          },
        },
      },
    });

    const hasNextPage = items.length > take;
    const sliced = hasNextPage ? items.slice(0, take) : items;

    return {
      items: sliced,
      nextCursor: hasNextPage ? sliced[sliced.length - 1]?.id ?? null : null,
      unreadCount: await this.prisma.notification.count({
        where: { userId, status: 'UNREAD' },
      }),
    };
  }

  async unreadCount(userId: string) {
    return {
      count: await this.prisma.notification.count({
        where: { userId, status: 'UNREAD' },
      }),
    };
  }

  async create(input: CreateNotificationInput) {
    const created = await this.prisma.notification.create({
      data: {
        userId: input.userId,
        actorId: input.actorId ?? null,
        title: input.title,
        message: input.message,
        category: input.category ?? 'SYSTEM',
        priority: input.priority ?? 'NORMAL',
        actionLabel: input.actionLabel ?? null,
        actionUrl: input.actionUrl ?? null,
        entityType: input.entityType ?? null,
        entityId: input.entityId ?? null,
        icon: input.icon ?? null,
        metadata: input.metadata ?? undefined,
        deliveries: {
          create: {
            channel: 'IN_APP',
            deliveredAt: new Date(),
          },
        },
      },
      include: {
        actor: {
          select: {
            id: true,
            name: true,
            email: true,
            image: true,
          },
        },
      },
    });

    const unread = await this.prisma.notification.count({
      where: { userId: input.userId, status: 'UNREAD' },
    });

    this.gateway.emitCreated(input.userId, created);
    this.gateway.emitUnreadCount(input.userId, unread);

    return created;
  }

  async markRead(userId: string, notificationId: string) {
    const found = await this.prisma.notification.findFirst({
      where: { id: notificationId, userId },
    });

    if (!found) throw new NotFoundException('Notification not found');

    const updated = await this.prisma.notification.update({
      where: { id: notificationId },
      data: {
        status: 'READ',
        readAt: found.readAt ?? new Date(),
      },
    });

    const unread = await this.prisma.notification.count({
      where: { userId, status: 'UNREAD' },
    });

    this.gateway.emitRead(userId, { id: notificationId });
    this.gateway.emitUnreadCount(userId, unread);

    return updated;
  }

  async markAllRead(userId: string) {
    await this.prisma.notification.updateMany({
      where: { userId, status: 'UNREAD' },
      data: { status: 'READ', readAt: new Date() },
    });

    this.gateway.emitUnreadCount(userId, 0);

    return { success: true };
  }

  async archiveAllRead(userId: string) {
    await this.prisma.notification.updateMany({
      where: { userId, status: 'READ' },
      data: { status: 'ARCHIVED', archivedAt: new Date() },
    });

    return { success: true };
  }

  async delete(userId: string, notificationId: string) {
    const found = await this.prisma.notification.findFirst({
      where: { id: notificationId, userId },
    });

    if (!found) throw new NotFoundException('Notification not found');

    await this.prisma.notification.delete({ where: { id: notificationId } });

    const unread = await this.prisma.notification.count({
      where: { userId, status: 'UNREAD' },
    });

    this.gateway.emitDeleted(userId, { id: notificationId });
    this.gateway.emitUnreadCount(userId, unread);

    return { success: true };
  }

  async getPreferences(userId: string) {
    const pref = await this.prisma.notificationPreference.upsert({
      where: { userId },
      update: {},
      create: { userId },
    });

    return pref;
  }

  async updatePreferences(userId: string, dto: UpdateNotificationPreferencesDto) {
    return this.prisma.notificationPreference.upsert({
      where: { userId },
      update: dto,
      create: {
        userId,
        ...dto,
      },
    });
  }
}
