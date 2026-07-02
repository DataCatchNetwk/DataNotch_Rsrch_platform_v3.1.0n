export type RegisteredUser = {
  id: string;
  fullName: string;
  email: string;
  phone?: string | null;
  role: string;
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

const API_BASE = process.env.NEXT_PUBLIC_API_BASE_URL ?? '';

async function request<T>(path: string, options?: RequestInit): Promise<T> {
  const res = await fetch(`${API_BASE}${path}`, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...(options?.headers ?? {}),
    },
    cache: 'no-store',
  });

  if (!res.ok) {
    const text = await res.text();
    throw new Error(text || `Request failed: ${res.status}`);
  }

  return res.json();
}

export const communicationApi = {
  users: (query = '') => request<RegisteredUser[]>(`/api/admin/communication/users?q=${encodeURIComponent(query)}`),
  rooms: () => request<CommunicationRoom[]>('/api/admin/communication/rooms'),
  stats: () => request<any>('/api/admin/communication/stats'),

  startAudio: (payload: { userId: string; contactMethod: 'PHONE' | 'EMAIL' }) =>
    request<CommunicationRoom>('/api/admin/communication/audio/start', {
      method: 'POST',
      body: JSON.stringify(payload),
    }),

  inviteVideo: (payload: { userId: string; topic?: string }) =>
    request<CommunicationRoom>('/api/admin/communication/video/invite', {
      method: 'POST',
      body: JSON.stringify(payload),
    }),

  sendEmailMessage: (payload: { userId: string; subject: string; body: string }) =>
    request<{ ok: boolean; eventId: string }>('/api/admin/communication/messages/email', {
      method: 'POST',
      body: JSON.stringify(payload),
    }),

  endRoom: (roomId: string) =>
    request<CommunicationRoom>(`/api/admin/communication/rooms/${roomId}/end`, {
      method: 'POST',
    }),
};
