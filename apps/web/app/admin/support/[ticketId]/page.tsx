'use client';

import * as React from 'react';
import { useParams } from 'next/navigation';
import { ProtectedRoute } from '@/components/protected-route';
import { AdminShell } from '@/components/admin/admin-shell';
import { AdminCard } from '@/components/admin/admin-card';
import { AdminError, AdminLoading } from '@/components/admin/admin-states';
import { getSupportTicket } from '@/lib/api/support';
import { SupportTicketDetail } from '@/components/support/support-ticket-detail';
import type { SupportTicket } from '@/types/support';

function AdminSupportTicketContent() {
  const params = useParams<{ ticketId: string }>();
  const ticketId = params.ticketId;
  const [ticket, setTicket] = React.useState<SupportTicket | null>(null);
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState<string | null>(null);

  const load = React.useCallback(async () => {
    if (!ticketId) return;
    setLoading(true);
    setError(null);
    try {
      setTicket(await getSupportTicket(ticketId));
    } catch (loadError) {
      setError(loadError instanceof Error ? loadError.message : 'Failed to load support ticket.');
    } finally {
      setLoading(false);
    }
  }, [ticketId]);

  React.useEffect(() => {
    void load();
  }, [load]);

  return (
    <AdminShell title="Support Ticket Detail" description="Review and resolve support tickets.">
      {loading ? <AdminLoading cards={1} /> : null}
      {!loading && error ? <AdminError message={error} onRetry={() => void load()} /> : null}
      {!loading && !error && ticket ? (
        <AdminCard title={ticket.ticketNumber} description={ticket.subject}>
          <SupportTicketDetail initialTicket={ticket} isAdmin />
        </AdminCard>
      ) : null}
    </AdminShell>
  );
}

export default function AdminSupportTicketPage() {
  return (
    <ProtectedRoute allowedRoles={['ADMIN', 'SUPER_ADMIN']}>
      <AdminSupportTicketContent />
    </ProtectedRoute>
  );
}
