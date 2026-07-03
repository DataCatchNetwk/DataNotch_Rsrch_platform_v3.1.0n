import { Injectable, ForbiddenException, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { AuthUser, ScheduleMeetingDto } from './communication.types';
import { buildIcs } from './ics';
import { canDeleteMeeting, canManageMeeting, canStartMeeting } from './meeting-permissions';

@Injectable()
export class CommunicationService {
  constructor(private prisma: PrismaService) {}

  async overview() {
    const [live, upcoming, invites, logs] = await Promise.all([
      this.prisma.communicationMeeting.count({ where: { status: 'LIVE' } }),
      this.prisma.communicationMeeting.count({ where: { startsAt: { gte: new Date() }, status: { in: ['INVITED', 'ACCEPTED', 'READY'] } } }),
      this.prisma.communicationInvitation.count({ where: { status: 'SENT' } }),
      this.prisma.communicationActivityLog.findMany({ take: 10, orderBy: { createdAt: 'desc' } }),
    ]);
    return { live, upcoming, pendingInvitations: invites, recentActivity: logs };
  }

  async dashboard(mode: 'AUDIO' | 'VIDEO' | 'EMAIL') {
    const meetings = await this.prisma.communicationMeeting.findMany({
      where: { mode },
      include: { invitations: true },
      orderBy: { startsAt: 'asc' },
      take: 30,
    });
    return {
      mode,
      live: meetings.filter((m: any) => m.status === 'LIVE').length,
      upcoming: meetings.filter((m: any) => new Date(m.startsAt) > new Date()).length,
      meetings,
    };
  }

  async schedule(user: AuthUser, dto: ScheduleMeetingDto) {
    const meeting = await this.prisma.communicationMeeting.create({
      data: {
        title: dto.title,
        agenda: dto.agenda,
        mode: dto.mode,
        status: 'INVITED',
        createdById: user.id,
        startsAt: new Date(dto.startsAt),
        endsAt: dto.endsAt ? new Date(dto.endsAt) : undefined,
        autoOpen: dto.autoOpen ?? true,
        calendarSync: dto.calendarSync ?? true,
        roomName: dto.mode === 'VIDEO' ? `R-ZOOMA-${Date.now()}` : `R-MEET-${Date.now()}`,
        invitations: { create: dto.inviteeUserIds.map((userId) => ({ userId, status: 'SENT' })) },
        logs: { create: [{ actorId: user.id, action: 'CREATED', detail: { mode: dto.mode } }, { actorId: user.id, action: 'INVITED', detail: { invitees: dto.inviteeUserIds } }] },
      },
      include: { invitations: true },
    });
    // Emit websocket: communication.meeting.invited
    return meeting;
  }

  async accept(user: AuthUser, id: string) {
    await this.prisma.communicationInvitation.update({ where: { meetingId_userId: { meetingId: id, userId: user.id } }, data: { status: 'ACCEPTED', respondedAt: new Date() } });
    await this.prisma.communicationActivityLog.create({ data: { meetingId: id, actorId: user.id, action: 'ACCEPTED' } });
    await this.refreshReadyStatus(id);
    return { ok: true };
  }

  async decline(user: AuthUser, id: string) {
    await this.prisma.communicationInvitation.update({ where: { meetingId_userId: { meetingId: id, userId: user.id } }, data: { status: 'DECLINED', respondedAt: new Date() } });
    await this.prisma.communicationActivityLog.create({ data: { meetingId: id, actorId: user.id, action: 'DECLINED' } });
    return { ok: true };
  }

  async start(user: AuthUser, id: string) {
    const meeting = await this.prisma.communicationMeeting.findUnique({ where: { id }, include: { invitations: true } });
    if (!meeting) throw new NotFoundException();
    if (!canStartMeeting(user, meeting)) throw new ForbiddenException('Meeting can start only after acceptance and scheduled time.');
    const updated = await this.prisma.communicationMeeting.update({ where: { id }, data: { status: 'LIVE' } });
    await this.prisma.communicationActivityLog.create({ data: { meetingId: id, actorId: user.id, action: 'STARTED' } });
    // Emit websocket: communication.meeting.open_window for accepted participants
    return updated;
  }

  async pause(user: AuthUser, id: string) {
    const meeting = await this.getMeetingOrThrow(id);
    if (!canManageMeeting(user, meeting)) throw new ForbiddenException();
    return this.prisma.communicationMeeting.update({ where: { id }, data: { status: 'PAUSED' } });
  }

  async end(user: AuthUser, id: string) {
    const meeting = await this.getMeetingOrThrow(id);
    if (!canManageMeeting(user, meeting)) throw new ForbiddenException();
    await this.prisma.communicationActivityLog.create({ data: { meetingId: id, actorId: user.id, action: 'ENDED' } });
    return this.prisma.communicationMeeting.update({ where: { id }, data: { status: 'ENDED' } });
  }

  async delete(user: AuthUser, id: string) {
    const meeting = await this.getMeetingOrThrow(id);
    if (!canDeleteMeeting(user, meeting)) throw new ForbiddenException();
    await this.prisma.communicationActivityLog.create({ data: { meetingId: id, actorId: user.id, action: 'DELETED' } });
    return this.prisma.communicationMeeting.delete({ where: { id } });
  }

  async ics(user: AuthUser, id: string) {
    const meeting = await this.getMeetingOrThrow(id);
    await this.prisma.communicationActivityLog.create({ data: { meetingId: id, actorId: user.id, action: 'ICS_DOWNLOADED' } });
    return buildIcs(meeting as any);
  }

  private async refreshReadyStatus(id: string) {
    const accepted = await this.prisma.communicationInvitation.count({ where: { meetingId: id, status: 'ACCEPTED' } });
    if (accepted > 0) await this.prisma.communicationMeeting.update({ where: { id }, data: { status: 'READY' } });
  }

  private async getMeetingOrThrow(id: string) {
    const meeting = await this.prisma.communicationMeeting.findUnique({ where: { id }, include: { invitations: true } });
    if (!meeting) throw new NotFoundException();
    return meeting;
  }
}
