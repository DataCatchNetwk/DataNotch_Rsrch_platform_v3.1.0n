import { api } from '@/lib/api/client';

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


