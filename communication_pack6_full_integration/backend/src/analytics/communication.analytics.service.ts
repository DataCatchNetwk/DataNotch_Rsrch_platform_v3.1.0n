import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma.service';
@Injectable()
export class CommunicationAnalyticsService {
  constructor(private prisma: PrismaService) {}
  async summary() {
    const [threads, messages, meetings, tickets, notifications] = await Promise.all([
      this.prisma.communicationThread.count(), this.prisma.communicationMessage.count(), this.prisma.meeting.count(), this.prisma.supportTicket.count({ where:{ status:{ in:['OPEN','IN_PROGRESS','ESCALATED']}}}), this.prisma.notification.count({ where:{ readAt:null }})
    ]);
    return { threads, messages, meetings, openTickets: tickets, unreadNotifications: notifications };
  }
}
