'use client';

import { useAuth } from '@/lib/auth-context';

export default function ProfilePage() {
  const { user } = useAuth();

  return (
    <div>
      <div style={{ background: 'white', border: '1px solid #e0e0e0', borderRadius: 12, padding: 32, maxWidth: 600 }}>
        <h2 style={{ fontSize: 20, fontWeight: 700, color: '#1a1a1a', margin: '0 0 24px' }}>Profile & Credentials</h2>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          <InfoRow label="First Name" value={user?.firstname} />
          <InfoRow label="Surname" value={user?.surname} />
          <InfoRow label="Email" value={user?.email} />
          <InfoRow label="Roles" value={user?.roles.join(', ') || 'None'} noBorder />
        </div>
      </div>
    </div>
  );
}

function InfoRow({ label, value, noBorder }: { label: string; value?: string; noBorder?: boolean }) {
  return (
    <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: noBorder ? 'none' : '1px solid #e0e0e0', paddingBottom: noBorder ? 0 : 12 }}>
      <span style={{ fontSize: 14, fontWeight: 600, color: '#666' }}>{label}</span>
      <span style={{ fontSize: 14, color: '#1a1a1a' }}>{value}</span>
    </div>
  );
}
