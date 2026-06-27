'use client';

import { useState } from 'react';
import { replyToSupportTicket, updateSupportTicket } from '@/lib/api/support';
import type { SupportTicket } from '@/types/support';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';

type SupportTicketDetailProps = {
  initialTicket: SupportTicket;
  isAdmin?: boolean;
};

export function SupportTicketDetail({ initialTicket, isAdmin = false }: SupportTicketDetailProps) {
  const [ticket, setTicket] = useState(initialTicket);
  const [message, setMessage] = useState('');
  const [attachment, setAttachment] = useState<File | null>(null);
  const [status, setStatus] = useState(ticket.status);
  const [priority, setPriority] = useState(ticket.priority);
  const [isInternal, setIsInternal] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function submitReply(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSaving(true);
    setError(null);

    try {
      const updated = await replyToSupportTicket(ticket.id, {
        message,
        isInternal: isAdmin ? isInternal : undefined,
        attachment,
      });
      setTicket(updated);
      setMessage('');
      setAttachment(null);
      setIsInternal(false);
    } catch (replyError) {
      setError(replyError instanceof Error ? replyError.message : 'Failed to send reply.');
    } finally {
      setSaving(false);
    }
  }

  async function saveAdminUpdates() {
    if (!isAdmin) return;
    setSaving(true);
    setError(null);

    try {
      const updated = await updateSupportTicket(ticket.id, {
        status,
        priority,
      });
      setTicket(updated);
    } catch (updateError) {
      setError(updateError instanceof Error ? updateError.message : 'Failed to update ticket.');
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>{ticket.ticketNumber}: {ticket.subject}</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3 text-sm text-slate-700">
          <p>{ticket.description}</p>
          <p>Requester: {ticket.requesterName || 'N/A'} ({ticket.requesterEmail})</p>
          <p>Category: {ticket.category} · Priority: {ticket.priority} · Status: {ticket.status}</p>
          {ticket.attachmentUrl ? (
            <a href={ticket.attachmentUrl} target="_blank" rel="noreferrer" className="text-cyan-700 hover:underline">
              Attachment: {ticket.attachmentName || 'view file'}
            </a>
          ) : null}
        </CardContent>
      </Card>

      {isAdmin ? (
        <Card>
          <CardHeader>
            <CardTitle>Admin Controls</CardTitle>
          </CardHeader>
          <CardContent className="grid gap-4 md:grid-cols-2">
            <Select value={status} onValueChange={(value) => setStatus(value as SupportTicket['status'])}>
              <SelectTrigger>
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="OPEN">OPEN</SelectItem>
                <SelectItem value="TRIAGED">TRIAGED</SelectItem>
                <SelectItem value="IN_PROGRESS">IN_PROGRESS</SelectItem>
                <SelectItem value="WAITING_FOR_USER">WAITING_FOR_USER</SelectItem>
                <SelectItem value="RESOLVED">RESOLVED</SelectItem>
                <SelectItem value="CLOSED">CLOSED</SelectItem>
                <SelectItem value="SPAM">SPAM</SelectItem>
              </SelectContent>
            </Select>

            <Select value={priority} onValueChange={(value) => setPriority(value as SupportTicket['priority'])}>
              <SelectTrigger>
                <SelectValue placeholder="Priority" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="LOW">LOW</SelectItem>
                <SelectItem value="MEDIUM">MEDIUM</SelectItem>
                <SelectItem value="HIGH">HIGH</SelectItem>
                <SelectItem value="CRITICAL">CRITICAL</SelectItem>
              </SelectContent>
            </Select>

            <div className="md:col-span-2">
              <Button type="button" onClick={saveAdminUpdates} disabled={saving}>Save Ticket Updates</Button>
            </div>
          </CardContent>
        </Card>
      ) : null}

      <Card>
        <CardHeader>
          <CardTitle>Conversation</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {(ticket.messages ?? []).map((item) => (
            <div key={item.id} className="rounded-lg border p-3">
              <div className="mb-1 flex items-center justify-between text-xs text-slate-500">
                <span>{item.authorType}</span>
                <span>{new Date(item.createdAt).toLocaleString()}</span>
              </div>
              <p className="text-sm text-slate-800">{item.body}</p>
              {item.attachmentUrl ? (
                <a href={item.attachmentUrl} target="_blank" rel="noreferrer" className="mt-1 inline-block text-xs text-cyan-700 hover:underline">
                  Attachment: {item.attachmentName || 'view file'}
                </a>
              ) : null}
            </div>
          ))}

          <form onSubmit={submitReply} className="space-y-3 rounded-lg border p-3">
            <Textarea value={message} onChange={(event) => setMessage(event.target.value)} placeholder="Write your reply" required />
            <Input type="file" onChange={(event) => setAttachment(event.target.files?.[0] ?? null)} />
            {isAdmin ? (
              <label className="flex items-center gap-2 text-sm text-slate-700">
                <input type="checkbox" checked={isInternal} onChange={(event) => setIsInternal(event.target.checked)} />
                Internal note (admin only)
              </label>
            ) : null}
            {error ? <p className="text-sm text-red-600">{error}</p> : null}
            <Button type="submit" disabled={saving}>{saving ? 'Sending...' : 'Send Reply'}</Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
