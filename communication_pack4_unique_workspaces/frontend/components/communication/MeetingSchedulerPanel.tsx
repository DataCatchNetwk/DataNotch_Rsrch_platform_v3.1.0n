'use client';

import { useState } from 'react';
import { CalendarPlus, Headphones, Video } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';

export function MeetingSchedulerPanel() {
  const [mode, setMode] = useState<'AUDIO' | 'VIDEO'>('VIDEO');
  const [title, setTitle] = useState('Research Review Meeting');
  const [message, setMessage] = useState<string | null>(null);

  async function scheduleMeeting() {
    const payload = {
      mode,
      title,
      startsAt: (document.getElementById('startsAt') as HTMLInputElement)?.value,
      endsAt: (document.getElementById('endsAt') as HTMLInputElement)?.value,
      agenda: (document.getElementById('agenda') as HTMLTextAreaElement)?.value,
      inviteeUserIds: ((document.getElementById('invitees') as HTMLInputElement)?.value || '').split(',').map(v => v.trim()).filter(Boolean),
      calendarSync: true,
      autoOpen: true,
    };

    const res = await fetch('/api/communication/meetings/schedule', {
      method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload),
    });
    setMessage(res.ok ? `${mode} meeting scheduled and invitations sent.` : 'Could not schedule meeting. Check backend API.');
  }

  return (
    <Card className="rounded-[2rem] border-0 shadow-sm">
      <CardHeader>
        <CardTitle className="flex items-center gap-2"><CalendarPlus className="h-5 w-5" /> Unified Meeting Scheduler</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-2 gap-3">
          <button onClick={() => setMode('AUDIO')} className={`rounded-3xl border p-5 text-left ${mode === 'AUDIO' ? 'border-orange-500 bg-orange-50' : 'bg-white'}`}>
            <Headphones className="mb-3 h-7 w-7 text-orange-600" />
            <p className="font-black">R-MEET Audio</p>
            <p className="text-sm text-slate-600">Phone/email onboarded user call session.</p>
          </button>
          <button onClick={() => setMode('VIDEO')} className={`rounded-3xl border p-5 text-left ${mode === 'VIDEO' ? 'border-indigo-500 bg-indigo-50' : 'bg-white'}`}>
            <Video className="mb-3 h-7 w-7 text-indigo-600" />
            <p className="font-black">R-ZOOMA Video</p>
            <p className="text-sm text-slate-600">Email invite, video room, AI notes, calendar sync.</p>
          </button>
        </div>
        <Input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Meeting title" />
        <div className="grid gap-3 md:grid-cols-2"><Input id="startsAt" type="datetime-local" /><Input id="endsAt" type="datetime-local" /></div>
        <Input id="invitees" placeholder="Invitee user IDs, comma-separated" />
        <Textarea id="agenda" placeholder="Agenda, asset link, dataset/study/publication details" />
        <Button onClick={scheduleMeeting} className="w-full rounded-2xl bg-slate-950">Schedule {mode === 'AUDIO' ? 'Audio Call' : 'Video Meeting'}</Button>
        {message && <p className="rounded-2xl bg-slate-100 p-3 text-sm font-semibold">{message}</p>}
      </CardContent>
    </Card>
  );
}
