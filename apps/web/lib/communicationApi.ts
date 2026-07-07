import { api } from '@/lib/api/client';

import { apiPathUrl } from '@/lib/api-base';

export type CommunicationRole = 'ADMIN' | 'USER';

export type CommunicationThread = {
  id: string;
  subject: string;
  assetType?: 'PROJECT' | 'STUDY' | 'DATASET' | 'ANALYSIS' | 'PUBLICATION' | null;
  assetId?: string | null;
  latestMessage?: { id: string; body: string; createdAt: string } | null;
  messages?: Array<{ id: string; body: string; createdAt: string; senderId?: string | null }>;
  participants?: Array<{ userId: string; role?: string; user?: { id: string; fullName: string; email?: string | null } }>;
  unreadCount?: number;
};

export type CommunicationMeetingKind = 'RMEET_AUDIO' | 'RZOOMA_VIDEO';

export type CommunicationMeetingInvite = {
  meetingId: string;
  userId: string;
  status: 'SENT' | 'ACCEPTED' | 'DECLINED';
  respondedAt?: string | null;
};

export type CommunicationMeeting = {
  id: string;
  title: string;
  kind: CommunicationMeetingKind;
  createdById: string;
  startTime: string;
  endTime: string;
  agenda?: string | null;
  roomSlug?: string | null;
  status?: string;
  invitations?: CommunicationMeetingInvite[];
  participantCount?: number;
};

export type CommunicationInboxResponse = {
  userId: string;
  role: CommunicationRole;
  buckets?: string[];
  threads: CommunicationThread[];
  unreadCount?: number;
  notifications?: Array<{ id: string; title: string; body: string; createdAt: string }>;
};

export type RegisteredUser = {
  id: string;
  fullName: string;
  email: string;
  phone?: string | null;
  role: string | { id?: string; name?: string; description?: string } | null;
  status: string;
};

export type CommunicationRoom = {
  id: string;
  name: string;
  mode: 'AUDIO' | 'VIDEO' | 'EMAIL';
  status: 'ACTIVE' | 'ENDED' | 'FAILED';
  targetUserId?: string | null;
  startedAt: string;
  endedAt?: string | null;
};

export type CommunicationStats = {
  activeCalls: number;
  activeVideoRooms: number;
  onlineUsers: number;
  unreadMessages: number;
  failedAttempts: number;
  flaggedSessions: number;
};

export const communicationApi = {
  async inbox(userId: string): Promise<CommunicationInboxResponse> {
    const { data } = await api.get('/communication/inbox', { params: { userId } });
    return data as CommunicationInboxResponse;
  },

  async createThread(payload: {
    subject: string;
    createdById?: string;
    participantIds: string[];
    body: string;
    assetType?: CommunicationThread['assetType'];
    assetId?: string;
    emailCopy?: boolean;
  }): Promise<CommunicationThread> {
    const { data } = await api.post('/communication/threads', payload);
    return data as CommunicationThread;
  },

  async reply(threadId: string, payload: { senderId?: string; body: string; emailCopy?: boolean }): Promise<CommunicationThread> {
    const { data } = await api.post(`/communication/threads/${threadId}/reply`, payload);
    return data as CommunicationThread;
  },

  async assetThreads(assetType: NonNullable<CommunicationThread['assetType']>, assetId: string): Promise<CommunicationThread[]> {
    const { data } = await api.get(`/communication/assets/${assetType}/${assetId}/threads`);
    return data as CommunicationThread[];
  },

  async scheduleMeeting(payload: {
    title: string;
    kind: CommunicationMeetingKind;
    createdById?: string;
    startTime: string;
    endTime: string;
    inviteeIds: string[];
    agenda?: string;
  }): Promise<CommunicationMeeting> {
    const { data } = await api.post('/meetings/schedule', payload);
    return data as CommunicationMeeting;
  },

  async respondInvite(meetingId: string, payload: { userId?: string; status: 'ACCEPTED' | 'DECLINED' }): Promise<CommunicationMeetingInvite> {
    const { data } = await api.post(`/meetings/${meetingId}/respond`, payload);
    return data as CommunicationMeetingInvite;
  },

  async startMeeting(meetingId: string, actor?: unknown): Promise<CommunicationMeeting> {
    const { data } = await api.post(`/meetings/${meetingId}/start`, { actor });
    return data as CommunicationMeeting;
  },

  async manageMeeting(meetingId: string, action: string, actor?: unknown): Promise<CommunicationMeeting> {
    const { data } = await api.post(`/meetings/${meetingId}/manage`, { action, actor });
    return data as CommunicationMeeting;
  },

  async users(query = ''): Promise<RegisteredUser[]> {
    const { data } = await api.get('/v1/admin/communication/users', { params: { q: query } });
    return data as RegisteredUser[];
  },

  async rooms(): Promise<CommunicationRoom[]> {
    const { data } = await api.get('/v1/admin/communication/rooms');
    return data as CommunicationRoom[];
  },

  async stats(): Promise<CommunicationStats> {
    const { data } = await api.get('/v1/admin/communication/stats');
    return data as CommunicationStats;
  },

  async startAudio(payload: { userId: string; contactMethod: 'PHONE' | 'EMAIL' }): Promise<CommunicationRoom> {
    const { data } = await api.post('/v1/admin/communication/audio/start', payload);
    return data as CommunicationRoom;
  },

  async inviteVideo(payload: { userId: string; topic?: string }): Promise<CommunicationRoom> {
    const { data } = await api.post('/v1/admin/communication/video/invite', payload);
    return data as CommunicationRoom;
  },

  async sendEmailMessage(payload: { userId: string; subject: string; body: string }): Promise<{ ok: boolean; eventId: string }> {
    const { data } = await api.post('/v1/admin/communication/messages/email', payload);
    return data as { ok: boolean; eventId: string };
  },

  async endRoom(roomId: string): Promise<CommunicationRoom> {
    const { data } = await api.post(`/v1/admin/communication/rooms/${roomId}/end`);
    return data as CommunicationRoom;
  },

  meetingCalendarUrl(meetingId: string): string {
    return apiPathUrl(`/v1/communication/meetings/${meetingId}/calendar.ics`);
  },
};
