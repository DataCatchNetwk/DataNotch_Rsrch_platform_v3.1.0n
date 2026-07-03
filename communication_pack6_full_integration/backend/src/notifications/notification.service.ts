import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma.service';
import { CommunicationGateway } from '../websocket/communication.gateway';

@Injectable()
export class NotificationService {
  constructor(private prisma: PrismaService, private gateway: CommunicationGateway) {}
  async create(userId: string, type: any, title: string, body: string, entityType?: string, entityId?: string) {
    const notification = await this.prisma.notification.create({ data: { userId, type, title, body, entityType, entityId }});
    this.gateway.emitToUser(userId, 'notification.created', notification);
    return notification;
  }
  async unread(userId: string) {
    return this.prisma.notification.findMany({ where: { userId, readAt: null }, orderBy: { createdAt: 'desc' }});
  }
}
