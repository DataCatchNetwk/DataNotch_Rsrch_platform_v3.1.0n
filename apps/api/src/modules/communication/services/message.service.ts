import { prisma } from '../../../db/prisma.js';
import type { MessageKind } from '../communication.types.js';

export class MessageService {
  async getOrCreateDefaultThread(roomId: string, userId: string) {
    const existing = await prisma.communicationMessageThread.findFirst({
      where: { roomId },
      orderBy: { createdAt: 'asc' },
    });
    if (existing) return existing;

    return prisma.communicationMessageThread.create({
      data: {
        roomId,
        subject: 'General',
        createdById: userId,
      },
    });
  }

  async listMessages(roomId: string, limit = 200) {
    return prisma.communicationMessage.findMany({
      where: { roomId },
      orderBy: { sentAt: 'asc' },
      take: Math.min(limit, 1000),
      select: {
        id: true,
        threadId: true,
        roomId: true,
        senderId: true,
        senderName: true,
        body: true,
        kind: true,
        attachmentUrl: true,
        sentAt: true,
      },
    });
  }

  async countMessages() {
    return prisma.communicationMessage.count();
  }

  async sendMessage(input: {
    roomId: string;
    senderId: string;
    senderName: string;
    body: string;
    kind?: MessageKind;
    attachmentUrl?: string;
  }) {
    const thread = await this.getOrCreateDefaultThread(input.roomId, input.senderId);

    const message = await prisma.communicationMessage.create({
      data: {
        threadId: thread.id,
        roomId: input.roomId,
        senderId: input.senderId,
        senderName: input.senderName,
        body: input.body,
        kind: input.kind ?? 'TEXT',
        attachmentUrl: input.attachmentUrl,
      },
    });

    await prisma.communicationMessageThread.update({
      where: { id: thread.id },
      data: { updatedAt: new Date() },
    });

    return {
      id: message.id,
      roomId: message.roomId,
      threadId: thread.id,
      senderId: message.senderId,
      senderName: message.senderName,
      body: message.body,
      kind: message.kind,
      attachmentUrl: message.attachmentUrl,
      sentAt: message.sentAt.toISOString(),
    };
  }
}

export const messageService = new MessageService();
