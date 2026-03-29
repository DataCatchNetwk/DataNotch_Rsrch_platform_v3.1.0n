'use client';

import { useAuth } from '@/lib/auth-context';
import { ProtectedRoute } from '@/components/protected-route';
import { AppSidebar } from '@/components/app-sidebar';
import { CommandPalette } from '@/components/command-palette';
import styles from './layout.module.css';

function DashboardLayoutInner({ children }: { children: React.ReactNode }) {
  const { user } = useAuth();

  return (
    <div className={styles.shell}>
      <AppSidebar showAdminLink={Boolean(user?.roles.includes('ADMIN'))} />

      <main className={styles.main}>
        {children}
        <CommandPalette />
      </main>
    </div>
  );
}

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  return (
    <ProtectedRoute>
      <DashboardLayoutInner>{children}</DashboardLayoutInner>
    </ProtectedRoute>
  );
}
