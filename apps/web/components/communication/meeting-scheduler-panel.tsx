'use client';

import { useEffect, useMemo, useState } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import {
  CalendarCheck,
  CalendarClock,
  CalendarPlus,
  CheckCircle2,
  Clock3,
  Headphones,
  ListChecks,
  RefreshCw,
  Users,
  Video,
} from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import {
  cancelCommunicationMeeting,
  listCommunicationMeetings,
  scheduleCommunicationMeeting,
  updateCommunicationMeeting,
  type CommunicationMeeting,
} from '@/lib/api/communication';

type ScheduleMode = 'RMEET_AUDIO' | 'RZOOMA_VIDEO';

type AvailabilitySlot = {
  id: string;
  label: string;
  startOffsetMinutes: number;
  durationMinutes: number;
  status: 'AVAILABLE' | 'HOLD' | 'BOOKED';
};

const AVAILABILITY_SLOTS: AvailabilitySlot[] = [
  { id: 'morning', label: 'Morning discussion window', startOffsetMinutes: 30, durationMinutes: 30, status: 'AVAILABLE' },
  { id: 'midday', label: 'Midday research review', startOffsetMinutes: 120, durationMinutes: 45, status: 'AVAILABLE' },
  { id: 'afternoon', label: 'Afternoon stakeholder call', startOffsetMinutes: 240, durationMinutes: 60, status: 'HOLD' },
  { id: 'evening', label: 'Evening R-Zooma room', startOffsetMinutes: 420, durationMinutes: 60, status: 'AVAILABLE' },
];

export function MeetingSchedulerPanel() {
  const router = useRouter();
  const pathname = usePathname();
  const [mode, setMode] = useState<ScheduleMode>('RMEET_AUDIO');
  const [title, setTitle] = useState('Research Discussion Booking');
  const [discussionPurpose, setDiscussionPurpose] = useState('Dataset review, analysis planning, and decision follow-up.');
  const [agenda, setAgenda] = useState('1. Confirm discussion topic\n2. Review available evidence\n3. Assign next actions');
  const [invitees, setInvitees] = useState('');
  const [selectedSlotId, setSelectedSlotId] = useState('morning');
  const [startsAt, setStartsAt] = useState(toLocalInput(new Date(Date.now() + 30 * 60 * 1000)));
  const [endsAt, setEndsAt] = useState(toLocalInput(new Date(Date.now() + 60 * 60 * 1000)));
  const [meetings, setMeetings] = useState<CommunicationMeeting[]>([]);
  const [message, setMessage] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [editingRoomId, setEditingRoomId] = useState<string | null>(null);

  const selectedSlot = useMemo(
    () => AVAILABILITY_SLOTS.find((slot) => slot.id === selectedSlotId) ?? AVAILABILITY_SLOTS[0],
    [selectedSlotId],
  );

  const upcomingMeetings = useMemo(
    () => meetings
      .filter((meeting) => ['SCHEDULED', 'READY', 'LIVE'].includes(meeting.metadata.status))
      .sort((a, b) => new Date(a.metadata.startsAt).getTime() - new Date(b.metadata.startsAt).getTime())
      .slice(0, 5),
    [meetings],
  );

  useEffect(() => {
    void refreshMeetings();
  }, []);

  function applySlot(slot: AvailabilitySlot) {
    setSelectedSlotId(slot.id);
    const start = new Date(Date.now() + slot.startOffsetMinutes * 60 * 1000);
    const end = new Date(start.getTime() + slot.durationMinutes * 60 * 1000);
    setStartsAt(toLocalInput(start));
    setEndsAt(toLocalInput(end));
    setMessage(`${slot.label} selected. Availability status: ${slot.status.toLowerCase()}.`);
  }

  async function refreshMeetings() {
    try {
      const items = await listCommunicationMeetings();
      setMeetings(items);
      setMessage('Schedule and booking availability refreshed.');
    } catch {
      setMessage('Unable to refresh schedule right now. You can still prepare a booking.');
    }
  }

  async function scheduleMeeting() {
    if (!title.trim()) {
      setMessage('Enter a booking title before scheduling.');
      return;
    }

    setLoading(true);
    try {
      const inviteeIds = invitees
        .split(',')
        .map((value) => value.trim())
        .filter(Boolean);

      const payload = {
        title: title.trim(),
        description: `${mode === 'RMEET_AUDIO' ? 'R-Meet call/voice booking' : 'R-Zooma video meeting'} - ${discussionPurpose.trim()}`,
        agenda: agenda.trim(),
        startsAt: new Date(startsAt).toISOString(),
        endsAt: endsAt ? new Date(endsAt).toISOString() : undefined,
        inviteeIds,
        autoOpenWindow: mode === 'RZOOMA_VIDEO',
        assetType: mode,
        assetTitle: selectedSlot.label,
      };

      const meeting = editingRoomId
        ? await updateCommunicationMeeting(editingRoomId, payload)
        : await scheduleCommunicationMeeting(payload);

      setMeetings((current) => [meeting, ...current.filter((item) => item.room.id !== meeting.room.id)]);
      setMessage(editingRoomId ? 'Booking updated successfully.' : `${mode === 'RMEET_AUDIO' ? 'R-Meet call/voice discussion' : 'R-Zooma meeting'} booked and invitations sent.`);
      setEditingRoomId(null);
    } catch (error: unknown) {
      const messageText = error instanceof Error ? error.message : undefined;
      setMessage(messageText ?? 'Could not schedule the booking. Check backend API.');
    } finally {
      setLoading(false);
    }
  }

  function editMeeting(meeting: CommunicationMeeting) {
    setEditingRoomId(meeting.room.id);
    setTitle(meeting.metadata.title || 'Research Discussion Booking');
    setDiscussionPurpose(meeting.metadata.description || 'Dataset review, analysis planning, and decision follow-up.');
    setAgenda(meeting.metadata.agenda || '1. Confirm discussion topic\n2. Review available evidence\n3. Assign next actions');
    setStartsAt(toLocalInput(new Date(meeting.metadata.startsAt)));
    setEndsAt(meeting.metadata.endsAt ? toLocalInput(new Date(meeting.metadata.endsAt)) : '');
    setMode(meeting.metadata.assetType === 'RZOOMA_VIDEO' ? 'RZOOMA_VIDEO' : 'RMEET_AUDIO');
    setMessage(`Editing booking: ${meeting.metadata.title}`);
  }

  async function cancelMeeting(roomId: string) {
    setLoading(true);
    try {
      const updated = await cancelCommunicationMeeting(roomId);
      setMeetings((current) => [updated, ...current.filter((item) => item.room.id !== updated.room.id)]);
      if (editingRoomId === roomId) {
        setEditingRoomId(null);
      }
      setMessage('Booking cancelled.');
    } catch (error: unknown) {
      const messageText = error instanceof Error ? error.message : undefined;
      setMessage(messageText ?? 'Unable to cancel booking.');
    } finally {
      setLoading(false);
    }
  }

  function openMeeting(meeting: CommunicationMeeting, pane: 'scheduler' | 'rzooma') {
    const isUserWorkspace = pathname.startsWith('/dashboard');
    if (isUserWorkspace) {
      const query = pane === 'rzooma' ? '?mode=video&pane=rzooma' : '?pane=scheduler';
      router.push(`/dashboard/communication/rzooma/${meeting.room.id}${query}`);
      return;
    }

    const query = pane === 'rzooma' ? '?mode=video&pane=rzooma' : '?pane=scheduler';
    router.push(`/admin/communication/${meeting.room.id}${query}`);
  }

  return (
    <Card className="rounded-[2rem] border-0 shadow-sm">
      <CardHeader className="gap-2">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <CardTitle className="flex items-center gap-2 text-xl">
              <CalendarPlus className="h-5 w-5 text-emerald-600" /> R-Meet Schedule Panel
            </CardTitle>
            <CardDescription>
              Book R-Meet call/voice discussions, schedule R-Zooma video meetings, track availability, and prepare agenda items for each discussion.
            </CardDescription>
          </div>
          <Button variant="outline" onClick={refreshMeetings} disabled={loading} className="rounded-2xl">
            <RefreshCw className="mr-2 h-4 w-4" /> Refresh Availability
          </Button>
        </div>
      </CardHeader>
      <CardContent className="space-y-5">
        <div className="grid gap-3 lg:grid-cols-2">
          <button
            type="button"
            onClick={() => {
              setMode('RMEET_AUDIO');
              setTitle('R-Meet Research Discussion');
            }}
            className={`rounded-3xl border p-5 text-left transition ${mode === 'RMEET_AUDIO' ? 'border-emerald-500 bg-emerald-50 shadow-sm' : 'bg-white hover:bg-slate-50'}`}
          >
            <Headphones className="mb-3 h-7 w-7 text-emerald-600" />
            <p className="font-black">R-Meet (Call/Voice)</p>
            <p className="mt-1 text-sm leading-6 text-slate-600">Schedule call or voice bookings for research discussions, support follow-ups, reviews, and quick decision meetings.</p>
          </button>
          <button
            type="button"
            onClick={() => {
              setMode('RZOOMA_VIDEO');
              setTitle('R-Zooma Research Meeting');
            }}
            className={`rounded-3xl border p-5 text-left transition ${mode === 'RZOOMA_VIDEO' ? 'border-indigo-500 bg-indigo-50 shadow-sm' : 'bg-white hover:bg-slate-50'}`}
          >
            <Video className="mb-3 h-7 w-7 text-indigo-600" />
            <p className="font-black">R-Zooma Meeting</p>
            <p className="mt-1 text-sm leading-6 text-slate-600">Schedule video sessions with participants, calendar handoff, discussion notes, and meeting-room preparation.</p>
          </button>
        </div>

        <div className="grid gap-4 xl:grid-cols-[1.15fr_0.85fr]">
          <div className="rounded-3xl border bg-white p-4">
            <div className="mb-4 flex items-center gap-2">
              <CalendarClock className="h-5 w-5 text-slate-700" />
              <h3 className="font-black">Booking Details</h3>
            </div>
            <div className="grid gap-3 md:grid-cols-2">
              <Input value={title} onChange={(event) => setTitle(event.target.value)} placeholder="Meeting or discussion title" />
              <Input value={discussionPurpose} onChange={(event) => setDiscussionPurpose(event.target.value)} placeholder="Purpose of discussion" />
              <Input type="datetime-local" value={startsAt} onChange={(event) => setStartsAt(event.target.value)} />
              <Input type="datetime-local" value={endsAt} onChange={(event) => setEndsAt(event.target.value)} />
              <Input className="md:col-span-2" value={invitees} onChange={(event) => setInvitees(event.target.value)} placeholder="Invitee user IDs, comma-separated" />
              <Textarea className="md:col-span-2" value={agenda} onChange={(event) => setAgenda(event.target.value)} rows={4} placeholder="Discussion agenda, research asset, dataset, protocol, or publication notes" />
            </div>
          </div>

          <div className="rounded-3xl border bg-slate-50 p-4">
            <div className="mb-4 flex items-center justify-between gap-3">
              <div className="flex items-center gap-2">
                <ListChecks className="h-5 w-5 text-slate-700" />
                <h3 className="font-black">Availability Track</h3>
              </div>
              <Badge variant="outline" className="bg-white">{upcomingMeetings.length} upcoming</Badge>
            </div>
            <div className="space-y-2">
              {AVAILABILITY_SLOTS.map((slot) => (
                <button
                  key={slot.id}
                  type="button"
                  onClick={() => applySlot(slot)}
                  className={`w-full rounded-2xl border p-3 text-left transition ${selectedSlotId === slot.id ? 'border-emerald-500 bg-white shadow-sm' : 'bg-white/70 hover:bg-white'}`}
                >
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-sm font-bold text-slate-900">{slot.label}</span>
                    <span className={`rounded-full px-2 py-1 text-[11px] font-bold ${slot.status === 'AVAILABLE' ? 'bg-emerald-100 text-emerald-700' : slot.status === 'HOLD' ? 'bg-amber-100 text-amber-700' : 'bg-slate-200 text-slate-700'}`}>{slot.status}</span>
                  </div>
                  <p className="mt-1 text-xs text-slate-500">Starts in {slot.startOffsetMinutes} min - {slot.durationMinutes} min booking</p>
                </button>
              ))}
            </div>
          </div>
        </div>

        <div className="grid gap-4 lg:grid-cols-[1fr_0.9fr]">
          <div className="rounded-3xl border bg-white p-4">
            <div className="mb-4 flex items-center justify-between gap-3">
              <div className="flex items-center gap-2">
                <Users className="h-5 w-5 text-slate-700" />
                <h3 className="font-black">Scheduled Bookings</h3>
              </div>
              <Badge className="bg-emerald-100 text-emerald-700">{selectedSlot.status.toLowerCase()} slot</Badge>
            </div>
            <div className="space-y-2">
              {upcomingMeetings.map((meeting) => (
                <div key={meeting.room.id} className="rounded-2xl border bg-slate-50 p-3">
                  <div className="flex flex-wrap items-start justify-between gap-2">
                    <div>
                      <p className="font-bold text-slate-950">{meeting.metadata.title}</p>
                      <p className="mt-1 text-xs text-slate-500">{new Date(meeting.metadata.startsAt).toLocaleString()}</p>
                    </div>
                    <Badge className={meeting.metadata.status === 'LIVE' ? 'bg-emerald-100 text-emerald-700' : 'bg-slate-100 text-slate-700'}>{meeting.metadata.status}</Badge>
                  </div>
                  <p className="mt-2 text-xs text-slate-600">{meeting.metadata.assetType === 'RZOOMA_VIDEO' ? 'R-Zooma video meeting' : 'R-Meet call/voice discussion'}</p>
                  <div className="mt-3 flex flex-wrap gap-2">
                    <Button size="sm" className="rounded-xl bg-slate-900 text-white hover:bg-slate-800" onClick={() => openMeeting(meeting, 'rzooma')}>
                      <Video className="mr-2 h-3.5 w-3.5" /> Join R-Zooma
                    </Button>
                    <Button size="sm" variant="outline" className="rounded-xl" onClick={() => openMeeting(meeting, 'scheduler')}>
                      <CalendarClock className="mr-2 h-3.5 w-3.5" /> Open Scheduler
                    </Button>
                    <Button size="sm" variant="outline" className="rounded-xl" onClick={() => editMeeting(meeting)}>
                      Edit
                    </Button>
                    <Button size="sm" variant="outline" className="rounded-xl border-rose-300 text-rose-700 hover:bg-rose-50" onClick={() => void cancelMeeting(meeting.room.id)}>
                      Cancel
                    </Button>
                  </div>
                </div>
              ))}
              {!upcomingMeetings.length ? <p className="rounded-2xl border border-dashed p-4 text-sm text-slate-500">No active bookings yet. Create one from the schedule form.</p> : null}
            </div>
          </div>

          <div className="rounded-3xl border bg-white p-4">
            <div className="mb-4 flex items-center gap-2">
              <CheckCircle2 className="h-5 w-5 text-emerald-600" />
              <h3 className="font-black">Booking Controls</h3>
            </div>
            <div className="grid gap-2">
              <Button onClick={scheduleMeeting} disabled={loading} className="rounded-2xl bg-slate-950 text-white hover:bg-slate-800">
                <CalendarCheck className="mr-2 h-4 w-4" /> {editingRoomId ? 'Update Booking' : `Schedule ${mode === 'RMEET_AUDIO' ? 'R-Meet Call/Voice' : 'R-Zooma Meeting'}`}
              </Button>
              <Button type="button" variant="outline" onClick={() => applySlot(selectedSlot)} className="rounded-2xl">
                <Clock3 className="mr-2 h-4 w-4" /> Confirm Selected Availability
              </Button>
              {editingRoomId ? (
                <Button type="button" variant="outline" className="rounded-2xl" onClick={() => setEditingRoomId(null)}>
                  Clear Edit
                </Button>
              ) : null}
            </div>
            {message ? <p className="mt-4 rounded-2xl bg-slate-100 p-3 text-sm font-semibold text-slate-700">{message}</p> : null}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

function toLocalInput(date: Date) {
  const pad = (value: number) => String(value).padStart(2, '0');
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}T${pad(date.getHours())}:${pad(date.getMinutes())}`;
}
