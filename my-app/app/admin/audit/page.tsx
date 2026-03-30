'use client';

import * as React from 'react';
import { ProtectedRoute } from '@/components/protected-route';
import { AdminCard } from '@/components/admin/admin-card';
import { AdminShell } from '@/components/admin/admin-shell';
import { AdminError, AdminLoading } from '@/components/admin/admin-states';
import { GovernanceAuditExplorer } from '@/components/admin-governance/audit-explorer';
import { listGovernanceAuditEvents, type GovernanceAuditEvent } from '@/lib/api/admin-governance-api-client';

function AuditLogsContent() {
  const [items, setItems] = React.useState<GovernanceAuditEvent[]>([]);
  const [search, setSearch] = React.useState('');
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState<string | null>(null);

  const load = React.useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      setItems(await listGovernanceAuditEvents());
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load audit events.');
    } finally {
      setLoading(false);
    }
  }, []);

  React.useEffect(() => {
    void load();
  }, [load]);

  return (
    <AdminShell title="Audit Logs" description="Review platform events, role changes, approvals, and system activity.">
      {loading ? <AdminLoading cards={1} /> : null}
      {!loading && error ? <AdminError message={error} onRetry={() => void load()} /> : null}
      {!loading && !error ? (
        <AdminCard title="Audit Events" description="Recent high-value administrative and platform actions.">
          <GovernanceAuditExplorer items={items} search={search} onSearchChange={setSearch} />
        </AdminCard>
      ) : null}
    </AdminShell>
  );
}

export default function AuditLogsPage() {
  return (
    <ProtectedRoute allowedRoles={['ADMIN', 'SUPER_ADMIN']}>
      <AuditLogsContent />
    </ProtectedRoute>
  );
}