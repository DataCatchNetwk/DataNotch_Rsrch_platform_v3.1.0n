import { Injectable, ForbiddenException } from '@nestjs/common';
import { PrismaService } from '../prisma.service';
import { NotificationService } from '../notifications/notification.service';
import { EmailService } from '../email/email.service';
import { CommunicationGateway } from '../websocket/communication.gateway';
import ical from 'ical-generator';

@Injectable()
export class MeetingService {
  constructor(private prisma: PrismaService, private notifications: NotificationService, private email: EmailService, private gateway: CommunicationGateway) {}

  async schedule(input: {title:string; agenda?:string; kind:'RMEET_AUDIO'|'RZOOMA_VIDEO'; startTime:string; endTime:string; inviteeIds:string[]; createdById:string; assetType?:any; assetId?:string; externalEmails?:string[]}) {
    const roomSlug = `${input.kind.toLowerCase()}-${Date.now()}`;
    const meeting = await this.prisma.meeting.create({ data: {
      title: input.title, agenda: input.agenda, kind: input.kind, startTime: new Date(input.startTime), endTime: new Date(input.endTime), roomSlug,
      createdById: input.createdById, assetType: input.assetType || 'GENERAL', assetId: input.assetId,
      invitations: { create: input.inviteeIds.map(userId => ({ userId })) }
    }, include: { invitations: true }});
    const joinUrl = `${process.env.APP_BASE_URL}/communication/join/${meeting.roomSlug}`;
    for (const inv of meeting.invitations) {
      await this.notifications.create(inv.userId, 'INVITATION', `Meeting invitation: ${meeting.title}`, `Please accept or decline. Join: ${joinUrl}`, 'meeting', meeting.id);
      this.gateway.emitToUser(inv.userId, 'invitation.sent', { meeting, invitation: inv });
    }
    const users = await this.prisma.user.findMany({ where: { id: { in: input.inviteeIds }}});
    for (const u of users) await this.email.send(u.email, `Meeting invitation: ${meeting.title}`, `<p>${input.agenda || ''}</p><p><a href="${joinUrl}">Open meeting</a></p>`);
    for (const ext of input.externalEmails || []) await this.email.send(ext, `External meeting invitation: ${meeting.title}`, `<p>${input.agenda || ''}</p><p>${joinUrl}</p>`);
    return meeting;
  }

  async respond(meetingId: string, userId: string, status:'ACCEPTED'|'DECLINED') {
    const invitation = await this.prisma.meetingInvitation.update({ where: { meetingId_userId: { meetingId, userId }}, data: { status, respondedAt: new Date() }, include: { meeting: true }});
    await this.notifications.create(invitation.meeting.createdById, 'INVITATION', `Invitation ${status.toLowerCase()}`, `${userId} ${status.toLowerCase()} ${invitation.meeting.title}`, 'meeting', meetingId);
    this.gateway.emitAdmin(`invitation.${status.toLowerCase()}`, invitation);
    return invitation;
  }

  async start(meetingId: string, actor:any) {
    const meeting = await this.prisma.meeting.findUnique({ where: { id: meetingId }, include: { invitations: true }});
    if (!meeting) throw new Error('Meeting not found');
    const isCreator = meeting.createdById === actor.id;
    const accepted = meeting.invitations.some(i => i.userId === actor.id && i.status === 'ACCEPTED');
    if (!isCreator && !accepted) throw new ForbiddenException('Meeting can start only for creator or accepted invitees');
    const live = await this.prisma.meeting.update({ where: { id: meetingId }, data: { status: 'LIVE' }});
    await this.prisma.callLog.create({ data: { meetingId, action: 'MEETING_STARTED', actorId: actor.id }});
    this.gateway.server.emit('meeting.started', live);
    return live;
  }

  async manage(meetingId:string, actor:any, action:'PAUSE'|'END'|'CANCEL'|'DELETE_LOG') {
    const adminOnly = ['CANCEL','DELETE_LOG'];
    if (adminOnly.includes(action) && actor.role !== 'ADMIN') throw new ForbiddenException('Admin only');
    const statusMap:any = { PAUSE:'PAUSED', END:'ENDED', CANCEL:'CANCELLED' };
    const meeting = statusMap[action] ? await this.prisma.meeting.update({ where:{id:meetingId}, data:{status:statusMap[action]}}) : await this.prisma.meeting.findUnique({ where:{id:meetingId}});
    await this.prisma.callLog.create({ data: { meetingId, action, actorId: actor.id }});
    this.gateway.server.emit(`meeting.${action.toLowerCase()}`, meeting);
    return meeting;
  }

  async ics(meetingId:string) {
    const m = await this.prisma.meeting.findUnique({ where: { id: meetingId }});
    if (!m) throw new Error('Meeting not found');
    const cal = ical({ name: 'Research Platform V3 Calendar' });
    cal.createEvent({ start: m.startTime, end: m.endTime, summary: m.title, description: m.agenda || '', url: `${process.env.APP_BASE_URL}/communication/join/${m.roomSlug}` });
    return cal.toString();
  }
}
