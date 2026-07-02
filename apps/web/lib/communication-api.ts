import {
  createCommunicationRoom,
  getCommunicationMonitoring,
  getCommunicationRoomState,
  listCommunicationRooms,
  type CommunicationRoom as LegacyCommunicationRoom,
  type CommunicationRoomState,
} from '@/lib/api/communication';
import { api } from '@/lib/api/client';
import { getSocket } from '@/lib/socket/client';

export type CommunicationMode = 'audio' | 'video' | 'messaging';

export type CommunicationRoom = {
  id: string;
  name: string;
  mode: CommunicationMode;
  type: 'CALL_ROOM' | 'VIDEO_ROOM' | 'MESSAGE_ROOM';
  status: 'ACTIVE' | 'IDLE' | 'CLOSED' | 'FLAGGED';
  workspaceId?: string | null;
  studyId?: string | null;
  createdAt: string;
  participantCount: number;
  unreadCount: number;
};

export type Participant = {
  id: string;
  displayName: string;
  role: 'ADMIN' | 'RESEARCHER' | 'ANALYST' | 'REVIEWER' | 'GUEST';
  status: 'ONLINE' | 'OFFLINE' | 'MUTED' | 'REMOVED';
  joinedAt: string;
};

export type ActivityEvent = {
  id: string;
  type: string;
  message: string;
  severity: 'INFO' | 'SUCCESS' | 'WARNING' | 'ERROR';
  createdAt: string;
};

export type CommunicationMetrics = {
  activeCalls: number;
  activeVideoRooms: number;
  activeMessageRooms: number;
  onlineUsers: number;
  unreadMessages: number;
  failedAttempts: number;
  flaggedSessions: number;
  activeRooms: number;
};

type MonitoringAction = {
  id: string;
  action: string;
  createdAt: string;
};

function mapMode(type: LegacyCommunicationRoom['type']): CommunicationMode {
  if (type === 'CHANNEL') return 'messaging';
  return 'audio';
}

function mapType(mode: CommunicationMode): CommunicationRoom['type'] {
  if (mode === 'video') return 'VIDEO_ROOM';
  if (mode === 'messaging') return 'MESSAGE_ROOM';
  return 'CALL_ROOM';
}

function mapStatus(state?: CommunicationRoomState | null): CommunicationRoom['status'] {
  if (!state) return 'IDLE';
  const hasActiveCall = state.activeCalls.some((call) => call.status === 'ACTIVE' || call.status === 'WAITING');
  if (hasActiveCall) return 'ACTIVE';
  if (state.activeCalls.some((call) => call.status === 'FAILED')) return 'FLAGGED';
  return 'IDLE';
}

function mapParticipantRole(role: string): Participant['role'] {
  if (role === 'OWNER') return 'ADMIN';
  if (role === 'MODERATOR') return 'ANALYST';
  return 'RESEARCHER';
}

function mapParticipantStatus(p: CommunicationRoomState['participants'][number]): Participant['status'] {
  if (p.muted) return 'MUTED';
  return p.isOnline ? 'ONLINE' : 'OFFLINE';
}

async function enrichRoom(base: LegacyCommunicationRoom, forcedMode?: CommunicationMode): Promise<CommunicationRoom> {
  const state = await getCommunicationRoomState(base.id).catch(() => null);
  const mode = forcedMode ?? mapMode(base.type);

  return {
    id: base.id,
    name: base.name,
    mode,
    type: mapType(mode),
    status: mapStatus(state),
    workspaceId: null,
    studyId: null,
    createdAt: base.createdAt,
    participantCount: state?.participants.length ?? 0,
    unreadCount: 0,
  };
}

export const communicationApi = {
  metrics: async (): Promise<CommunicationMetrics> => {
    const data = await getCommunicationMonitoring();
    const activeMessageRooms = data.tables?.messageQueueStatus?.queued ? 1 : 0;
    return {
      activeCalls: data.cards.activeCalls,
      activeVideoRooms: data.cards.activeVideoRooms,
      activeMessageRooms,
      onlineUsers: data.cards.onlineUsers,
      unreadMessages: data.cards.unreadMessages,
      failedAttempts: data.cards.failedConnectionAttempts,
      flaggedSessions: data.cards.flaggedSessions,
      activeRooms: data.cards.activeCalls + data.cards.activeVideoRooms + activeMessageRooms,
    };
  },

  rooms: async (mode?: CommunicationMode): Promise<CommunicationRoom[]> => {
    const rooms = await listCommunicationRooms();
    const filtered = mode
      ? rooms.filter((room) => {
          if (mode === 'messaging') return room.type === 'CHANNEL';
          if (mode === 'video') return room.type === 'CALL_ROOM';
          return room.type === 'CALL_ROOM';
        })
      : rooms;

    return Promise.all(filtered.map((room) => enrichRoom(room, mode)));
  },

  room: async (roomId: string): Promise<{ room: CommunicationRoom; participants: Participant[] }> => {
    const state = await getCommunicationRoomState(roomId);
    const activeCall = state.activeCalls.find((call) => call.status === 'ACTIVE' || call.status === 'WAITING');
    const mode: CommunicationMode =
      state.room.type === 'CHANNEL' ? 'messaging' : activeCall?.mode === 'VIDEO' ? 'video' : 'audio';

    const room: CommunicationRoom = {
      id: state.room.id,
      name: state.room.name,
      mode,
      type: mapType(mode),
      status: mapStatus(state),
      workspaceId: null,
      studyId: null,
      createdAt: state.room.createdAt,
      participantCount: state.participants.length,
      unreadCount: 0,
    };

    const participants: Participant[] = state.participants.map((p) => ({
      id: p.id,
      displayName: p.userId,
      role: mapParticipantRole(p.role),
      status: mapParticipantStatus(p),
      joinedAt: p.joinedAt,
    }));

    return { room, participants };
  },

  activity: async (): Promise<ActivityEvent[]> => {
    const data = await getCommunicationMonitoring();
    const items = (data.tables.recentModerationActions ?? []) as MonitoringAction[];
    return items.map((item) => ({
      id: item.id,
      type: item.action,
      message: item.action,
      severity: /FAIL|ERROR/i.test(item.action)
        ? 'ERROR'
        : /REMOVE|MUTE|FLAG/i.test(item.action)
          ? 'WARNING'
          : 'INFO',
      createdAt: item.createdAt,
    }));
  },

  createRoom: async (payload: { name: string; mode: CommunicationMode; workspaceId?: string }) => {
    const room = await createCommunicationRoom({
      name: payload.name,
      type: payload.mode === 'messaging' ? 'CHANNEL' : 'CALL_ROOM',
      visibility: 'ORG',
    });
    return enrichRoom(room, payload.mode);
  },

  joinRoom: async (roomId: string) => {
    return communicationApi.room(roomId);
  },

  closeRoom: async (_roomId: string) => {
    return { ok: true };
  },

  moderate: async (_roomId: string, _participantId: string, _action: 'MUTE' | 'REMOVE' | 'FLAG') => {
    return { ok: true };
  },

  sendMessage: async (roomId: string, body: string) => {
    const { data } = await api.post(`/v1/communication/rooms/${roomId}/messages`, { body });
    return data;
  },
};

export function connectCommunicationSocket(onEvent: (event: unknown) => void): { close: () => void } {
  const socket = getSocket();

  const emitRoomEvent = (payload: unknown) => onEvent({ type: 'room.updated', payload });
  const emitParticipantEvent = (payload: unknown) => onEvent({ type: 'participant.updated', payload });
  const emitMessageEvent = (payload: unknown) => onEvent({ type: 'message.sent', payload });

  socket.on('room:participants', emitParticipantEvent);
  socket.on('message:new', emitMessageEvent);
  socket.on('presence:update', emitRoomEvent);

  return {
    close: () => {
      socket.off('room:participants', emitParticipantEvent);
      socket.off('message:new', emitMessageEvent);
      socket.off('presence:update', emitRoomEvent);
    },
  };
}
