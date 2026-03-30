
export type AdminOverview = { totalUsers:number; activeSessions:number; totalDatasets:number; runningJobs:number; pendingApprovals:number; systemHealth:"Healthy"|"Warning"|"Critical" };
export type AdminUser = { id:string; fullName:string; email:string; role:"USER"|"REVIEWER"|"STAFF"|"ADMIN"; status:"ACTIVE"|"PENDING"|"SUSPENDED"; institution:string; lastLogin:string };
export type RegistrationRequest = { id:string; fullName:string; email:string; institution:string; requestedRole:string; submittedAt:string; status:"PENDING"|"APPROVED"|"REJECTED" };
export type AccessSummary = { totalAdmins:number; totalReviewers:number; totalSuspendedUsers:number; pendingAccessRequests:number };
export type AuditEvent = { id:string; action:string; actor:string; target:string; createdAt:string; severity:"LOW"|"MEDIUM"|"HIGH" };
export type MonitoringSnapshot = { apiLatencyMs:number; workerStatus:"Online"|"Degraded"|"Offline"; queueDepth:number; failureRate:number; cpuLoad:number; memoryUsage:number };
