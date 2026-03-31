'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { listMySupportTickets } from '@/lib/api/support';
import type { SupportTicket } from '@/types/support';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

export function MySupportTickets() {
  const [tickets, setTickets] = useState<SupportTicket[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let active = true;

    const loadTickets = async () => {
      try {
        const response = await listMySupportTickets();
        if (active) setTickets(response);
      } catch (loadError) {
        if (active) {
          setError(loadError instanceof Error ? loadError.message : 'Unable to load tickets.');
        }
      } finally {
        if (active) setLoading(false);
      }
    };

    void loadTickets();

    return () => {
      active = false;
    };
  }, []);

  return (
    <Card className="rounded-2xl shadow-sm">
      <CardHeader>
        <CardTitle>My Support Tickets</CardTitle>
      </CardHeader>
      <CardContent>
        {loading ? <p className="text-sm text-slate-600">Loading tickets...</p> : null}
        {error ? <p className="text-sm text-red-600">{error}</p> : null}
        {!loading && !error && tickets.length === 0 ? (
          <p className="text-sm text-slate-600">No support tickets yet.</p>
        ) : null}

        {!loading && !error && tickets.length > 0 ? (
          <div className="space-y-3">
            {tickets.map((ticket) => (
              <div key={ticket.id} className="rounded-xl border p-3">
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <p className="text-sm font-semibold text-slate-900">{ticket.ticketNumber}</p>
                    <p className="text-sm text-slate-800">{ticket.subject}</p>
                    <p className="mt-1 text-xs text-slate-600">{ticket.category} · {ticket.priority} · {ticket.status}</p>
                    {ticket.attachmentUrl ? (
                      <a href={ticket.attachmentUrl} target="_blank" rel="noreferrer" className="mt-1 inline-block text-xs text-cyan-700 hover:underline">
                        Attachment: {ticket.attachmentName ?? 'view file'}
                      </a>
                    ) : null}
                  </div>
                  <div className="text-right">
                    <p className="text-xs text-slate-500">{new Date(ticket.createdAt).toLocaleString()}</p>
                    <Link href={`/dashboard/support/${ticket.id}`} className="text-xs text-cyan-700 hover:underline">
                      Open ticket
                    </Link>
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : null}
      </CardContent>
    </Card>
  );
}
