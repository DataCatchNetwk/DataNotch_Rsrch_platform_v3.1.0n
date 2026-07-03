import { PrismaClient, InvitationStatus, MeetingStatus, ActivityAction } from '@prisma/client';
import { canDeleteLogs, canManageMeeting, canPauseMeeting, Role } from '../utils/rbac';

const prisma = new PrismaClient();

export const meetingService = {
  async createMeeting(input: any, actor: { id: string; role: Role }) {
    const meeting = await prisma.meeting.create({
      data: {
        title: input.title,
        description: input.description,
        agenda: input.agenda,
        type: input.type,
        assetType: input.assetType || 'NONE',
        assetId: input.assetId,
        assetTitle: input.assetTitle,
        startsAt: new Date(input.startsAt),
        endsAt: new Date(input.endsAt),
        autoOpenWindow: input.autoOpenWindow ?? true,
        createdById: actor.id,
        roomUrl: input.roomUrl,
        invitations: {
          create: (input.inviteeIds || []).map((userId: string) => ({ userId, status: InvitationStatus.SENT }))
        },
        activities: {
          create: [{ actorId: actor.id, action: ActivityAction.CREATED, message: 'Meeting scheduled' }]
        }
      },
      include: { invitations: { include: { user: true } }, activities: true }
    });

    await prisma.meetingNotification.createMany({
      data: (input.inviteeIds || []).map((recipientId: string) => ({
        meetingId: meeting.id,
        recipientId,
        title: `Meeting invitation: ${meeting.title}`,
        body: `You were invited to ${meeting.title}. Please accept or decline.`
      }))
    });

    return meeting;
  },

  async listMeetings(actor: { id: string; role: Role }) {
    const where = actor.role === 'ADMIN'
      ? {}
      : { OR: [{ createdById: actor.id }, { invitations: { some: { userId: actor.id } } }] };
    return prisma.meeting.findMany({
      where,
      orderBy: { startsAt: 'asc' },
      include: { invitations: { include: { user: true } }, activities: { orderBy: { createdAt: 'desc' }, take: 8 } }
    });
  },

  async respond(meetingId: string, invitationId: string, response: 'ACCEPTED' | 'DECLINED', actor: { id: string }) {
    const invite = await prisma.meetingInvitation.findUniqueOrThrow({ where: { id: invitationId } });
    if (invite.userId !== actor.id) throw new Error('You can only respond to your own invitation.');

    const updated = await prisma.meetingInvitation.update({
      where: { id: invitationId },
      data: { status: response, respondedAt: new Date() }
    });

    await prisma.meetingActivity.create({
      data: {
        meetingId,
        actorId: actor.id,
        action: response === 'ACCEPTED' ? ActivityAction.ACCEPTED : ActivityAction.DECLINED,
        message: response === 'ACCEPTED' ? 'Invitation accepted' : 'Invitation declined'
      }
    });

    const acceptedCount = await prisma.meetingInvitation.count({ where: { meetingId, status: 'ACCEPTED' } });
    if (acceptedCount > 0) {
      await prisma.meeting.update({ where: { id: meetingId }, data: { status: MeetingStatus.READY } });
    }
    return updated;
  },

  async start(meetingId: string, actor: { id: string; role: Role }) {
    const meeting = await prisma.meeting.findUniqueOrThrow({ where: { id: meetingId }, include: { invitations: true } });
    const isOwner = meeting.createdById === actor.id;
    const accepted = meeting.invitations.some(i => i.status === 'ACCEPTED');
    const due = new Date(meeting.startsAt).getTime() <= Date.now();
    if (!accepted) throw new Error('Meeting cannot start until at least one invitee accepts.');
    if (!due) throw new Error('Meeting cannot auto-start before scheduled time.');
    if (!canManageMeeting(actor.role, isOwner)) throw new Error('Not permitted.');

    return prisma.meeting.update({
      where: { id: meetingId },
      data: {
        status: MeetingStatus.LIVE,
        activities: { create: [{ actorId: actor.id, action: ActivityAction.STARTED, message: 'Meeting started' }] }
      }
    });
  },

  async cancel(meetingId: string, actor: { id: string; role: Role }) {
    const meeting = await prisma.meeting.findUniqueOrThrow({ where: { id: meetingId } });
    if (!canManageMeeting(actor.role, meeting.createdById === actor.id)) throw new Error('Not permitted.');
    return prisma.meeting.update({
      where: { id: meetingId },
      data: { status: MeetingStatus.CANCELLED, activities: { create: [{ actorId: actor.id, action: ActivityAction.CANCELLED, message: 'Meeting cancelled' }] } }
    });
  },

  async pause(meetingId: string, actor: { id: string; role: Role }) {
    const meeting = await prisma.meeting.findUniqueOrThrow({ where: { id: meetingId } });
    if (!canPauseMeeting(actor.role, meeting.createdById === actor.id)) throw new Error('Not permitted.');
    return prisma.meeting.update({
      where: { id: meetingId },
      data: { status: MeetingStatus.PAUSED, activities: { create: [{ actorId: actor.id, action: ActivityAction.PAUSED, message: 'Meeting paused' }] } }
    });
  },

  async deleteLog(logId: string, actor: { role: Role }) {
    if (!canDeleteLogs(actor.role)) throw new Error('Only admins can delete meeting logs.');
    return prisma.meetingActivity.delete({ where: { id: logId } });
  },

  async ics(meetingId: string) {
    const m = await prisma.meeting.findUniqueOrThrow({ where: { id: meetingId } });
    const dt = (d: Date) => new Date(d).toISOString().replace(/[-:]/g, '').replace(/\.\d{3}Z$/, 'Z');
    return `BEGIN:VCALENDAR\nVERSION:2.0\nPRODID:-//ResearchPlatform//R-ZOOMA//EN\nBEGIN:VEVENT\nUID:${m.calendarUid}\nSUMMARY:${m.title}\nDESCRIPTION:${m.description || ''}\nDTSTART:${dt(m.startsAt)}\nDTEND:${dt(m.endsAt)}\nURL:${m.roomUrl || ''}\nEND:VEVENT\nEND:VCALENDAR`;
  }
};
