export type GovernanceUser = {
  id: string;
  fullName: string;
  email: string;
  role: "USER" | "REVIEWER" | "STAFF" | "ADMIN" | "SUPER_ADMIN";
  status: "ACTIVE" | "PENDING" | "SUSPENDED";
  institution: string | null;
  lastLogin: string | null;
};

export type GovernanceAccessRequest = {
  id: string;
  fullName: string;
  email: string;
  requestedRole: GovernanceUser["role"];
  status: "PENDING" | "APPROVED" | "REJECTED";
  submittedAt: string;
};

export type GovernanceAuditEvent = {
  id: string;
  action: string;
  targetType: string;
  targetId: string;
  actor: string;
  severity: "LOW" | "MEDIUM" | "HIGH";
  createdAt: string;
};

const API_BASE = process.env.NEXT_PUBLIC_API_BASE_URL?.replace(/\/$/, "") ?? "http://localhost:4000";
const API_PREFIX = "/api/v1";

async function request<T>(path: string, init?: RequestInit): Promise<T> {
  const res = await fetch(`${API_BASE}${API_PREFIX}${path}`, {
    ...init,
    credentials: "include",
    cache: "no-store",
    headers: { "Content-Type": "application/json", ...(init?.headers ?? {}) },
  });
  if (!res.ok) throw new Error(`Request failed: ${res.status}`);
  return (await res.json()) as T;
}

export const listGovernanceUsers = (params?: { search?: string; role?: string; status?: string }) => {
  const qs = new URLSearchParams();
  if (params?.search) qs.set("search", params.search);
  if (params?.role) qs.set("role", params.role);
  if (params?.status) qs.set("status", params.status);
  return request<GovernanceUser[]>(`/admin-governance/users${qs.toString() ? `?${qs.toString()}` : ""}`);
};

export const updateGovernanceUserRole = (userId: string, role: GovernanceUser["role"]) =>
  request<GovernanceUser>(`/admin-governance/users/${userId}/role`, { method: "PATCH", body: JSON.stringify({ role }) });

export const updateGovernanceUserStatus = (userId: string, status: GovernanceUser["status"]) =>
  request<GovernanceUser>(`/admin-governance/users/${userId}/status`, { method: "PATCH", body: JSON.stringify({ status }) });

export const listGovernanceAccessRequests = () => request<GovernanceAccessRequest[]>("/admin-governance/access-requests");
export const approveGovernanceAccessRequest = (requestId: string) =>
  request<GovernanceAccessRequest>(`/admin-governance/access-requests/${requestId}/approve`, { method: "POST" });
export const rejectGovernanceAccessRequest = (requestId: string) =>
  request<GovernanceAccessRequest>(`/admin-governance/access-requests/${requestId}/reject`, { method: "POST" });

export const listGovernanceAuditEvents = () => request<GovernanceAuditEvent[]>("/admin-governance/audit-events");
