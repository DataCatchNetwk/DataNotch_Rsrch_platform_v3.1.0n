export const PlatformRole = {
  USER: 'USER',
  ANALYST: 'ANALYST',
  PENDING: 'PENDING',
  REVIEWER: 'REVIEWER',
  STAFF: 'STAFF',
  ADMIN: 'ADMIN',
  SUPER_ADMIN: 'SUPER_ADMIN',
} as const;

export type PlatformRoleName = (typeof PlatformRole)[keyof typeof PlatformRole];

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

export function hasAnyRole(userRoles: readonly string[] | undefined, allowedRoles: readonly string[]): boolean {
  if (!userRoles) return false;
  const expanded = expandRoleHierarchy(userRoles);
  const allowed = allowedRoles.map(normalizeRoleName);
  return allowed.some((role) => expanded.includes(role));
}

export function isAdminUser(userRoles: readonly string[] | undefined): boolean {
  return hasAnyRole(userRoles, [PlatformRole.ADMIN]);
}

export function dashboardForRoles(userRoles: readonly string[] | undefined): string {
  return isAdminUser(userRoles) ? '/admin' : '/dashboard';
}
