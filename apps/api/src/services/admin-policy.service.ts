import { HttpError } from '../utils/errors.js';

export type PolicyRole = 'USER' | 'REVIEWER' | 'STAFF' | 'ADMIN' | 'SUPER_ADMIN';

const matrix: Record<PolicyRole, string[]> = {
  USER: [],
  REVIEWER: [],
  STAFF: ['view_users', 'view_access_requests'],
  ADMIN: [
    'view_users',
    'update_user_status',
    'view_access_requests',
    'approve_access_request',
    'reject_access_request',
    'view_audit_events',
    'export_audit_events',
    'bulk_suspend_users',
  ],
  SUPER_ADMIN: [
    'view_users',
    'update_user_status',
    'update_user_role',
    'view_access_requests',
    'approve_access_request',
    'reject_access_request',
    'view_audit_events',
    'export_audit_events',
    'bulk_suspend_users',
    'bulk_update_roles',
    'assign_admin_role',
  ],
};

export function resolvePolicyRole(roles: string[]): PolicyRole {
  if (roles.includes('SUPER_ADMIN')) return 'SUPER_ADMIN';
  if (roles.includes('ADMIN')) return 'ADMIN';
  if (roles.includes('STAFF')) return 'STAFF';
  if (roles.includes('REVIEWER')) return 'REVIEWER';
  return 'USER';
}

export function can(role: PolicyRole, permission: string) {
  return matrix[role]?.includes(permission) ?? false;
}

export function assertPermission(roles: string[], permission: string) {
  const role = resolvePolicyRole(roles);
  if (!can(role, permission)) {
    throw new HttpError(403, `Missing permission: ${permission}`);
  }
}
