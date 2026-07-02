'use client';

import { apiFetch } from '@/lib/api';

export type GovernanceRole = 'USER' | 'REVIEWER' | 'STAFF' | 'ADMIN' | 'SUPER_ADMIN';
export type GovernanceStatus = 'ACTIVE' | 'PENDING' | 'SUSPENDED';

function getToken() {
  if (typeof window === 'undefined') return undefined;
  return localStorage.getItem('auth_token') ?? undefined;
}

function request<T>(path: string, init?: { method?: string; body?: unknown; headers?: Record<string, string> }) {
  return apiFetch<T>(`/v1/admin-policy${path}`, {
    method: init?.method,
    body: init?.body,
    headers: init?.headers,
    token: getToken(),
  });
}

export const bulkAssignPolicyRole = (userIds: string[], role: GovernanceRole, reason: string) =>
  request<{ ok: true; updatedIds: string[] }>('/users/bulk-role', {
    method: 'POST',
    body: { userIds, role, reason },
  });

export const bulkUpdatePolicyStatus = (userIds: string[], status: GovernanceStatus, reason: string) =>
  request<{ ok: true; updatedIds: string[] }>('/users/bulk-status', {
    method: 'POST',
    body: { userIds, status, reason },
  });

export const approveRegistrationPolicy = (requestId: string, reason: string, assignRole?: GovernanceRole) =>
  request<{ ok: true; requestId: string; status: 'APPROVED'; assignedRole: GovernanceRole }>(`/registrations/${requestId}/approve`, {
    method: 'POST',
    body: { reason, assignRole },
  });

export const rejectRegistrationPolicy = (requestId: string, reason: string) =>
  request<{ ok: true; requestId: string; status: 'REJECTED' }>(`/registrations/${requestId}/reject`, {
    method: 'POST',
    body: { reason },
  });

export async function exportAdminAuditEventsCsv() {
  const token = getToken();
  const headers: Record<string, string> = {};
  if (token) headers.Authorization = `Bearer ${token}`;

  const base = (process.env.NEXT_PUBLIC_API_BASE_URL ?? process.env.NEXT_PUBLIC_API_URL ?? 'http://127.0.0.1:3001').replace(/\/+$/, '');
  const url = base.endsWith('/api') ? `${base}/v1/admin-policy/audit-events/export` : `${base}/api/v1/admin-policy/audit-events/export`;

  const response = await fetch(url, {
    method: 'GET',
    headers,
  });

  if (!response.ok) {
    throw new Error(`Failed to export audit events (${response.status})`);
  }

  return response.text();
}
