
export type AdminOverview = {
  totalUsers: number; activeSessions: number; totalDatasets: number;
  runningJobs: number; pendingApprovals: number; systemHealth: "Healthy"|"Warning"|"Critical";
};
export type AdminUser = {
  id: string; fullName: string; email: string;
  role: "USER"|"REVIEWER"|"STAFF"|"ADMIN";
  status: "ACTIVE"|"PENDING"|"SUSPENDED";
  institution: string; lastLogin: string;
};
export type RegistrationRequest = {
  id: string; fullName: string; email: string; institution: string;
  requestedRole: string; submittedAt: string; status: "PENDING"|"APPROVED"|"REJECTED";
};
export type AccessSummary = {
  totalAdmins: number; totalReviewers: number; totalSuspendedUsers: number; pendingAccessRequests: number;
};
export type AuditEvent = {
  id: string; action: string; actor: string; target: string; createdAt: string; severity: "LOW"|"MEDIUM"|"HIGH";
};
export type MonitoringSnapshot = {
  apiLatencyMs: number; workerStatus: "Online"|"Degraded"|"Offline";
  queueDepth: number; failureRate: number; cpuLoad: number; memoryUsage: number;
};

class ApiError extends Error { constructor(message: string, public status: number, public payload?: unknown){super(message);} }
const API_BASE=(process.env.NEXT_PUBLIC_API_BASE_URL?.replace(/\/$/,""))??"http://localhost:4000";
const API_PREFIX="/api/v1";
async function request<T>(path: string, init?: RequestInit): Promise<T> {
  const res = await fetch(`${API_BASE}${API_PREFIX}${path}`, {
    ...init, credentials:"include", cache:"no-store",
    headers:{ "Content-Type":"application/json", ...(init?.headers??{})}
  });
  const ct=res.headers.get("content-type")||"";
  const payload = ct.includes("application/json") ? await res.json() : await res.text();
  if(!res.ok){
    const msg = typeof payload==="object" && payload && "message" in payload && typeof (payload as any).message==="string"
      ? (payload as any).message : `Request failed with status ${res.status}`;
    throw new ApiError(msg,res.status,payload);
  }
  return payload as T;
}
export const getAdminOverview=()=>request<AdminOverview>("/admin/overview");
export const getAdminUsers=()=>request<AdminUser[]>("/admin/users");
export const updateAdminUserRole=(userId:string,role:AdminUser["role"])=>request<AdminUser>(`/admin/users/${userId}/role`,{method:"PATCH",body:JSON.stringify({role})});
export const updateAdminUserStatus=(userId:string,status:AdminUser["status"])=>request<AdminUser>(`/admin/users/${userId}/status`,{method:"PATCH",body:JSON.stringify({status})});
export const getRegistrationRequests=()=>request<RegistrationRequest[]>("/admin/registrations");
export const approveRegistration=(id:string)=>request<RegistrationRequest>(`/admin/registrations/${id}/approve`,{method:"POST"});
export const rejectRegistration=(id:string)=>request<RegistrationRequest>(`/admin/registrations/${id}/reject`,{method:"POST"});
export const getAccessSummary=()=>request<AccessSummary>("/admin/access-summary");
export const getAuditEvents=()=>request<AuditEvent[]>("/admin/audit-events");
export const getMonitoringSnapshot=()=>request<MonitoringSnapshot>("/admin/monitoring");
