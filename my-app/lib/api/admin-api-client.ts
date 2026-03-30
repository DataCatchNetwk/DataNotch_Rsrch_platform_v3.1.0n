'use client';

import { apiFetch } from '@/lib/api';

export type AdminOverview = {
  totalUsers: number;
  activeSessions: number;
  totalDatasets: number;
  runningJobs: number;
  pendingApprovals: number;
  systemHealth: 'Healthy' | 'Warning' | 'Critical';
};

export type AdminUser = {
  id: string;
  fullName: string;
  email: string;
  role: 'USER' | 'REVIEWER' | 'STAFF' | 'ADMIN' | 'SUPER_ADMIN';
  status: 'ACTIVE' | 'PENDING' | 'SUSPENDED';
  institution: string;
  lastLogin: string;
};

export type RegistrationRequest = {
  id: string;
  fullName: string;
  email: string;
  institution: string;
  requestedRole: string;
  submittedAt: string;
  status: 'PENDING' | 'APPROVED' | 'REJECTED';
};

export type AccessSummary = {
  totalAdmins: number;
  totalReviewers: number;
  totalSuspendedUsers: number;
  pendingAccessRequests: number;
};

export type AuditEvent = {
  id: string;
  action: string;
  actor: string;
  target: string;
  createdAt: string;
  severity: 'LOW' | 'MEDIUM' | 'HIGH';
};

export type MonitoringSnapshot = {
  apiLatencyMs: number;
  workerStatus: 'Online' | 'Degraded' | 'Offline';
  queueDepth: number;
  failureRate: number;
  cpuLoad: number;
  memoryUsage: number;
};

function getToken() {
  if (typeof window === 'undefined') return undefined;
  return localStorage.getItem('auth_token') ?? undefined;
}

function request<T>(path: string, init?: { method?: string; body?: unknown }) {
  return apiFetch<T>(path, {
    method: init?.method,
    body: init?.body,
    token: getToken(),
  });
}

export const getAdminOverview = () => request<AdminOverview>('/v1/admin/overview');
export const getAdminUsers = () => request<AdminUser[]>('/v1/admin/users');
export const updateAdminUserRole = (userId: string, role: AdminUser['role']) =>
  request<AdminUser>(`/v1/admin/users/${userId}/role`, { method: 'PATCH', body: { role } });
export const updateAdminUserStatus = (userId: string, status: AdminUser['status']) =>
  request<AdminUser>(`/v1/admin/users/${userId}/status`, { method: 'PATCH', body: { status } });
export const getRegistrationRequests = () => request<RegistrationRequest[]>('/v1/admin/registrations');
export const approveRegistration = (id: string) =>
  request<RegistrationRequest>(`/v1/admin/registrations/${id}/approve`, { method: 'POST' });
export const rejectRegistration = (id: string) =>
  request<RegistrationRequest>(`/v1/admin/registrations/${id}/reject`, { method: 'POST' });
export const getAccessSummary = () => request<AccessSummary>('/v1/admin/access-summary');
export const getAuditEvents = () => request<AuditEvent[]>('/v1/admin/audit-events');
export const getMonitoringSnapshot = () => request<MonitoringSnapshot>('/v1/admin/monitoring');