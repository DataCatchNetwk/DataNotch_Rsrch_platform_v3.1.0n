'use client';

import * as React from 'react';
import { Download } from 'lucide-react';
import { ProtectedRoute } from '@/components/protected-route';
import { AdminCard } from '@/components/admin/admin-card';
import { AdminShell } from '@/components/admin/admin-shell';
import { AdminError, AdminLoading } from '@/components/admin/admin-states';
import { Button } from '@/components/ui/button';
import { GovernanceAuditExplorer } from '@/components/admin-governance/audit-explorer';
import { listGovernanceAuditEvents, type GovernanceAuditEvent } from '@/lib/api/admin-governance-api-client';
import { exportAdminAuditEventsCsv } from '@/lib/api/admin-policy-api-client';
import { toast } from 'sonner';

function AuditLogsContent() {
  const [items, setItems] = React.useState<GovernanceAuditEvent[]>([]);
  const [search, setSearch] = React.useState('');
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState<string | null>(null);
  const [exporting, setExporting] = React.useState(false);

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

  async function exportAudit() {
    setExporting(true);
    try {
      const csv = await exportAdminAuditEventsCsv();
      const blob = new Blob([csv], { type: 'text/csv;charset=utf-8' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = 'admin-audit-events.csv';
      document.body.appendChild(link);
      link.click();
      link.remove();
      URL.revokeObjectURL(url);
      toast.success('Audit export downloaded.');
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Failed to export audit events.');
    } finally {
      setExporting(false);
    }
  }

  return (
    <AdminShell title="Audit Logs" description="Review platform events, role changes, approvals, and system activity.">
      {loading ? <AdminLoading cards={1} /> : null}
      {!loading && error ? <AdminError message={error} onRetry={() => void load()} /> : null}
      {!loading && !error ? (
        <AdminCard title="Audit Events" description="Recent high-value administrative and platform actions.">
          <div className="mb-4 flex justify-end">
            <Button size="sm" variant="outline" onClick={() => void exportAudit()} disabled={exporting}>
              <Download className="mr-2 h-4 w-4" />
              {exporting ? 'Exporting...' : 'Export CSV'}
            </Button>
          </div>
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