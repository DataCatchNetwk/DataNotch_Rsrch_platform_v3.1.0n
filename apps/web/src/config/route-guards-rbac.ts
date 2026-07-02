import {
  NavConfig,
  Routes,
  type AppRole,
  type NavSection,
  type RouteKey,
} from "@/src/config/route-map-and-icons";

export type BadgeValue = number | string;
export type BadgeOverrides = Partial<Record<RouteKey, BadgeValue>>;

export type GuardDecision = {
  allowed: boolean;
  redirectTo: string;
};

export type BuiltNavItem = {
  key: RouteKey;
  title: string;
  href: string;
  iconKey: RouteKey;
  badge?: BadgeValue;
  children?: BuiltNavItem[];
};

export type BuiltNavSection = {
  title: string;
  items: BuiltNavItem[];
};

function isKnownRole(role: string): role is AppRole {
  return role === "ADMIN" || role === "ANALYST" || role === "PENDING" || role === "USER";
}

export function normalizeRoles(userRoles: readonly string[]): AppRole[] {
  return userRoles.filter(isKnownRole);
}

export function hasRequiredRole(userRoles: readonly string[], allowedRoles?: readonly AppRole[]): boolean {
  if (!allowedRoles || allowedRoles.length === 0) return true;
  return allowedRoles.some((role) => userRoles.includes(role));
}

export function canAccessRoute(routeKey: RouteKey, userRoles: readonly string[]): boolean {
  const normalized = normalizeRoles(userRoles);

  for (const section of NavConfig) {
    const item = section.items.find((entry) => entry.key === routeKey);
    if (item) {
      return hasRequiredRole(normalized, item.roles);
    }

    const child = section.items
      .flatMap((entry) => entry.children ?? [])
      .find((entry) => entry.key === routeKey);
    if (child) {
      return hasRequiredRole(normalized, child.roles);
    }
  }

  return true;
}

export function rbacGuardMiddleware(
  routeKey: RouteKey,
  userRoles: readonly string[],
  redirectTo: string = Routes.DASHBOARD
): GuardDecision {
  return {
    allowed: canAccessRoute(routeKey, userRoles),
    redirectTo,
  };
}

export function buildSidebarSections(
  userRoles: readonly string[],
  badgeOverrides: BadgeOverrides = {}
): BuiltNavSection[] {
  const normalized = normalizeRoles(userRoles);
  const buildItem = (item: NavSection["items"][number]): BuiltNavItem => ({
    key: item.key,
    title: item.title,
    href: item.href ?? Routes[item.key],
    iconKey: item.iconKey ?? item.key,
    badge: badgeOverrides[item.key] ?? item.badgeDefault,
    children: item.children
      ?.filter((child) => hasRequiredRole(normalized, child.roles))
      .map(buildItem),
  });

  return (NavConfig as NavSection[])
    .map((section) => ({
      title: section.title,
      items: section.items
        .filter((item) => hasRequiredRole(normalized, item.roles))
        .map(buildItem),
    }))
    .filter((section) => section.items.length > 0);
}
