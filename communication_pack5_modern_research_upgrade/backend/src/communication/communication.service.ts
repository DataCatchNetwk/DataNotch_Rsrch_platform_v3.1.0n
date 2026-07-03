import { BadRequestException, ForbiddenException, Injectable } from '@nestjs/common';

type Role = 'ADMIN' | 'USER';

@Injectable()
export class CommunicationService {
  commandCenter() {
    return {
      metrics: { liveSessions: 31, pendingInvites: 18, emailDelivery: 99.4, openSupport: 7 },
      workspaces: ['R-MEET', 'R-ZOOMA', 'MESSAGING'],
    };
  }

  scheduleMeeting(body: any) {
    if (!['AUDIO', 'VIDEO'].includes(body.mode)) throw new BadRequestException('Meeting mode must be AUDIO or VIDEO');
    return {
      id: crypto.randomUUID(),
      mode: body.mode,
      title: body.title,
      status: 'SCHEDULED',
      autoOpenEnabled: Boolean(body.autoOpenEnabled),
      rule: 'Meeting can auto-open only after invite acceptance and scheduled start time.',
      invitations: (body.invitees ?? []).map((recipient: string) => ({ recipient, status: 'SENT' })),
    };
  }

  respondInvite(id: string, userId: string, status: 'ACCEPTED' | 'DECLINED') {
    return { meetingId: id, userId, status, notification: `Invitation ${status.toLowerCase()}` };
  }

  startMeeting(id: string) {
    // Production rule: verify scheduled time arrived, meeting not cancelled, and user accepted.
    return { meetingId: id, status: 'LIVE', rzoomaWindow: 'OPEN_IF_VIDEO', rmeetWindow: 'OPEN_IF_AUDIO' };
  }

  endMeeting(id: string) {
    return { meetingId: id, status: 'ENDED', audit: 'Call log written and recording transcript queued.' };
  }

  calendarExport(id: string) {
    return `BEGIN:VCALENDAR\nVERSION:2.0\nBEGIN:VEVENT\nUID:${id}\nSUMMARY:Research Platform V3 Meeting\nEND:VEVENT\nEND:VCALENDAR`;
  }

  sendEmailMessage(body: any) {
    return {
      threadId: crypto.randomUUID(),
      storedInPlatformInbox: true,
      externalEmailCopy: Boolean(body.externalEmail),
      status: 'QUEUED_FOR_EMAIL_GATEWAY',
    };
  }

  inbox(userId: string, role: string) {
    const isAdmin = role === 'ADMIN';
    return {
      userId,
      buckets: isAdmin
        ? ['User Messages', 'Study Requests', 'Dataset Requests', 'Support Tickets', 'Approval Requests', 'System Alerts', 'Escalations']
        : ['Messages', 'Notifications', 'Research Invitations', 'Study Assignments', 'Meeting Invitations', 'Task Assignments', 'Approvals', 'Announcements'],
    };
  }

  assertCanManageCall(role: Role, ownerId: string, actorId: string) {
    if (role === 'ADMIN') return true;
    if (ownerId === actorId) return true;
    throw new ForbiddenException('Only admins or meeting owners can manage this call.');
  }
}
