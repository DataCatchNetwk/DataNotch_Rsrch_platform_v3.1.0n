'use client';

import { useState } from 'react';
import { CalendarPlus, Headphones, Mail, Video } from 'lucide-react';

type Mode = 'AUDIO' | 'VIDEO';

export function UnifiedScheduler({ defaultMode = 'VIDEO' }: { defaultMode?: Mode }) {
  const [mode, setMode] = useState<Mode>(defaultMode);
  const [title, setTitle] = useState('Research Review Meeting');
  const [message, setMessage] = useState('');

  function schedule() {
    setMessage(`${mode === 'AUDIO' ? 'R-MEET audio call' : 'R-ZOOMA video meeting'} scheduled. Invitations must be accepted before auto-open is enabled.`);
  }

  return (
    <div className="rounded-[1.75rem] border bg-white p-6 shadow-xl shadow-slate-200/70">
      <div className="flex items-center gap-2 font-black"><CalendarPlus className="h-5 w-5" /> Unified Meeting Scheduler</div>
      <div className="mt-5 grid gap-4 md:grid-cols-2">
        <button onClick={() => setMode('AUDIO')} className={`rounded-2xl border p-5 text-left transition ${mode === 'AUDIO' ? 'border-orange-500 bg-orange-50 ring-4 ring-orange-100' : 'bg-white hover:bg-slate-50'}`}>
          <Headphones className="h-8 w-8 text-orange-600" />
          <h3 className="mt-4 font-black">R-MEET Audio</h3>
          <p className="mt-1 text-sm text-slate-600">Phone/email onboarded user call session.</p>
        </button>
        <button onClick={() => setMode('VIDEO')} className={`rounded-2xl border p-5 text-left transition ${mode === 'VIDEO' ? 'border-indigo-500 bg-indigo-50 ring-4 ring-indigo-100' : 'bg-white hover:bg-slate-50'}`}>
          <Video className="h-8 w-8 text-indigo-600" />
          <h3 className="mt-4 font-black">R-ZOOMA Video</h3>
          <p className="mt-1 text-sm text-slate-600">Email invite, video room, AI notes, calendar sync.</p>
        </button>
      </div>
      <div className="mt-5 grid gap-3">
        <input value={title} onChange={(e) => setTitle(e.target.value)} className="rounded-xl border px-4 py-3 text-sm" />
        <div className="grid gap-3 md:grid-cols-2">
          <input type="datetime-local" className="rounded-xl border px-4 py-3 text-sm" />
          <input type="datetime-local" className="rounded-xl border px-4 py-3 text-sm" />
        </div>
        <input placeholder="Invite registered user IDs or external emails, comma-separated" className="rounded-xl border px-4 py-3 text-sm" />
        <textarea placeholder="Agenda, asset link, dataset/study/publication details" className="min-h-24 rounded-xl border px-4 py-3 text-sm" />
        <div className="flex flex-wrap gap-3">
          <label className="inline-flex items-center gap-2 rounded-full bg-slate-100 px-4 py-2 text-sm font-bold"><input type="checkbox" defaultChecked /> Auto-open at accepted start time</label>
          <label className="inline-flex items-center gap-2 rounded-full bg-slate-100 px-4 py-2 text-sm font-bold"><input type="checkbox" defaultChecked /> Calendar sync</label>
          <label className="inline-flex items-center gap-2 rounded-full bg-slate-100 px-4 py-2 text-sm font-bold"><Mail className="h-4 w-4" /> Email copy</label>
        </div>
        <button onClick={schedule} className="rounded-xl bg-slate-950 px-5 py-3 text-sm font-black text-white">Schedule {mode === 'AUDIO' ? 'Audio Call' : 'Video Meeting'}</button>
        {message && <p className="rounded-xl bg-emerald-50 p-3 text-sm font-bold text-emerald-700">{message}</p>}
      </div>
    </div>
  );
}
