import { NotificationListResponse, NotificationPreferences } from '@/types/notification';

const API_BASE = process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:4000';

async function api<T>(path: string, init?: RequestInit): Promise<T> {
  const res = await fetch(`${API_BASE}${path}`, {
    ...init,
    headers: {
      'Content-Type': 'application/json',
      ...(init?.headers || {}),
    },
    credentials: 'include',
    cache: 'no-store',
  });

  if (!res.ok) {
    const text = await res.text();
    throw new Error(text || 'Request failed');
  }

  return res.json();
}

export async function listNotifications(params?: {
  cursor?: string;
  limit?: number;
  status?: 'UNREAD' | 'READ' | 'ARCHIVED';
  category?: string;
}) {
  const qs = new URLSearchParams();
  if (params?.cursor) qs.set('cursor', params.cursor);
  if (params?.limit) qs.set('limit', String(params.limit));
  if (params?.status) qs.set('status', params.status);
  if (params?.category) qs.set('category', params.category);

  return api<NotificationListResponse>(`/notifications?${qs.toString()}`);
}

export async function getUnreadCount() {
  return api<{ count: number }>(`/notifications/unread-count`);
}

export async function markNotificationRead(id: string) {
  return api(`/notifications/${id}/read`, { method: 'PATCH' });
}

export async function markAllNotificationsRead() {
  return api(`/notifications/read-all`, { method: 'PATCH' });
}

export async function archiveAllReadNotifications() {
  return api(`/notifications/archive-all-read`, { method: 'PATCH' });
}

export async function deleteNotification(id: string) {
  return api(`/notifications/${id}`, { method: 'DELETE' });
}

export async function getNotificationPreferences() {
  return api<NotificationPreferences>(`/notifications/preferences`);
}

export async function updateNotificationPreferences(payload: Partial<NotificationPreferences>) {
  return api<NotificationPreferences>(`/notifications/preferences`, {
    method: 'PATCH',
    body: JSON.stringify(payload),
  });
}
