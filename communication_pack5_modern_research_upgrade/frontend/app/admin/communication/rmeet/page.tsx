'use client';

import { Headphones, Mic, MicOff, PhoneOff, Pause, Radio, Users } from 'lucide-react';
import { CommunicationShell, MetricCard } from '@/components/communication/CommunicationShell';
import { UnifiedScheduler } from '@/components/communication/UnifiedScheduler';
import { audioCalls, activity } from '@/lib/communication-demo-data';

export default function RMeetWorkspace() {
  return (
    <CommunicationShell title="R-MEET Audio Workspace" description="Dedicated audio operations page with scheduling, active calls, queue, participants, call logs, recordings, and end-call controls.">
      <div className="grid gap-4 md:grid-cols-4">
        <MetricCard label="Live Audio Calls" value="23" detail="+4" />
        <MetricCard label="Queued Calls" value="6" detail="review" />
        <MetricCard label="Avg Duration" value="18m" detail="today" />
        <MetricCard label="Recorded Calls" value="14" detail="secure" />
      </div>
      <div className="grid gap-6 lg:grid-cols-[1.1fr_.9fr]">
        <section className="rounded-[2rem] border bg-white p-6 shadow-xl shadow-slate-200/70">
          <div className="flex items-center justify-between"><div><h2 className="text-2xl font-black">Audio Control Deck</h2><p className="text-sm text-slate-600">Manage phone/email onboarded registered-user calls.</p></div><span className="rounded-full bg-orange-50 p-5"><Headphones className="h-7 w-7 text-orange-600" /></span></div>
          <div className="mt-6 grid gap-4 md:grid-cols-3">
            {audioCalls.map((c) => <div key={c.id} className="rounded-2xl border bg-slate-50 p-5"><h3 className="font-black">{c.title}</h3><p className="mt-2 text-sm text-slate-600">{c.participants} participants · {c.duration}</p><div className="mt-4 flex flex-wrap gap-2"><button className="rounded-full bg-orange-600 px-3 py-2 text-xs font-black text-white"><Radio className="mr-1 inline h-3 w-3" /> Start</button><button className="rounded-full bg-white px-3 py-2 text-xs font-black"><MicOff className="mr-1 inline h-3 w-3" /> Mute</button><button className="rounded-full bg-red-50 px-3 py-2 text-xs font-black text-red-600"><PhoneOff className="mr-1 inline h-3 w-3" /> End</button></div></div>)}
          </div>
          <div className="mt-6 rounded-[1.5rem] bg-slate-950 p-5 text-white">
            <h3 className="font-black"><Radio className="mr-2 inline h-4 w-4 text-orange-400" /> Live Audio Session Screen</h3>
            <div className="mt-5 grid gap-3 md:grid-cols-4">
              {['Participants 8','Duration 00:28:11','Recording Enabled','Status LIVE'].map((x) => <div key={x} className="rounded-2xl bg-white/10 p-4 font-bold">{x}</div>)}
            </div>
            <div className="mt-5 flex flex-wrap gap-3"><button className="rounded-full bg-white px-4 py-2 text-sm font-black text-slate-950"><Mic className="mr-2 inline h-4 w-4" /> Mic</button><button className="rounded-full bg-white/10 px-4 py-2 text-sm font-black"><Pause className="mr-2 inline h-4 w-4" /> Hold</button><button className="rounded-full bg-red-500 px-4 py-2 text-sm font-black"><PhoneOff className="mr-2 inline h-4 w-4" /> End Call</button></div>
          </div>
        </section>
        <UnifiedScheduler defaultMode="AUDIO" />
      </div>
      <section className="rounded-[2rem] border bg-white p-6 shadow-xl shadow-slate-200/70"><h2 className="font-black"><Users className="mr-2 inline h-5 w-5" /> Call Activity Ledger</h2><div className="mt-4 grid gap-3 md:grid-cols-2">{activity.map((a) => <div key={a} className="rounded-2xl bg-slate-50 p-4 text-sm font-bold">{a}</div>)}</div></section>
    </CommunicationShell>
  );
}
