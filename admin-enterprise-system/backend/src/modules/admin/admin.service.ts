
import { Injectable, NotFoundException } from "@nestjs/common";
import { UpdateUserRoleDto } from "./dto/update-user-role.dto";
import { UpdateUserStatusDto } from "./dto/update-user-status.dto";

@Injectable()
export class AdminService {
  private overviewData = { totalUsers:248, activeSessions:67, totalDatasets:1324, runningJobs:23, pendingApprovals:8, systemHealth:"Healthy" as const };
  private users = [
    { id:"u1", fullName:"Jerry Godwin", email:"jgodwin@datanotchplatform.org", role:"USER" as const, status:"ACTIVE" as const, institution:"DataNotch Research Platform", lastLogin:"2026-03-30 12:31 PM" },
    { id:"u2", fullName:"Donneyong Example", email:"donneyong1@osu.edu", role:"ADMIN" as const, status:"ACTIVE" as const, institution:"Ohio State University", lastLogin:"2026-03-30 11:12 AM" },
  ];
  private registrations = [
    { id:"r1", fullName:"New Researcher", email:"new.user@example.edu", institution:"Example University", requestedRole:"USER", submittedAt:"2026-03-29 02:15 PM", status:"PENDING" as const },
  ];
  private accessSummary = { totalAdmins:4, totalReviewers:18, totalSuspendedUsers:6, pendingAccessRequests:3 };
  private auditEvents = [
    { id:"a1", action:"ROLE_UPDATED", actor:"Admin Console", target:"u1", createdAt:"2026-03-30 10:22 AM", severity:"MEDIUM" as const },
    { id:"a2", action:"REGISTRATION_APPROVED", actor:"Admin Console", target:"r1", createdAt:"2026-03-30 09:10 AM", severity:"LOW" as const },
  ];
  private monitoring = { apiLatencyMs:118, workerStatus:"Online" as const, queueDepth:14, failureRate:1.8, cpuLoad:43, memoryUsage:58 };

  async getOverview(){ return this.overviewData; }
  async getUsers(){ return this.users; }
  async updateUserRole(userId:string, body:UpdateUserRoleDto){ const user=this.users.find(u=>u.id===userId); if(!user) throw new NotFoundException(`User ${userId} not found`); (user as any).role=body.role; return user; }
  async updateUserStatus(userId:string, body:UpdateUserStatusDto){ const user=this.users.find(u=>u.id===userId); if(!user) throw new NotFoundException(`User ${userId} not found`); (user as any).status=body.status; return user; }
  async getRegistrations(){ return this.registrations; }
  async approveRegistration(id:string){ const item=this.registrations.find(r=>r.id===id); if(!item) throw new NotFoundException(`Registration ${id} not found`); (item as any).status="APPROVED"; return item; }
  async rejectRegistration(id:string){ const item=this.registrations.find(r=>r.id===id); if(!item) throw new NotFoundException(`Registration ${id} not found`); (item as any).status="REJECTED"; return item; }
  async getAccessSummary(){ return this.accessSummary; }
  async getAuditEvents(){ return this.auditEvents; }
  async getMonitoring(){ return this.monitoring; }
}
