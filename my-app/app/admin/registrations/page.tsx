'use client';

import Link from 'next/link';
import { ProtectedRoute } from '@/components/protected-route';

function RegistrationsContent() {
  return (
    <div style={{ minHeight: '100vh', background: '#f5f7fb' }}>
      <header style={{
        background: 'white', borderBottom: '1px solid #e0e0e0',
        boxShadow: '0 2px 8px rgba(0,0,0,0.05)', position: 'sticky', top: 0, zIndex: 100,
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '16px 32px', maxWidth: 1400, margin: '0 auto' }}>
          <span style={{ fontSize: 28 }}>🛡️</span>
          <h1 style={{ fontSize: 20, fontWeight: 700, margin: 0, color: '#1a1a1a' }}>Registration Requests</h1>
        </div>
      </header>
      <main style={{ padding: 32, maxWidth: 1400, margin: '0 auto' }}>
        <div style={{ marginBottom: 16 }}>
          <Link href="/admin" style={{ fontSize: 14, fontWeight: 500, color: '#667eea', textDecoration: 'none' }}>
            &larr; Back to Admin
          </Link>
        </div>
        <div style={{
          background: 'white', border: '1px solid #e0e0e0', borderRadius: 12, padding: 32,
        }}>
          <p style={{ fontSize: 14, color: '#666', margin: 0 }}>User management will be available once the admin endpoints are connected.</p>
        </div>
      </main>
    </div>
  );
}

export default function RegistrationsPage() {
  return (
    <ProtectedRoute allowedRoles={['ADMIN']}>
      <RegistrationsContent />
    </ProtectedRoute>
  );
}
