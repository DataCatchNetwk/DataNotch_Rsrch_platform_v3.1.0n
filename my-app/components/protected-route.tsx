'use client';

import { useEffect } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import { useAuth } from '@/lib/auth-context';
import { Routes, type RouteKey } from '@/src/config/route-map-and-icons';
import { rbacGuardMiddleware } from '@/src/config/route-guards-rbac';

type Props = {
  children: React.ReactNode;
  allowedRoles?: string[];
  routeKey?: RouteKey;
  redirectTo?: string;
  unauthenticatedRedirectTo?: string;
};

export function ProtectedRoute({
  children,
  allowedRoles,
  routeKey,
  redirectTo = Routes.DASHBOARD,
  unauthenticatedRedirectTo = '/',
}: Props) {
  const { user, loading } = useAuth();
  const router = useRouter();
  const pathname = usePathname();

  const roleCheckPassed = !allowedRoles || allowedRoles.some((r) => user?.roles.includes(r));
  const routeGuard = routeKey && user ? rbacGuardMiddleware(routeKey, user.roles, redirectTo) : null;
  const isDashboardPath = pathname.startsWith('/dashboard');
  const isPendingScreen = pathname.startsWith('/dashboard/pending');
  const isAdminUser = Boolean(user?.roles.some((role) => role === 'ADMIN' || role === 'SUPER_ADMIN'));
  const requiresApproval = Boolean(user && !isAdminUser && user.accountStatus !== 'ACTIVE');

  useEffect(() => {
    if (loading) return;
    if (!user) {
      router.replace(unauthenticatedRedirectTo);
      return;
    }
    if (routeGuard && !routeGuard.allowed) {
      router.replace(routeGuard.redirectTo);
      return;
    }
    if (requiresApproval && isDashboardPath && !isPendingScreen) {
      router.replace('/dashboard/pending');
      return;
    }
    if (!roleCheckPassed) {
      router.replace(redirectTo);
    }
  }, [
    user,
    loading,
    routeGuard,
    roleCheckPassed,
    requiresApproval,
    isDashboardPath,
    isPendingScreen,
    router,
    redirectTo,
    unauthenticatedRedirectTo,
  ]);

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <p className="text-slate-500">Loading...</p>
      </div>
    );
  }

  if (!user) return null;
  if (routeGuard && !routeGuard.allowed) return null;
  if (requiresApproval && isDashboardPath && !isPendingScreen) return null;
  if (!roleCheckPassed) return null;

  return <>{children}</>;
}
