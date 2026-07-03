import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma.service';
import { CommunicationService } from '../communication/communication.service';

@Injectable()
export class SupportService {
  constructor(private prisma: PrismaService, private comms: CommunicationService) {}
  async createTicket(input:{createdById:string; subject:string; category:string; body:string}) {
    const admins = await this.prisma.user.findMany({ where: { role: 'ADMIN' }});
    const thread = await this.comms.createThread({ subject: `Support Ticket — ${input.subject}`, createdById: input.createdById, participantIds: admins.map(a=>a.id), body: input.body, emailCopy: true });
    return this.prisma.supportTicket.create({ data: { subject: input.subject, category: input.category, createdById: input.createdById, threadId: thread.id }});
  }
}
