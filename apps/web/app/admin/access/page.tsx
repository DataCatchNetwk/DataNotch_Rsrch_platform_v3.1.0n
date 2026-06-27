'use client';

import * as React from 'react';
import { ProtectedRoute } from '@/components/protected-route';
import { AdminCard } from '@/components/admin/admin-card';
import { AdminShell } from '@/components/admin/admin-shell';
import { AdminError, AdminLoading } from '@/components/admin/admin-states';
import { GovernanceAccessRequestQueue } from '@/components/admin-governance/access-request-queue';
import { toast } from 'sonner';
import { getAccessSummary, type AccessSummary } from '@/lib/api/admin-api-client';
import {
  approveGovernanceAccessRequest,
  listGovernanceAccessRequests,
  rejectGovernanceAccessRequest,
  type GovernanceAccessRequest,
} from '@/lib/api/admin-governance-api-client';

function AccessGovernanceContent() {
  const [summary, setSummary] = React.useState<AccessSummary | null>(null);
  const [requests, setRequests] = React.useState<GovernanceAccessRequest[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState<string | null>(null);
  const [pendingRequestId, setPendingRequestId] = React.useState<string | null>(null);

  const load = React.useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const [summaryData, requestData] = await Promise.all([getAccessSummary(), listGovernanceAccessRequests()]);
      setSummary(summaryData);
      setRequests(requestData);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load access summary.');
    } finally {
      setLoading(false);
    }
  }, []);

  React.useEffect(() => {
    void load();
  }, [load]);

  async function approve(requestId: string) {
    setPendingRequestId(requestId);
    try {
      const updated = await approveGovernanceAccessRequest(requestId);
      setRequests((current) => current.map((item) => (item.id === requestId ? updated : item)));
      toast.success('Access request approved.');
      await load();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Failed to approve access request.');
    } finally {
      setPendingRequestId(null);
    }
  }

  async function reject(requestId: string) {
    setPendingRequestId(requestId);
    try {
      const updated = await rejectGovernanceAccessRequest(requestId);
      setRequests((current) => current.map((item) => (item.id === requestId ? updated : item)));
      toast.success('Access request rejected.');
      await load();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Failed to reject access request.');
    } finally {
      setPendingRequestId(null);
    }
  }

  return (
    <AdminShell title="Access Governance" description="Review access posture and permission allocation across the platform.">
      {loading ? <AdminLoading cards={2} /> : null}
      {!loading && error ? <AdminError message={error} onRetry={() => void load()} /> : null}
      {!loading && !error && summary ? (
        <div className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
            {[
              ['Total Admins', summary.totalAdmins],
              ['Total Reviewers', summary.totalReviewers],
              ['Suspended Users', summary.totalSuspendedUsers],
              ['Pending Access Requests', summary.pendingAccessRequests],
            ].map(([label, value]) => (
              <AdminCard key={String(label)} title={String(label)}>
                <p className="text-3xl font-semibold tracking-tight">{value}</p>
              </AdminCard>
            ))}
          </div>

          <AdminCard title="Access Requests" description="Database-backed governance requests awaiting review.">
            <GovernanceAccessRequestQueue
              items={requests}
              pendingRequestId={pendingRequestId}
              onApprove={(id) => void approve(id)}
              onReject={(id) => void reject(id)}
            />
          </AdminCard>
        </div>
      ) : null}
    </AdminShell>
  );
}

export default function AccessGovernancePage() {
  return (
    <ProtectedRoute allowedRoles={['ADMIN', 'SUPER_ADMIN']}>
      <AccessGovernanceContent />
    </ProtectedRoute>
  );
}