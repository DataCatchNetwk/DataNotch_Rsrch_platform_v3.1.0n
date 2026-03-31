
import { Injectable, ForbiddenException } from "@nestjs/common";

export type PolicyRole = "USER" | "REVIEWER" | "STAFF" | "ADMIN" | "SUPER_ADMIN";

@Injectable()
export class AdminPolicyService {
  private readonly matrix: Record<PolicyRole, string[]> = {
    USER: [],
    REVIEWER: [],
    STAFF: ["view_users", "view_access_requests"],
    ADMIN: [
      "view_users",
      "update_user_status",
      "view_access_requests",
      "approve_access_request",
      "reject_access_request",
      "view_audit_events",
      "bulk_suspend_users",
    ],
    SUPER_ADMIN: [
      "view_users",
      "update_user_status",
      "update_user_role",
      "view_access_requests",
      "approve_access_request",
      "reject_access_request",
      "view_audit_events",
      "export_audit_events",
      "bulk_suspend_users",
      "bulk_update_roles",
      "assign_admin_role",
    ],
  };

  can(role: PolicyRole, permission: string) {
    return this.matrix[role]?.includes(permission) ?? false;
  }

  assert(role: PolicyRole, permission: string) {
    if (!this.can(role, permission)) {
      throw new ForbiddenException(`Missing permission: ${permission}`);
    }
  }
}
