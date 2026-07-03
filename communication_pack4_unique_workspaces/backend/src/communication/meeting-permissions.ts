import { AuthUser } from './communication.types';

export function canManageMeeting(user: AuthUser, meeting: { createdById: string; status: string }) {
  if (user.role === 'ADMIN') return true;
  if (meeting.createdById === user.id && !['ENDED', 'CANCELLED'].includes(meeting.status)) return true;
  return false;
}

export function canDeleteMeeting(user: AuthUser, meeting: { createdById: string; status: string }) {
  return user.role === 'ADMIN' || (meeting.createdById === user.id && meeting.status === 'DRAFT');
}

export function canStartMeeting(user: AuthUser, meeting: any) {
  const isCreator = meeting.createdById === user.id;
  const accepted = meeting.invitations?.some((i: any) => i.userId === user.id && i.status === 'ACCEPTED');
  const ready = ['READY', 'ACCEPTED', 'PAUSED'].includes(meeting.status);
  const timeReached = new Date(meeting.startsAt).getTime() <= Date.now();
  return ready && timeReached && (user.role === 'ADMIN' || isCreator || accepted);
}
