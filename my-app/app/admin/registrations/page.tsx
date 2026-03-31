'use client';

import * as React from 'react';
import { ProtectedRoute } from '@/components/protected-route';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { AdminCard } from '@/components/admin/admin-card';
import { AdminShell } from '@/components/admin/admin-shell';
import { AdminError, AdminLoading } from '@/components/admin/admin-states';
import { ApprovalActionPanel } from '@/components/admin-policy/approval-action-panel';
import { getRegistrationRequests, type RegistrationRequest } from '@/lib/api/admin-api-client';
import { approveRegistrationPolicy, rejectRegistrationPolicy } from '@/lib/api/admin-policy-api-client';
import { toast } from 'sonner';
import { useAuth } from '@/lib/auth-context';

function RegistrationsContent() {
  const { user } = useAuth();
  const canAssignRole = user?.roles.includes('SUPER_ADMIN') ?? false;
  const [items, setItems] = React.useState<RegistrationRequest[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState<string | null>(null);
  const [pendingRequestId, setPendingRequestId] = React.useState<string | null>(null);
  const [activePanelRequestId, setActivePanelRequestId] = React.useState<string | null>(null);

  const load = React.useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      setItems(await getRegistrationRequests());
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load registration requests.');
    } finally {
      setLoading(false);
    }
  }, []);

  React.useEffect(() => {
    void load();
  }, [load]);

  async function approve(id: string, reason: string, assignRole?: string) {
    setPendingRequestId(id);
    try {
      await approveRegistrationPolicy(id, reason, assignRole as 'USER' | 'REVIEWER' | 'STAFF' | 'ADMIN' | 'SUPER_ADMIN' | undefined);
      toast.success('Registration approved.');
      setActivePanelRequestId(null);
      await load();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Failed to approve registration.');
    } finally {
      setPendingRequestId(null);
    }
  }

  async function reject(id: string, reason: string) {
    setPendingRequestId(id);
    try {
      await rejectRegistrationPolicy(id, reason);
      toast.success('Registration rejected.');
      setActivePanelRequestId(null);
      await load();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Failed to reject registration.');
    } finally {
      setPendingRequestId(null);
    }
  }

  return (
    <AdminShell title="Registration Queue" description="Review pending platform access requests.">
      {loading ? <AdminLoading cards={1} /> : null}
      {!loading && error ? <AdminError message={error} onRetry={() => void load()} /> : null}
      {!loading && !error ? (
        <AdminCard title="Pending Registrations" description="Approve or reject new access requests.">
          <div className="overflow-x-auto rounded-2xl border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Name</TableHead>
                  <TableHead>Email</TableHead>
                  <TableHead>Institution</TableHead>
                  <TableHead>Requested Role</TableHead>
                  <TableHead>Submitted</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Decision Reason</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {items.map((item) => (
                  <React.Fragment key={item.id}>
                  <TableRow>
                    <TableCell className="font-medium">{item.fullName}</TableCell>
                    <TableCell>{item.email}</TableCell>
                    <TableCell>{item.institution}</TableCell>
                    <TableCell>{item.requestedRole}</TableCell>
                    <TableCell>{item.submittedAt}</TableCell>
                    <TableCell><Badge variant="secondary">{item.status}</Badge></TableCell>
                    <TableCell className="max-w-xs truncate text-xs text-slate-600">{item.decisionReason ?? '—'}</TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-2">
                        <Button
                          size="sm"
                          variant={activePanelRequestId === item.id ? 'secondary' : 'outline'}
                          disabled={item.status !== 'PENDING' || pendingRequestId === item.id}
                          onClick={() => setActivePanelRequestId((current) => (current === item.id ? null : item.id))}
                        >
                          Review
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                  {activePanelRequestId === item.id ? (
                    <TableRow>
                      <TableCell colSpan={8}>
                        <ApprovalActionPanel
                          pending={pendingRequestId === item.id}
                          canAssignRole={canAssignRole}
                          onApprove={(reason, assignRole) => void approve(item.id, reason, assignRole)}
                          onReject={(reason) => void reject(item.id, reason)}
                        />
                      </TableCell>
                    </TableRow>
                  ) : null}
                  </React.Fragment>
                ))}
              </TableBody>
            </Table>
          </div>
        </AdminCard>
      ) : null}
    </AdminShell>
  );
}

export default function RegistrationsPage() {
  return (
    <ProtectedRoute allowedRoles={['ADMIN', 'SUPER_ADMIN']}>
      <RegistrationsContent />
    </ProtectedRoute>
  );
}
