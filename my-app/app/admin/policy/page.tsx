'use client';

import { useState } from 'react';
import { Download, ShieldCheck } from 'lucide-react';
import { ProtectedRoute } from '@/components/protected-route';
import { AdminCard } from '@/components/admin/admin-card';
import { AdminShell } from '@/components/admin/admin-shell';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';
import { exportAdminAuditEventsCsv } from '@/lib/api/admin-policy-api-client';

const POLICY_MATRIX = [
  { role: 'ADMIN', permissions: ['view_users', 'update_user_status', 'approve_access_request', 'reject_access_request', 'bulk_suspend_users', 'export_audit_events'] },
  { role: 'SUPER_ADMIN', permissions: ['view_users', 'update_user_status', 'update_user_role', 'bulk_update_roles', 'assign_admin_role', 'export_audit_events'] },
];

function AdminPolicyPageContent() {
  const [downloading, setDownloading] = useState(false);

  async function exportAudit() {
    setDownloading(true);
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
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Failed to export audit events.');
    } finally {
      setDownloading(false);
    }
  }

  return (
    <AdminShell
      title="Policy & Bulk Operations"
      description="Enforce permission matrix behavior for registration approvals, bulk role/status updates, and audit export."
    >
      <div className="space-y-4">
        <AdminCard title="Policy Matrix" description="Effective permission matrix used by admin-policy endpoints.">
          <div className="space-y-3">
            {POLICY_MATRIX.map((row) => (
              <div key={row.role} className="rounded-xl border bg-slate-50 p-4">
                <p className="text-sm font-semibold text-slate-900">{row.role}</p>
                <p className="mt-1 text-xs text-slate-600">{row.permissions.join(' | ')}</p>
              </div>
            ))}
          </div>
        </AdminCard>

        <AdminCard title="Audit Export" description="Export governance audit events as CSV for compliance reporting.">
          <Button onClick={() => void exportAudit()} disabled={downloading}>
            <Download className="mr-2 h-4 w-4" />
            {downloading ? 'Exporting...' : 'Export Audit Events'}
          </Button>
        </AdminCard>

        <AdminCard title="Approval Workflow Rule" description="Registration approval is required before dashboard access.">
          <div className="flex items-start gap-3 text-sm text-slate-700">
            <ShieldCheck className="mt-0.5 h-4 w-4 text-cyan-700" />
            <p>
              New users remain in PENDING_APPROVAL and are redirected to the pending screen. Approval transitions the
              account to ACTIVE. Rejection keeps the account blocked and records decision reasons in audit-linked
              decision records.
            </p>
          </div>
        </AdminCard>
      </div>
    </AdminShell>
  );
}

export default function AdminPolicyPage() {
  return (
    <ProtectedRoute allowedRoles={['ADMIN', 'SUPER_ADMIN']}>
      <AdminPolicyPageContent />
    </ProtectedRoute>
  );
}
