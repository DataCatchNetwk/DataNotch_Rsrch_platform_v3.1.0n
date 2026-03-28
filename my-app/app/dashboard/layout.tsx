'use client';

import { useAuth } from '@/lib/auth-context';
import { Bell } from 'lucide-react';
import { ProtectedRoute } from '@/components/protected-route';
import { AppSidebar } from '@/components/app-sidebar';
import { CommandPalette } from '@/components/command-palette';

function DashboardLayoutInner({ children }: { children: React.ReactNode }) {
  const { user, logout, loading } = useAuth();

  const handleLogout = async () => {
    try {
      logout();
    } catch (error) {
      console.error('Logout failed:', error);
    }
  };

  return (
    <div style={{ display: 'flex', minHeight: '100vh', background: '#f3f6fb' }}>
      <AppSidebar showAdminLink={Boolean(user?.roles.includes('ADMIN'))} />

      <main style={{ flex: 1, minHeight: '100vh' }}>
        <header
          style={{
            borderBottom: '1px solid #dbe3ef',
            background: 'rgba(255,255,255,0.92)',
            backdropFilter: 'blur(10px)',
            padding: '14px 24px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            position: 'sticky',
            top: 0,
            zIndex: 80,
          }}
        >
          <div>
            <h1 style={{ margin: 0, fontSize: 22, color: '#0f172a' }}>Research Workspace</h1>
            <p style={{ margin: '2px 0 0', fontSize: 13, color: '#64748b' }}>Ctrl/Cmd + K to quickly navigate</p>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
            <button
              type="button"
              aria-label="Notifications"
              style={{
                border: '1px solid #dbe3ef',
                borderRadius: 10,
                background: '#fff',
                width: 38,
                height: 38,
                display: 'grid',
                placeItems: 'center',
              }}
            >
              <Bell size={18} color="#334155" />
            </button>

            <div style={{ textAlign: 'right' }}>
              <p style={{ margin: 0, fontSize: 14, fontWeight: 600, color: '#0f172a' }}>
                {user?.firstname} {user?.surname}
              </p>
              <p style={{ margin: '2px 0 0', fontSize: 12, color: '#64748b' }}>{user?.email}</p>
            </div>

            <button
              type="button"
              onClick={handleLogout}
              disabled={loading}
              style={{
                border: '1px solid #dbe3ef',
                borderRadius: 10,
                background: '#fff',
                padding: '8px 12px',
                fontSize: 13,
                fontWeight: 600,
                color: '#334155',
                cursor: 'pointer',
              }}
            >
              Logout
            </button>
          </div>
        </header>

        <div style={{ padding: 24 }}>{children}</div>
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
