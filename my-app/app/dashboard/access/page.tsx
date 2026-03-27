'use client';

import { useAuth } from '@/lib/auth-context';

export default function AccessPage() {
  const { user } = useAuth();

  return (
    <div>
      <div style={{ background: 'white', border: '1px solid #e0e0e0', borderRadius: 12, padding: 32 }}>
        <h2 style={{ fontSize: 20, fontWeight: 700, color: '#1a1a1a', margin: '0 0 24px' }}>Access Profile</h2>
        <p style={{ fontSize: 14, color: '#666', margin: '0 0 16px' }}>Your current permissions and assigned roles.</p>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          {user?.roles.map((role) => (
            <div key={role} style={{
              display: 'inline-block', padding: '8px 16px', background: '#eef0f8',
              color: '#667eea', borderRadius: 8, fontSize: 14, fontWeight: 500,
            }}>{role}</div>
          ))}
        </div>
      </div>
    </div>
  );
}
