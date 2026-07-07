import { api } from '@/lib/api/client';
import { apiPathUrl } from '@/lib/api-base';

export type CommunicationRoom = {
  id: string;
  name: string;
  type: 'DIRECT' | 'GROUP' | 'CHANNEL' | 'CALL_ROOM';
  visibility: 'PRIVATE' | 'WORKSPACE' | 'ORG';
  createdById: string;
  createdAt: string;
  updatedAt: string;
};

export type CommunicationRoomState = {
  room: CommunicationRoom;
  participants: Array<{
    id: string;
    roomId: string;
    userId: string;
    role: 'OWNER' | 'MODERATOR' | 'MEMBER';
    joinedAt: string;
    muted: boolean;
    cameraEnabled: boolean;
    micEnabled: boolean;
    isOnline: boolean;
  }>;
  messages: Array<{
    id: string;
    roomId: string;
    senderId: string;
    senderName: string;
    body: string;
    sentAt: string;
  }>;
  activeCalls: Array<{
    id: string;
    roomId: string;
    mode: 'AUDIO' | 'VIDEO';
    status: 'WAITING' | 'ACTIVE' | 'ENDED' | 'FAILED';
    startedAt: string;
  }>;
};

export async function listCommunicationRooms() {
  const { data } = await api.get('/v1/communication/rooms');
  return (data?.items ?? []) as CommunicationRoom[];
}

export async function createCommunicationRoom(payload: {
  name: string;
  type: CommunicationRoom['type'];
  visibility?: CommunicationRoom['visibility'];
  workspaceId?: string;
}) {
  const { data } = await api.post('/v1/communication/rooms', payload);
  return data as CommunicationRoom;
}

export async function getCommunicationRoomState(roomId: string) {
  const { data } = await api.get(`/v1/communication/rooms/${roomId}`);
  return data as CommunicationRoomState;
}
export async function sendRoomMessage(roomId: string, body: string) {
  const { data } = await api.post(`/v1/communication/rooms/${roomId}/messages`, { body });
  return data as CommunicationRoomState['messages'][number];
}

export async function createSupportRoom(subject: string, body: string) {
  const room = await createCommunicationRoom({
    name: subject || 'User Support Conversation',
    type: 'CHANNEL',
    visibility: 'ORG',
  });
  if (body.trim()) {
    await sendRoomMessage(room.id, body.trim());
  }
  return room;
}

export async function startRoomCall(roomId: string, mode: 'AUDIO' | 'VIDEO') {
  const { data } = await api.post(`/v1/communication/rooms/${roomId}/call/start`, { mode });
  return data as { id: string; status: string; mode: 'AUDIO' | 'VIDEO' };
}

export async function endCall(callSessionId: string) {
  const { data } = await api.post(`/v1/communication/call-sessions/${callSessionId}/end`);
  return data as { id: string; status: string };
}

export type CommunicationToolbarAction = 'audio' | 'video' | 'participants' | 'chat' | 'react' | 'share' | 'host_tools' | 'more' | 'end';

export async function roomToolbarAction(roomId: string, payload: { action: CommunicationToolbarAction; state?: boolean; source?: string }) {
  const { data } = await api.post(`/v1/communication/rooms/${roomId}/toolbar-action`, payload);
  return data as {
    ok: boolean;
    action: CommunicationToolbarAction;
    state?: boolean;
    participantState?: { micEnabled?: boolean; muted?: boolean; cameraEnabled?: boolean };
    auditId: string;
  };
}

export async function getCommunicationMonitoring() {
  const { data } = await api.get('/v1/communication/monitoring');
  return data as {
    cards: {
      activeCalls: number;
      activeVideoRooms: number;
      onlineUsers: number;
      unreadMessages: number;
      failedConnectionAttempts: number;
      flaggedSessions: number;
    };
    tables: {
      ongoingAudioSessions: unknown[];
      ongoingVideoRooms: unknown[];
      messageQueueStatus: { queued: number; delivered: number };
      recentModerationActions: unknown[];
    };
  };
}
export type CommunicationAuditItem = {
  id: string;
  actorUserId?: string | null;
  roomId?: string | null;
  callSessionId?: string | null;
  action: string;
  metadataJson?: unknown;
  createdAt: string;
};

export async function getCommunicationAudit() {
  const { data } = await api.get('/v1/communication/audit');
  return (data?.items ?? []) as CommunicationAuditItem[];
}

export type InboxMessageCategory =
  | 'USER_MESSAGE'
  | 'ADMIN_MESSAGE'
  | 'STUDY_REQUEST'
  | 'DATASET_REQUEST'
  | 'REVIEW_REQUEST'
  | 'APPROVAL_REQUEST'
  | 'SUPPORT_TICKET'
  | 'MEETING_INVITATION'
  | 'SYSTEM_ALERT'
  | 'ANNOUNCEMENT'
  | 'BROADCAST';

export type InboxMessageType = 'TEXT' | 'MEETING_INVITATION' | 'ANNOUNCEMENT' | 'SUPPORT' | 'SYSTEM';

export type InboxThreadListItem = {
  id: string;
  subject: string;
  category: InboxMessageCategory;
  status: 'OPEN' | 'CLOSED' | 'ARCHIVED';
  assetType?: string | null;
  assetId?: string | null;
  updatedAt: string;
  createdByName?: string;
  unreadCount?: number;
  isStarred?: boolean;
};

export async function createMessageThread(payload: {
  subject: string;
  category: InboxMessageCategory;
  body?: string;
  messageType?: InboxMessageType;
  participantIds?: string[];
  recipientEmails?: string[];
  ccEmails?: string[];
  bccEmails?: string[];
  assetType?: string;
  assetId?: string;
  attachmentUrl?: string;
  sendEmailCopy?: boolean;
}) {
  const { data } = await api.post('/messages/thread', payload);
  return data as { thread: unknown; message: unknown };
}

export async function getMyInboxThreads(folder: 'inbox' | 'drafts' | 'spam' | 'deleted' | 'sent' | 'starred' = 'inbox') {
  const { data } = await api.get('/messages/inbox', { params: { folder } });
  return (data?.items ?? []) as InboxThreadListItem[];
}

export async function setMessageThreadStarred(threadId: string, starred: boolean) {
  const { data } = await api.patch(`/messages/thread/${threadId}/star`, { starred });
  return data as { ok: boolean; threadId: string; starred: boolean };
}

export async function getMySentMessages() {
  const { data } = await api.get('/messages/sent');
  return (data?.items ?? []) as Array<{
    id: string;
    threadId: string;
    threadSubject: string;
    threadCategory: InboxMessageCategory;
    body: string;
    messageType: InboxMessageType;
    createdAt: string;
  }>;
}

export async function getMessageThread(threadId: string) {
  const { data } = await api.get(`/messages/thread/${threadId}`);
  return data as {
    id: string;
    subject: string;
    category: InboxMessageCategory;
    status: 'OPEN' | 'CLOSED' | 'ARCHIVED';
    messages: Array<{
      id: string;
      body: string;
      messageType: InboxMessageType;
      createdAt: string;
      sender: { id: string; firstname: string; surname: string; email: string };
      attachmentUrl?: string | null;
    }>;
    participants: Array<{
      id: string;
      userId: string;
      participantRole: 'OWNER' | 'MEMBER';
      isArchived: boolean;
      user: { id: string; firstname: string; surname: string; email: string };
      lastReadAt?: string | null;
    }>;
  };
}

export async function replyMessageThread(threadId: string, payload: {
  body: string;
  messageType?: InboxMessageType;
  attachmentUrl?: string;
  sendEmailCopy?: boolean;
}) {
  const { data } = await api.post(`/messages/thread/${threadId}/reply`, payload);
  return data as { id: string };
}

export async function sendBroadcastMessage(payload: {
  subject: string;
  body: string;
  category?: InboxMessageCategory;
  sendEmailCopy?: boolean;
}) {
  const { data } = await api.post('/messages/broadcast', payload);
  return data as { thread: unknown; message: unknown };
}

export async function sendExternalEmail(payload: {
  recipientEmail: string;
  subject: string;
  body: string;
}) {
  const { data } = await api.post('/messages/external-email', payload);
  return data as { id: string; status: 'PENDING' | 'SENT' | 'FAILED' };
}

export async function markThreadRead(threadId: string) {
  const { data } = await api.patch(`/messages/thread/${threadId}/read`);
  return data as { ok: boolean };
}

export async function archiveMessageThread(threadId: string) {
  const { data } = await api.delete(`/messages/thread/${threadId}`);
  return data as { ok: boolean };
}

export async function getSupportTickets() {
  const { data } = await api.get('/support/tickets');
  return (data?.tickets ?? []) as Array<{
    id: string;
    subject: string;
    status: string;
    priority: string;
    category: string;
    createdAt?: string;
    updatedAt?: string;
  }>;
}

export async function getNotificationsList() {
  const { data } = await api.get('/notifications');
  return (data?.notifications ?? []) as Array<{
    id: string;
    title: string;
    description?: string;
    type?: string;
    severity?: string;
    createdAt: string;
    isRead?: boolean;
    link?: string;
  }>;
}

export type CommunicationMeetingStatus = 'SCHEDULED' | 'READY' | 'LIVE' | 'PAUSED' | 'CANCELLED' | 'ENDED';

export type CommunicationMeeting = {
  room: CommunicationRoom;
  metadata: {
    title: string;
    description?: string;
    agenda?: string;
    startsAt: string;
    endsAt?: string;
    assetType?: string;
    assetId?: string;
    assetTitle?: string;
    autoOpenWindow: boolean;
    roomUrl: string;
    status: CommunicationMeetingStatus;
    invitationStatuses: Record<string, 'SENT' | 'ACCEPTED' | 'DECLINED'>;
    createdById: string;
    updatedAt: string;
  };
  activeCall: null | {
    id: string;
    roomId: string;
    mode: 'AUDIO' | 'VIDEO';
    status: 'WAITING' | 'ACTIVE' | 'ENDED' | 'FAILED';
    startedAt: string;
  };
  participants: CommunicationRoomState['participants'];
  messages?: CommunicationRoomState['messages'];
  readyToOpen: boolean;
  logs: Array<CommunicationAuditItem>;
};

export async function listCommunicationMeetings() {
  const { data } = await api.get('/v1/communication/meetings');
  return (data?.items ?? []) as CommunicationMeeting[];
}

export async function scheduleCommunicationMeeting(payload: {
  title: string;
  description?: string;
  agenda?: string;
  startsAt: string;
  endsAt?: string;
  inviteeIds?: string[];
  workspaceId?: string;
  assetType?: string;
  assetId?: string;
  assetTitle?: string;
  autoOpenWindow?: boolean;
}) {
  const { data } = await api.post('/v1/communication/meetings', payload);
  return data as CommunicationMeeting;
}

export async function respondToCommunicationMeeting(roomId: string, response: 'ACCEPTED' | 'DECLINED') {
  const { data } = await api.post(`/v1/communication/meetings/${roomId}/respond`, { response });
  return data as CommunicationMeeting;
}

export async function startCommunicationMeeting(roomId: string) {
  const { data } = await api.post(`/v1/communication/meetings/${roomId}/start`);
  return data as CommunicationMeeting;
}

export async function pauseCommunicationMeeting(roomId: string) {
  const { data } = await api.post(`/v1/communication/meetings/${roomId}/pause`);
  return data as CommunicationMeeting;
}

export async function cancelCommunicationMeeting(roomId: string) {
  const { data } = await api.post(`/v1/communication/meetings/${roomId}/cancel`);
  return data as CommunicationMeeting;
}

export async function updateCommunicationMeeting(roomId: string, payload: {
  title?: string;
  description?: string;
  agenda?: string;
  startsAt?: string;
  endsAt?: string;
  inviteeIds?: string[];
  assetType?: string;
  assetId?: string;
  assetTitle?: string;
  autoOpenWindow?: boolean;
}) {
  const { data } = await api.patch(`/v1/communication/meetings/${roomId}`, payload);
  return data as CommunicationMeeting;
}

export async function deleteCommunicationMeeting(roomId: string) {
  const { data } = await api.delete(`/v1/communication/meetings/${roomId}`);
  return data as { ok: boolean };
}

export async function deleteCommunicationMeetingLog(roomId: string, logId: string) {
  const { data } = await api.delete(`/v1/communication/meetings/${roomId}/logs/${logId}`);
  return data as { ok: boolean };
}

export function meetingCalendarUrl(roomId: string) {
  return apiPathUrl(`/v1/communication/meetings/${roomId}/calendar.ics`);
}
