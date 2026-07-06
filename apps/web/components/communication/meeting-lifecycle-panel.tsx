"use client";

import { useMemo, useState } from 'react';
import { CalendarClock, Check, Download, ExternalLink, Pause, Play, RefreshCw, Trash2, Video, X } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Textarea } from '@/components/ui/textarea';
import { communicationApi, type CommunicationMeeting } from '@/lib/communicationApi';

type Props = {
  admin?: boolean;
  compact?: boolean;
  createdById?: string;
};

export function MeetingLifecyclePanel({ admin = false, compact = false, createdById = 'admin-demo-id' }: Props) {
  const [meetings, setMeetings] = useState<CommunicationMeeting[]>([]);
  const [selectedMeetingId, setSelectedMeetingId] = useState('');
  const [kind, setKind] = useState<CommunicationMeeting['kind']>('RZOOMA_VIDEO');
  const [title, setTitle] = useState('R-Zooma Research Meeting');
  const [startsAt, setStartsAt] = useState(defaultStartsAt());
  const [endsAt, setEndsAt] = useState(defaultEndsAt());
  const [agenda, setAgenda] = useState('Review research status, approvals, datasets, and next actions.');
  const [invitees, setInvitees] = useState('');
  const [status, setStatus] = useState('Meeting lifecycle ready.');
  const [loading, setLoading] = useState(false);

  const selected = useMemo(() => meetings.find((meeting) => meeting.id === selectedMeetingId) ?? meetings[0] ?? null, [meetings, selectedMeetingId]);

  async function refresh() {
    setStatus('Meeting lifecycle synced.');
  }

  async function schedule() {
    if (!title.trim()) return setStatus('Enter a meeting title.');
    setLoading(true);
    try {
      const meeting = await communicationApi.scheduleMeeting({
        title: title.trim(),
        kind,
        createdById,
        startTime: new Date(startsAt).toISOString(),
        endTime: endsAt ? new Date(endsAt).toISOString() : new Date(Date.now() + 60 * 60 * 1000).toISOString(),
        agenda: agenda.trim(),
        inviteeIds: invitees.split(',').map((item) => item.trim()).filter(Boolean),
      });
      setMeetings((current) => [meeting, ...current.filter((item) => item.id !== meeting.id)]);
      setSelectedMeetingId(meeting.id);
      setInvitees('');
      setStatus('Meeting scheduled and invitations recorded.');
    } catch (error: unknown) {
      setStatus(error instanceof Error ? error.message : 'Unable to schedule meeting.');
    } finally {
      setLoading(false);
    }
  }

  async function run(action: () => Promise<CommunicationMeeting>, message: string) {
    setLoading(true);
    try {
      const meeting = await action();
      setMeetings((current) => [meeting, ...current.filter((item) => item.id !== meeting.id)]);
      setSelectedMeetingId(meeting.id);
      setStatus(message);
    } catch (error: unknown) {
      setStatus(error instanceof Error ? error.message : 'Meeting action failed.');
    } finally {
      setLoading(false);
    }
  }

  async function manage(action: 'PAUSE' | 'END' | 'CANCEL') {
    if (!selected) return;
    return run(() => communicationApi.manageMeeting(selected.id, action, { id: createdById, role: admin ? 'ADMIN' : 'USER' }), `${action} applied.`);
  }

  async function accept() {
    if (!selected) return;
    return run(async () => { await communicationApi.respondInvite(selected.id, { userId: createdById, status: 'ACCEPTED' }); return selected; }, 'Invitation accepted.');
  }

  async function decline() {
    if (!selected) return;
    return run(async () => { await communicationApi.respondInvite(selected.id, { userId: createdById, status: 'DECLINED' }); return selected; }, 'Invitation declined.');
  }

  return (
    <Card className={compact ? 'rounded-[2rem] border-0 shadow-sm' : 'rounded-[2rem] border-violet-200 shadow-sm'}>
      <CardHeader className="gap-2">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div>
            <CardTitle className="flex items-center gap-2"><CalendarClock className="h-5 w-5 text-violet-600" />Meeting Lifecycle</CardTitle>
            <CardDescription>Schedule R-Meet call/voice sessions and R-Zooma Video meetings, manage invitations, sync calendar files, and audit activity.</CardDescription>
          </div>
          <Button variant="outline" onClick={refresh} disabled={loading}><RefreshCw className="mr-2 h-4 w-4" />Refresh</Button>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid gap-3 md:grid-cols-2">
          <button onClick={() => { setKind('RMEET_AUDIO'); setTitle('R-Meet Research Call'); }} className={`rounded-2xl border p-4 text-left transition ${kind === 'RMEET_AUDIO' ? 'border-orange-500 bg-orange-50' : 'bg-white hover:bg-slate-50'}`}>
            <p className="font-black">R-Meet (Call/Voice)</p>
            <p className="mt-1 text-sm text-slate-600">Voice and call meeting flow for registered users.</p>
          </button>
          <button onClick={() => { setKind('RZOOMA_VIDEO'); setTitle('R-Zooma Research Meeting'); }} className={`rounded-2xl border p-4 text-left transition ${kind === 'RZOOMA_VIDEO' ? 'border-violet-500 bg-violet-50' : 'bg-white hover:bg-slate-50'}`}>
            <p className="font-black">R-Zooma Video</p>
            <p className="mt-1 text-sm text-slate-600">Video room with email invitations, AI notes, and calendar ICS.</p>
          </button>
        </div>

        <div className="grid gap-3 lg:grid-cols-5">
          <Input value={title} onChange={(event) => setTitle(event.target.value)} placeholder="Meeting title" className="lg:col-span-2" />
          <Input type="datetime-local" value={startsAt} onChange={(event) => setStartsAt(event.target.value)} />
          <Input type="datetime-local" value={endsAt} onChange={(event) => setEndsAt(event.target.value)} />
          <Button onClick={schedule} disabled={loading}><Video className="mr-2 h-4 w-4" />Schedule</Button>
        </div>
        <div className="grid gap-3 lg:grid-cols-2">
          <Textarea value={agenda} onChange={(event) => setAgenda(event.target.value)} rows={3} placeholder="Agenda" />
          <Textarea value={invitees} onChange={(event) => setInvitees(event.target.value)} rows={3} placeholder="Invitee user IDs, comma-separated" />
        </div>

        <div className="grid gap-4 xl:grid-cols-2">
          <ScrollArea className="h-90 rounded-xl border bg-white p-3">
            <div className="space-y-3">
              {meetings.map((meeting) => (
                <button key={meeting.id} onClick={() => setSelectedMeetingId(meeting.id)} className={`w-full rounded-xl border p-3 text-left transition ${selected?.id === meeting.id ? 'border-violet-500 bg-violet-50' : 'hover:bg-slate-50'}`}>
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <div className="font-semibold">{meeting.title}</div>
                      <div className="mt-1 text-xs text-slate-500">{new Date(meeting.startTime).toLocaleString()}</div>
                    </div>
                    <Badge className={statusClass(meeting.status ?? 'SCHEDULED')}>{meeting.status ?? 'SCHEDULED'}</Badge>
                  </div>
                  <div className="mt-2 flex flex-wrap gap-2 text-xs text-slate-600">
                    <span>{meeting.participantCount ?? meeting.invitations?.length ?? 0} participant(s)</span>
                    {meeting.status === 'READY' && <span className="font-semibold text-emerald-700">Ready to open</span>}
                    {meeting.status === 'LIVE' && <span className="font-semibold text-violet-700">Live call</span>}
                  </div>
                </button>
              ))}
              {!meetings.length ? <div className="rounded-xl border border-dashed p-6 text-center text-sm text-slate-500">No meetings scheduled yet.</div> : null}
            </div>
          </ScrollArea>

          <div className="rounded-xl border bg-white p-4">
            {selected ? (
              <div className="space-y-4">
                <div>
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <h3 className="text-lg font-semibold">{selected.title}</h3>
                    <Badge className={statusClass(selected.status ?? 'SCHEDULED')}>{selected.status ?? 'SCHEDULED'}</Badge>
                  </div>
                  <p className="mt-1 text-sm text-slate-600">{selected.agenda || 'No agenda provided.'}</p>
                </div>
                <div className="grid gap-2 text-sm md:grid-cols-2">
                  <Info label="Starts" value={new Date(selected.startTime).toLocaleString()} />
                  <Info label="Ends" value={new Date(selected.endTime).toLocaleString()} />
                  <Info label="Kind" value={selected.kind} />
                  <Info label="Room" value={selected.roomSlug ?? 'Pending'} />
                </div>
                <div className="flex flex-wrap gap-2">
                  <Button variant="outline" onClick={accept} disabled={loading}><Check className="mr-2 h-4 w-4" />Accept</Button>
                  <Button variant="outline" onClick={decline} disabled={loading}><X className="mr-2 h-4 w-4" />Decline</Button>
                  <Button onClick={() => run(() => communicationApi.startMeeting(selected.id, { id: createdById, role: admin ? 'ADMIN' : 'USER' }), 'Meeting started.')} disabled={loading}><Play className="mr-2 h-4 w-4" />Start</Button>
                  <Button variant="outline" onClick={() => window.open(`/communication/join/${selected.roomSlug ?? selected.id}`, '_blank')}><ExternalLink className="mr-2 h-4 w-4" />Open R-Zooma</Button>
                  <Button variant="outline" onClick={() => window.open(communicationApi.meetingCalendarUrl(selected.id), '_blank')}><Download className="mr-2 h-4 w-4" />ICS</Button>
                  <Button variant="outline" onClick={() => manage('PAUSE')} disabled={loading}><Pause className="mr-2 h-4 w-4" />Pause</Button>
                  <Button variant="destructive" onClick={() => manage('CANCEL')} disabled={loading}>Cancel</Button>
                </div>
                <div>
                  <h4 className="mb-2 font-semibold">Invitations</h4>
                  <ScrollArea className="h-35 rounded-lg border p-2">
                    <div className="space-y-2">
                      {(selected.invitations ?? []).map((invite) => (
                        <div key={`${invite.meetingId}-${invite.userId}`} className="flex items-center justify-between gap-2 rounded-lg bg-slate-50 p-2 text-xs">
                          <div>
                            <div className="font-semibold">{invite.userId}</div>
                            <div className="text-slate-500">{invite.status}</div>
                          </div>
                          {admin ? <Button size="icon-xs" variant="ghost" onClick={() => manage('END')}><Trash2 className="h-3 w-3" /></Button> : null}
                        </div>
                      ))}
                      {!selected.invitations?.length ? <div className="text-sm text-slate-500">No invitations yet.</div> : null}
                    </div>
                  </ScrollArea>
                </div>
              </div>
            ) : (
              <div className="flex h-full min-h-65 items-center justify-center rounded-xl border border-dashed text-sm text-slate-500">Select or schedule a meeting.</div>
            )}
          </div>
        </div>
        <div className="rounded-xl border bg-slate-50 p-3 text-sm text-slate-700">{status}</div>
      </CardContent>
    </Card>
  );
}

function Info({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-lg border bg-slate-50 p-2">
      <div className="text-xs uppercase tracking-wide text-slate-500">{label}</div>
      <div className="mt-1 font-medium text-slate-800">{value}</div>
    </div>
  );
}

function statusClass(status: string) {
  if (status === 'LIVE') return 'bg-emerald-100 text-emerald-700';
  if (status === 'CANCELLED') return 'bg-red-100 text-red-700';
  if (status === 'PAUSED') return 'bg-amber-100 text-amber-700';
  if (status === 'READY') return 'bg-sky-100 text-sky-700';
  return 'bg-violet-100 text-violet-700';
}

function defaultStartsAt() {
  const date = new Date(Date.now() + 15 * 60 * 1000);
  return toLocalInput(date);
}

function defaultEndsAt() {
  const date = new Date(Date.now() + 45 * 60 * 1000);
  return toLocalInput(date);
}

function toLocalInput(date: Date) {
  const pad = (value: number) => String(value).padStart(2, '0');
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}T${pad(date.getHours())}:${pad(date.getMinutes())}`;
}

