export const PlatformRole = {
  USER: 'USER',
  ANALYST: 'ANALYST',
  PENDING: 'PENDING',
  REVIEWER: 'REVIEWER',
  STAFF: 'STAFF',
  ADMIN: 'ADMIN',
  SUPER_ADMIN: 'SUPER_ADMIN',
  RESEARCHER: 'RESEARCHER',
} as const;

export type PlatformRoleName = (typeof PlatformRole)[keyof typeof PlatformRole];

export const SUPER_ADMIN_ROLE = PlatformRole.SUPER_ADMIN;
export const ADMIN_ROLES = [PlatformRole.ADMIN, PlatformRole.SUPER_ADMIN] as const;

export function normalizeRoleName(role: string): string {
  return role.trim().toUpperCase();
}

export function expandRoleHierarchy(roles: readonly string[]): string[] {
  const expanded = new Set(roles.map(normalizeRoleName).filter(Boolean));

  if (expanded.has(PlatformRole.SUPER_ADMIN)) {
    expanded.add(PlatformRole.ADMIN);
  }

  return Array.from(expanded);
}

export function hasAnyRole(userRoles: readonly string[], allowedRoles: readonly string[]): boolean {
  const expanded = expandRoleHierarchy(userRoles);
  const allowed = allowedRoles.map(normalizeRoleName);
  return allowed.some((role) => expanded.includes(role));
}

export function isAdminRole(roles: readonly string[]): boolean {
  return hasAnyRole(roles, [PlatformRole.ADMIN]);
}
