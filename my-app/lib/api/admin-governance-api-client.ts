'use client';

import { apiFetch } from '@/lib/api';

export type GovernanceRole = 'USER' | 'REVIEWER' | 'STAFF' | 'ADMIN' | 'SUPER_ADMIN';
export type GovernanceStatus = 'ACTIVE' | 'PENDING' | 'SUSPENDED';

export type GovernanceUser = {
  id: string;
  fullName: string;
  email: string;
  role: GovernanceRole;
  status: GovernanceStatus;
  institution: string | null;
  lastLogin: string | null;
};

export type GovernanceAccessRequest = {
  id: string;
  fullName: string;
  email: string;
  requestedRole: GovernanceRole;
  status: 'PENDING' | 'APPROVED' | 'REJECTED';
  submittedAt: string;
};

export type GovernanceAuditEvent = {
  id: string;
  action: string;
  targetType: string;
  targetId: string;
  actor: string;
  severity: 'LOW' | 'MEDIUM' | 'HIGH';
  createdAt: string;
};

function getToken() {
  if (typeof window === 'undefined') return undefined;
  return localStorage.getItem('auth_token') ?? undefined;
}

function request<T>(path: string, init?: { method?: string; body?: unknown }) {
  return apiFetch<T>(`/v1/admin-governance${path}`, {
    method: init?.method,
    body: init?.body,
    token: getToken(),
  });
}

export const listGovernanceUsers = (params?: { search?: string; role?: string; status?: string }) => {
  const qs = new URLSearchParams();
  if (params?.search) qs.set('search', params.search);
  if (params?.role) qs.set('role', params.role);
  if (params?.status) qs.set('status', params.status);
  return request<GovernanceUser[]>(`/users${qs.toString() ? `?${qs.toString()}` : ''}`);
};

export const updateGovernanceUserRole = (userId: string, role: GovernanceUser['role']) =>
  request<GovernanceUser>(`/users/${userId}/role`, { method: 'PATCH', body: { role } });

export const updateGovernanceUserStatus = (userId: string, status: GovernanceUser['status']) =>
  request<GovernanceUser>(`/users/${userId}/status`, { method: 'PATCH', body: { status } });

export const bulkAssignGovernanceRole = (userIds: string[], role: GovernanceRole) =>
  request<{ ok: true; updatedIds: string[] }>('/users/bulk-role', { method: 'POST', body: { userIds, role } });

export const bulkSuspendGovernanceUsers = (userIds: string[]) =>
  request<{ ok: true; updatedIds: string[] }>('/users/bulk-suspend', { method: 'POST', body: { userIds } });

export const listGovernanceAccessRequests = () => request<GovernanceAccessRequest[]>('/access-requests');
export const approveGovernanceAccessRequest = (requestId: string) =>
  request<GovernanceAccessRequest>(`/access-requests/${requestId}/approve`, { method: 'POST' });
export const rejectGovernanceAccessRequest = (requestId: string) =>
  request<GovernanceAccessRequest>(`/access-requests/${requestId}/reject`, { method: 'POST' });

export const listGovernanceAuditEvents = () => request<GovernanceAuditEvent[]>('/audit-events');