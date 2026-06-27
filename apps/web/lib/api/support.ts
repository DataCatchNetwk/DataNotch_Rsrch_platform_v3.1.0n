import { apiFetch } from '@/lib/api';
import type { SupportTicket, SupportTicketCategory } from '@/types/support';

export type CreateSupportTicketPayload = {
  subject: string;
  description: string;
  requesterEmail: string;
  requesterName?: string;
  category: SupportTicketCategory;
  attachment?: File | null;
};

function getAuthToken() {
  if (typeof window === 'undefined') return undefined;
  return localStorage.getItem('auth_token') ?? sessionStorage.getItem('auth_token') ?? undefined;
}

export async function createSupportTicket(payload: CreateSupportTicketPayload) {
  const token = getAuthToken();
  const formData = new FormData();
  formData.set('subject', payload.subject);
  formData.set('description', payload.description);
  formData.set('requesterEmail', payload.requesterEmail);
  if (payload.requesterName) formData.set('requesterName', payload.requesterName);
  formData.set('category', payload.category);
  if (payload.attachment) formData.set('attachment', payload.attachment);

  const headers: Record<string, string> = {};
  if (token) headers.Authorization = `Bearer ${token}`;

  const response = await fetch(`${(process.env.NEXT_PUBLIC_API_BASE_URL ?? 'http://localhost:3001').replace(/\/+$/, '')}/api/v1/support`, {
    method: 'POST',
    headers,
    body: formData,
  });

  const data = await response.json().catch(() => ({}));
  if (!response.ok) {
    throw new Error((data as { message?: string }).message ?? `Request failed (${response.status})`);
  }

  return data as SupportTicket;
}

export async function listMySupportTickets() {
  const token = getAuthToken();
  if (!token) return [];

  const response = await apiFetch<{ tickets: SupportTicket[] }>('/api/v1/support/mine', {
    method: 'GET',
    token,
  });

  return response.tickets;
}

export async function listAdminSupportTickets(params?: { status?: string; priority?: string; search?: string }) {
  const token = getAuthToken();
  if (!token) throw new Error('Authentication required');

  const search = new URLSearchParams();
  if (params?.status) search.set('status', params.status);
  if (params?.priority) search.set('priority', params.priority);
  if (params?.search) search.set('search', params.search);

  const response = await apiFetch<{ tickets: SupportTicket[] }>(`/api/v1/support/admin?${search.toString()}`, {
    method: 'GET',
    token,
  });

  return response.tickets;
}

export async function getSupportTicket(ticketId: string) {
  const token = getAuthToken();
  if (!token) throw new Error('Authentication required');
  return apiFetch<SupportTicket>(`/api/v1/support/${ticketId}`, { method: 'GET', token });
}

export async function replyToSupportTicket(ticketId: string, payload: { message: string; isInternal?: boolean; attachment?: File | null }) {
  const token = getAuthToken();
  if (!token) throw new Error('Authentication required');

  const formData = new FormData();
  formData.set('message', payload.message);
  if (payload.isInternal) formData.set('isInternal', 'true');
  if (payload.attachment) formData.set('attachment', payload.attachment);

  const response = await fetch(`${(process.env.NEXT_PUBLIC_API_BASE_URL ?? 'http://localhost:3001').replace(/\/+$/, '')}/api/v1/support/${ticketId}/reply`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${token}` },
    body: formData,
  });

  const data = await response.json().catch(() => ({}));
  if (!response.ok) {
    throw new Error((data as { message?: string }).message ?? `Request failed (${response.status})`);
  }

  return data as SupportTicket;
}

export async function updateSupportTicket(ticketId: string, payload: { status?: string; priority?: string; assignedToId?: string | null }) {
  const token = getAuthToken();
  if (!token) throw new Error('Authentication required');
  return apiFetch<SupportTicket>(`/api/v1/support/${ticketId}`, {
    method: 'PATCH',
    token,
    body: payload,
  });
}
