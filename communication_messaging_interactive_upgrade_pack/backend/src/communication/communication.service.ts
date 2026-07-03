import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaClient, MessageBox, CommunicationMessageKind } from '@prisma/client';
import { CreateThreadDto, ForwardDto, ReplyDto } from './dto';
import { EmailService } from '../email/email.service';
import { CommunicationGateway } from '../websocket/communication.gateway';

@Injectable()
export class CommunicationService {
  constructor(
    private readonly prisma: PrismaClient,
    private readonly email: EmailService,
    private readonly gateway: CommunicationGateway,
  ) {}

  async listMessages(currentUserEmail: string, box = 'INBOX') {
    const participantBox = box.toUpperCase() as MessageBox;
    return this.prisma.threadParticipant.findMany({
      where: { email: currentUserEmail, box: participantBox },
      include: { thread: { include: { messages: { orderBy: { sentAt: 'desc' }, take: 1 } } } },
      orderBy: { thread: { updatedAt: 'desc' } },
    });
  }

  async getThread(currentUserEmail: string, threadId: string) {
    const participant = await this.prisma.threadParticipant.findUnique({ where: { threadId_email: { threadId, email: currentUserEmail } } });
    if (!participant) throw new NotFoundException('Thread not found for user');
    return this.prisma.communicationThread.findUnique({
      where: { id: threadId },
      include: { participants: true, messages: { include: { sender: true }, orderBy: { sentAt: 'asc' } }, audits: true },
    });
  }

  async createThread(currentUserId: string, currentUserEmail: string, dto: CreateThreadDto) {
    const sender = await this.prisma.user.findUnique({ where: { id: currentUserId } });
    if (!sender) throw new NotFoundException('Sender not found');
    const allEmails = Array.from(new Set([currentUserEmail, ...dto.toEmails, ...(dto.ccEmails || [])]));

    const thread = await this.prisma.communicationThread.create({
      data: {
        subject: dto.subject,
        preview: dto.body.slice(0, 120),
        createdById: currentUserId,
        assetType: dto.assetType,
        assetId: dto.assetId,
        assetName: dto.assetName,
        participants: {
          create: allEmails.map((email) => ({
            email,
            displayName: email,
            box: email === currentUserEmail ? MessageBox.SENT : MessageBox.INBOX,
            unreadCount: email === currentUserEmail ? 0 : 1,
          })),
        },
        messages: {
          create: { senderId: currentUserId, body: dto.body, toEmails: dto.toEmails, ccEmails: dto.ccEmails || [] },
        },
        audits: { create: { actorId: currentUserId, action: 'THREAD_CREATED', metadata: { toEmails: dto.toEmails } } },
      },
      include: { participants: true, messages: true },
    });

    await this.email.sendMail(dto.toEmails, dto.subject, `<p>${dto.body.replace(/\n/g, '<br/>')}</p>`);
    this.gateway.emitToUsers(dto.toEmails, 'message.created', thread);
    return thread;
  }

  async reply(currentUserId: string, currentUserEmail: string, threadId: string, dto: ReplyDto) {
    const thread = await this.prisma.communicationThread.findUnique({ where: { id: threadId }, include: { participants: true } });
    if (!thread) throw new NotFoundException('Thread not found');
    const toEmails = thread.participants.map(p => p.email).filter(email => email !== currentUserEmail);
    const kind = (dto.kind || 'MESSAGE') as CommunicationMessageKind;

    const message = await this.prisma.communicationMessage.create({
      data: { threadId, senderId: currentUserId, body: dto.body, kind, toEmails },
    });

    await this.prisma.communicationThread.update({ where: { id: threadId }, data: { preview: dto.body.slice(0, 120) } });
    await Promise.all(thread.participants.map(p => this.prisma.threadParticipant.update({
      where: { threadId_email: { threadId, email: p.email } },
      data: p.email === currentUserEmail ? { box: MessageBox.SENT } : { unreadCount: { increment: 1 }, box: MessageBox.INBOX },
    })));
    await this.prisma.communicationAudit.create({ data: { threadId, actorId: currentUserId, action: kind === 'INTERNAL_NOTE' ? 'INTERNAL_NOTE_ADDED' : 'REPLIED' } });
    this.gateway.emitToUsers(toEmails, 'message.created', message);
    return message;
  }

  async replyAll(currentUserId: string, currentUserEmail: string, threadId: string, dto: ReplyDto) {
    return this.reply(currentUserId, currentUserEmail, threadId, { ...dto, kind: 'MESSAGE' as any });
  }

  async forward(currentUserId: string, currentUserEmail: string, threadId: string, dto: ForwardDto) {
    const thread = await this.prisma.communicationThread.findUnique({ where: { id: threadId }, include: { participants: true, messages: { orderBy: { sentAt: 'asc' } } } });
    if (!thread) throw new NotFoundException('Thread not found');
    const transcript = thread.messages.map(m => `<p><b>${m.sentAt.toISOString()}</b><br/>${m.body.replace(/\n/g, '<br/>')}</p>`).join('<hr/>');
    const note = dto.note ? `<p>${dto.note.replace(/\n/g, '<br/>')}</p><hr/>` : '';
    await this.email.sendMail(dto.toEmail, `Fwd: ${thread.subject}`, `${note}${transcript}`);
    await this.prisma.communicationMessage.create({
      data: {
        threadId,
        senderId: currentUserId,
        body: dto.note || `Forwarded to ${dto.toEmail}`,
        kind: CommunicationMessageKind.FORWARD,
        toEmails: [dto.toEmail],
      },
    });
    await this.prisma.communicationThread.update({ where: { id: threadId }, data: { preview: (dto.note || `Forwarded to ${dto.toEmail}`).slice(0, 120) } });
    const senderParticipant = thread.participants.find((participant) => participant.email === currentUserEmail);
    if (senderParticipant) {
      await this.prisma.threadParticipant.update({
        where: { threadId_email: { threadId, email: currentUserEmail } },
        data: { box: MessageBox.SENT },
      });
    }
    await this.prisma.communicationAudit.create({ data: { threadId, actorId: currentUserId, action: 'FORWARDED', metadata: { toEmail: dto.toEmail } } });
    return { forwarded: true, toEmail: dto.toEmail };
  }

  async markRead(currentUserEmail: string, threadId: string) {
    return this.prisma.threadParticipant.update({ where: { threadId_email: { threadId, email: currentUserEmail } }, data: { unreadCount: 0, lastReadAt: new Date() } });
  }

  async star(currentUserEmail: string, threadId: string) {
    const p = await this.prisma.threadParticipant.findUnique({ where: { threadId_email: { threadId, email: currentUserEmail } } });
    if (!p) throw new NotFoundException('Thread not found');
    return this.prisma.threadParticipant.update({ where: { threadId_email: { threadId, email: currentUserEmail } }, data: { starred: !p.starred, box: !p.starred ? MessageBox.STARRED : MessageBox.INBOX } });
  }

  async archive(currentUserEmail: string, threadId: string) {
    return this.prisma.threadParticipant.update({ where: { threadId_email: { threadId, email: currentUserEmail } }, data: { box: MessageBox.ARCHIVED, archived: true } });
  }

  async trash(currentUserEmail: string, threadId: string) {
    return this.prisma.threadParticipant.update({ where: { threadId_email: { threadId, email: currentUserEmail } }, data: { box: MessageBox.TRASH } });
  }
}
