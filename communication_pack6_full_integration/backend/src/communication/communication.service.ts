import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma.service';
import { NotificationService } from '../notifications/notification.service';
import { EmailService } from '../email/email.service';
import { CommunicationGateway } from '../websocket/communication.gateway';

@Injectable()
export class CommunicationService {
  constructor(private prisma: PrismaService, private notifications: NotificationService, private email: EmailService, private gateway: CommunicationGateway) {}

  async createThread(input: {subject:string; createdById:string; participantIds:string[]; body:string; assetType?:any; assetId?:string; emailCopy?:boolean; externalEmails?:string[]}) {
    const thread = await this.prisma.communicationThread.create({
      data: {
        subject: input.subject,
        createdById: input.createdById,
        assetType: input.assetType || 'GENERAL',
        assetId: input.assetId,
        participants: { create: [...new Set([input.createdById, ...input.participantIds])].map(userId => ({ userId })) },
        messages: { create: { senderId: input.createdById, body: input.body }}
      }, include: { messages: true, participants: true }
    });
    const firstMessage = thread.messages[0];
    for (const p of thread.participants) {
      if (p.userId !== input.createdById) await this.notifications.create(p.userId, 'MESSAGE', input.subject, input.body, 'thread', thread.id);
      this.gateway.emitToUser(p.userId, 'message.created', { threadId: thread.id, message: firstMessage });
    }
    if (input.emailCopy) {
      const users = await this.prisma.user.findMany({ where: { id: { in: input.participantIds }}});
      for (const u of users) await this.email.send(u.email, input.subject, `<p>${input.body}</p>`, firstMessage.id);
      for (const x of input.externalEmails || []) await this.email.send(x, input.subject, `<p>${input.body}</p>`, firstMessage.id);
    }
    return thread;
  }

  async reply(threadId: string, senderId: string, body: string, emailCopy = false) {
    const message = await this.prisma.communicationMessage.create({ data: { threadId, senderId, body }});
    const participants = await this.prisma.threadParticipant.findMany({ where: { threadId }, include: { user: true }});
    for (const p of participants) {
      if (p.userId !== senderId) await this.notifications.create(p.userId, 'MESSAGE', 'New reply', body, 'thread', threadId);
      this.gateway.emitToUser(p.userId, 'message.created', { threadId, message });
      if (emailCopy && p.userId !== senderId) await this.email.send(p.user.email, 'New platform message', `<p>${body}</p>`, message.id);
    }
    return message;
  }

  inbox(userId: string) {
    return this.prisma.communicationThread.findMany({ where: { participants: { some: { userId }}}, include: { messages: { orderBy: { createdAt: 'desc' }, take: 1 }, participants: { include: { user: true }}}, orderBy: { updatedAt: 'desc' }});
  }

  assetThreads(assetType: any, assetId: string) {
    return this.prisma.communicationThread.findMany({ where: { assetType, assetId }, include: { messages: true, participants: { include: { user: true }}}});
  }
}
