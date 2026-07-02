import { api } from '@/lib/api/client';

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
};

