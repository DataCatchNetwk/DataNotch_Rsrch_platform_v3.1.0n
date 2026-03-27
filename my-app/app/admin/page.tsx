'use client';

import Link from 'next/link';
import { ProtectedRoute } from '@/components/protected-route';
import { useAuth } from '@/lib/auth-context';

function AdminContent() {
  const { user, logout } = useAuth();

  return (
    <div style={s.container}>
      <header style={s.header}>
        <div style={s.headerInner}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <span style={{ fontSize: 28 }}>🛡️</span>
            <h1 style={{ fontSize: 20, fontWeight: 700, margin: 0, color: '#1a1a1a' }}>Admin Console</h1>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <span style={{ fontSize: 13, color: '#666' }}>Signed in as <strong>{user?.email}</strong></span>
            <Link href="/dashboard" style={s.navBtn}>Dashboard</Link>
            <button onClick={logout} style={s.navBtn}>Sign out</button>
          </div>
        </div>
      </header>

      <main style={s.main}>
        <div style={s.welcomeCard}>
          <h2 style={{ fontSize: 28, fontWeight: 700, margin: '0 0 8px', color: 'white' }}>Admin Dashboard</h2>
          <p style={{ fontSize: 15, opacity: 0.95, margin: 0, color: 'white' }}>Manage users, roles, and platform access</p>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: 24 }}>
          <Link href="/admin/registrations" style={s.card}>
            <div style={{ fontSize: 40, marginBottom: 16 }}>📋</div>
            <h3 style={{ fontSize: 16, fontWeight: 600, color: '#1a1a1a', margin: '0 0 8px' }}>Registration Queue</h3>
            <p style={{ fontSize: 13, color: '#666', margin: 0, lineHeight: 1.5 }}>Pending approval requests waiting for review</p>
          </Link>
          <div style={s.card}>
            <div style={{ fontSize: 40, marginBottom: 16 }}>🔐</div>
            <h3 style={{ fontSize: 16, fontWeight: 600, color: '#1a1a1a', margin: '0 0 8px' }}>Access Governance</h3>
            <p style={{ fontSize: 13, color: '#666', margin: 0, lineHeight: 1.5 }}>Manage user status, permissions, and active access</p>
          </div>
        </div>
      </main>
    </div>
  );
}

export default function AdminPage() {
  return (
    <ProtectedRoute allowedRoles={['ADMIN']}>
      <AdminContent />
    </ProtectedRoute>
  );
}

const s: Record<string, React.CSSProperties> = {
  container: { display: 'flex', flexDirection: 'column', minHeight: '100vh', background: '#f5f7fb' },
  header: {
    background: 'white', borderBottom: '1px solid #e0e0e0',
    boxShadow: '0 2px 8px rgba(0,0,0,0.05)', position: 'sticky', top: 0, zIndex: 100,
  },
  headerInner: {
    display: 'flex', justifyContent: 'space-between', alignItems: 'center',
    padding: '16px 32px', maxWidth: 1400, margin: '0 auto', width: '100%',
  },
  navBtn: {
    padding: '6px 14px', border: '1px solid #e0e0e0', borderRadius: 8,
    fontSize: 13, background: 'white', color: '#555', cursor: 'pointer', textDecoration: 'none',
  },
  main: { flex: 1, padding: 32, maxWidth: 1400, margin: '0 auto', width: '100%' },
  welcomeCard: {
    background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
    padding: 40, borderRadius: 16, marginBottom: 40,
    boxShadow: '0 10px 30px rgba(102,126,234,0.2)',
  },
  card: {
    background: 'white', border: '1px solid #e0e0e0', borderRadius: 12,
    padding: '28px 24px', textAlign: 'center', textDecoration: 'none', color: 'inherit',
    transition: 'all 0.3s', cursor: 'pointer',
  },
};
