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

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:4000';
const WS_URL = process.env.NEXT_PUBLIC_WS_URL ?? 'ws://localhost:4000';

async function request<T>(path: string, init?: RequestInit): Promise<T> {
  const response = await fetch(`${API_URL}${path}`, {
    ...init,
    headers: {
      'Content-Type': 'application/json',
      ...(init?.headers ?? {}),
    },
  });

  if (!response.ok) {
    const text = await response.text();
    throw new Error(text || `Request failed: ${response.status}`);
  }

  return response.json();
}

export const communicationApi = {
  metrics: () => request<CommunicationMetrics>('/api/admin/communication/metrics'),
  rooms: (mode?: CommunicationMode) =>
    request<CommunicationRoom[]>(`/api/admin/communication/rooms${mode ? `?mode=${mode}` : ''}`),
  room: (roomId: string) =>
    request<{ room: CommunicationRoom; participants: Participant[] }>(`/api/admin/communication/rooms/${roomId}`),
  activity: () => request<ActivityEvent[]>('/api/admin/communication/activity'),
  createRoom: (payload: { name: string; mode: CommunicationMode; workspaceId?: string }) =>
    request<CommunicationRoom>('/api/admin/communication/rooms', {
      method: 'POST',
      body: JSON.stringify(payload),
    }),
  joinRoom: (roomId: string, displayName = 'Admin User') =>
    request(`/api/admin/communication/rooms/${roomId}/join`, {
      method: 'POST',
      body: JSON.stringify({ displayName }),
    }),
  closeRoom: (roomId: string) =>
    request(`/api/admin/communication/rooms/${roomId}/close`, { method: 'POST' }),
  moderate: (roomId: string, participantId: string, action: 'MUTE' | 'REMOVE' | 'FLAG') =>
    request(`/api/admin/communication/rooms/${roomId}/moderate`, {
      method: 'POST',
      body: JSON.stringify({ participantId, action }),
    }),
  sendMessage: (roomId: string, body: string) =>
    request('/api/admin/communication/messages', {
      method: 'POST',
      body: JSON.stringify({ roomId, body }),
    }),
};

export function connectCommunicationSocket(onEvent: (event: any) => void): WebSocket {
  const socket = new WebSocket(`${WS_URL}/ws/admin/communication`);
  socket.onmessage = (message) => {
    try {
      onEvent(JSON.parse(message.data));
    } catch {
      onEvent({ type: 'raw', payload: message.data });
    }
  };
  return socket;
}
