'use client';

import { useAuth } from '@/lib/auth-context';
import { ProtectedRoute } from '@/components/protected-route';
import { AppSidebar } from '@/components/layout/app-sidebar';
import { CommandPalette } from '@/components/command-palette';
import { NotificationBell } from '@/components/notifications/notification-bell';
import { usePathname } from 'next/navigation';

function getPageTitle(pathname: string) {
  if (pathname === '/dashboard') return 'Dashboard';
  const segment = pathname.split('/').filter(Boolean)[1] ?? 'dashboard';
  return segment.charAt(0).toUpperCase() + segment.slice(1).replace(/-/g, ' ');
}

function DashboardLayoutInner({ children }: { children: React.ReactNode }) {
  useAuth();
  const pathname = usePathname();
  const pageTitle = getPageTitle(pathname);

  return (
    <div className="min-h-screen bg-slate-50">
      <div className="flex min-h-screen">
        <AppSidebar />
        <main className="min-w-0 flex-1">
          <header className="sticky top-0 z-20 border-b border-slate-200 bg-white/95 backdrop-blur">
            <div className="flex h-16 items-center justify-between px-4 sm:px-6">
              <div>
                <p className="text-sm text-slate-500">Research Platform</p>
                <h1 className="text-lg font-semibold text-slate-900">{pageTitle}</h1>
              </div>
              <div className="flex items-center gap-2">
                <NotificationBell />
              </div>
            </div>
          </header>
          {children}
          <CommandPalette />
        </main>
      </div>
    </div>
  );
}

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  return (
    <ProtectedRoute routeKey="DASHBOARD">
      <DashboardLayoutInner>{children}</DashboardLayoutInner>
    </ProtectedRoute>
  );
}
