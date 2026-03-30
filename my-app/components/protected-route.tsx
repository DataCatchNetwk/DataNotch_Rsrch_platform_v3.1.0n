'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
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
  unauthenticatedRedirectTo = '/login/user',
}: Props) {
  const { user, loading } = useAuth();
  const router = useRouter();

  const roleCheckPassed = !allowedRoles || allowedRoles.some((r) => user?.roles.includes(r));
  const routeGuard = routeKey && user ? rbacGuardMiddleware(routeKey, user.roles, redirectTo) : null;

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
    if (!roleCheckPassed) {
      router.replace(redirectTo);
    }
  }, [
    user,
    loading,
    routeGuard,
    roleCheckPassed,
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
  if (!roleCheckPassed) return null;

  return <>{children}</>;
}
