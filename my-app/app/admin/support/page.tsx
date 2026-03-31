'use client';

import * as React from 'react';
import Link from 'next/link';
import { ProtectedRoute } from '@/components/protected-route';
import { AdminShell } from '@/components/admin/admin-shell';
import { AdminCard } from '@/components/admin/admin-card';
import { AdminError, AdminLoading } from '@/components/admin/admin-states';
import { listAdminSupportTickets } from '@/lib/api/support';
import type { SupportTicket } from '@/types/support';
import { Input } from '@/components/ui/input';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';

function AdminSupportQueueContent() {
  const [tickets, setTickets] = React.useState<SupportTicket[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState<string | null>(null);
  const [search, setSearch] = React.useState('');

  const load = React.useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      setTickets(await listAdminSupportTickets({ search: search || undefined }));
    } catch (loadError) {
      setError(loadError instanceof Error ? loadError.message : 'Failed to load support queue.');
    } finally {
      setLoading(false);
    }
  }, [search]);

  React.useEffect(() => {
    void load();
  }, [load]);

  return (
    <AdminShell title="Support Center" description="Manage support tickets, triage priority, and respond to users.">
      {loading ? <AdminLoading cards={1} /> : null}
      {!loading && error ? <AdminError message={error} onRetry={() => void load()} /> : null}
      {!loading && !error ? (
        <AdminCard title="Support Queue" description="Click a ticket to open detail workflow.">
          <div className="mb-4 max-w-sm">
            <Input value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Search by ticket number, subject, or email" />
          </div>
          <div className="overflow-x-auto rounded-2xl border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Ticket</TableHead>
                  <TableHead>Requester</TableHead>
                  <TableHead>Category</TableHead>
                  <TableHead>Priority</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Created</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {tickets.map((ticket) => (
                  <TableRow key={ticket.id}>
                    <TableCell>
                      <Link href={`/admin/support/${ticket.id}`} className="font-medium text-cyan-700 hover:underline">
                        {ticket.ticketNumber}
                      </Link>
                      <div className="text-xs text-slate-600">{ticket.subject}</div>
                    </TableCell>
                    <TableCell>{ticket.requesterEmail}</TableCell>
                    <TableCell>{ticket.category}</TableCell>
                    <TableCell>{ticket.priority}</TableCell>
                    <TableCell>{ticket.status}</TableCell>
                    <TableCell>{new Date(ticket.createdAt).toLocaleString()}</TableCell>
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

export default function AdminSupportQueuePage() {
  return (
    <ProtectedRoute allowedRoles={['ADMIN', 'SUPER_ADMIN']}>
      <AdminSupportQueueContent />
    </ProtectedRoute>
  );
}
