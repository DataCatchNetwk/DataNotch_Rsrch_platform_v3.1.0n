'use client';

import * as React from 'react';
import { useParams } from 'next/navigation';
import { getSupportTicket } from '@/lib/api/support';
import { SupportTicketDetail } from '@/components/support/support-ticket-detail';
import type { SupportTicket } from '@/types/support';

export default function DashboardSupportTicketPage() {
  const params = useParams<{ ticketId: string }>();
  const ticketId = params.ticketId;
  const [ticket, setTicket] = React.useState<SupportTicket | null>(null);
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState<string | null>(null);

  React.useEffect(() => {
    let active = true;

    const load = async () => {
      if (!ticketId) return;
      setLoading(true);
      setError(null);
      try {
        const detail = await getSupportTicket(ticketId);
        if (active) setTicket(detail);
      } catch (loadError) {
        if (active) {
          setError(loadError instanceof Error ? loadError.message : 'Failed to load support ticket.');
        }
      } finally {
        if (active) setLoading(false);
      }
    };

    void load();

    return () => {
      active = false;
    };
  }, [ticketId]);

  if (loading) return <div className="p-6 text-sm text-slate-600">Loading ticket...</div>;
  if (error) return <div className="p-6 text-sm text-red-600">{error}</div>;
  if (!ticket) return <div className="p-6 text-sm text-slate-600">Ticket not found.</div>;

  return (
    <div className="p-4 sm:p-6">
      <SupportTicketDetail initialTicket={ticket} />
    </div>
  );
}
