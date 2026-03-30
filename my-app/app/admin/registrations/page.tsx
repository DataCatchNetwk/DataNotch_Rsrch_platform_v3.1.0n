'use client';

import * as React from 'react';
import { CheckCircle2, XCircle } from 'lucide-react';
import { ProtectedRoute } from '@/components/protected-route';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { AdminCard } from '@/components/admin/admin-card';
import { AdminShell } from '@/components/admin/admin-shell';
import { AdminError, AdminLoading } from '@/components/admin/admin-states';
import { approveRegistration, getRegistrationRequests, rejectRegistration, type RegistrationRequest } from '@/lib/api/admin-api-client';
import { toast } from 'sonner';

function RegistrationsContent() {
  const [items, setItems] = React.useState<RegistrationRequest[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState<string | null>(null);
  const [pendingRequestId, setPendingRequestId] = React.useState<string | null>(null);

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

  async function approve(id: string) {
    setPendingRequestId(id);
    try {
      const updated = await approveRegistration(id);
      setItems((current) => current.map((item) => (item.id === id ? updated : item)));
      toast.success('Registration approved.');
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Failed to approve registration.');
    } finally {
      setPendingRequestId(null);
    }
  }

  async function reject(id: string) {
    setPendingRequestId(id);
    try {
      const updated = await rejectRegistration(id);
      setItems((current) => current.map((item) => (item.id === id ? updated : item)));
      toast.success('Registration rejected.');
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
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {items.map((item) => (
                  <TableRow key={item.id}>
                    <TableCell className="font-medium">{item.fullName}</TableCell>
                    <TableCell>{item.email}</TableCell>
                    <TableCell>{item.institution}</TableCell>
                    <TableCell>{item.requestedRole}</TableCell>
                    <TableCell>{item.submittedAt}</TableCell>
                    <TableCell><Badge variant="secondary">{item.status}</Badge></TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-2">
                        <Button size="sm" disabled={item.status !== 'PENDING' || pendingRequestId === item.id} onClick={() => void approve(item.id)}>
                          <CheckCircle2 className="mr-2 h-4 w-4" />
                          Approve
                        </Button>
                        <Button size="sm" variant="outline" disabled={item.status !== 'PENDING' || pendingRequestId === item.id} onClick={() => void reject(item.id)}>
                          <XCircle className="mr-2 h-4 w-4" />
                          Reject
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
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
