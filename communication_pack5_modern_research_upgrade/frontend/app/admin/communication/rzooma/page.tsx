'use client';

import { Bot, CalendarCheck, MonitorUp, Pause, ScreenShare, Video, VideoOff, WandSparkles } from 'lucide-react';
import { CommunicationShell, MetricCard } from '@/components/communication/CommunicationShell';
import { UnifiedScheduler } from '@/components/communication/UnifiedScheduler';
import { videoMeetings } from '@/lib/communication-demo-data';

export default function RZoomaWorkspace() {
  return (
    <CommunicationShell title="R-ZOOMA Video Workspace" description="Modern video meeting console with email invite, scheduler, acceptance workflow, live room, AI notes, board, recordings, and monitoring tools.">
      <div className="grid gap-4 md:grid-cols-4">
        <MetricCard label="Live Video Rooms" value="8" detail="ready" />
        <MetricCard label="Accepted Invites" value="42" detail="today" />
        <MetricCard label="Auto-Open Ready" value="12" detail="enabled" />
        <MetricCard label="AI Notes" value="19" detail="generated" />
      </div>
      <div className="grid gap-6 lg:grid-cols-[.9fr_1.1fr]">
        <UnifiedScheduler defaultMode="VIDEO" />
        <section className="overflow-hidden rounded-[2rem] border bg-white shadow-xl shadow-slate-200/70">
          <div className="bg-slate-950 p-5 text-white"><div className="flex items-center justify-between"><h2 className="text-xl font-black"><Video className="mr-2 inline h-5 w-5 text-indigo-300" /> Live R-ZOOMA Room</h2><span className="rounded-full bg-emerald-400/20 px-3 py-1 text-xs font-black text-emerald-200">AUTO-OPEN ENABLED</span></div></div>
          <div className="grid gap-4 p-5 lg:grid-cols-[1.3fr_.7fr]">
            <div className="rounded-[1.5rem] bg-gradient-to-br from-slate-900 to-indigo-950 p-5 text-white">
              <div className="grid h-72 grid-cols-2 gap-3">
                {['Principal Investigator','Data Steward','Statistician','Reviewer'].map((n) => <div key={n} className="flex items-end rounded-2xl bg-white/10 p-4"><span className="font-bold">{n}</span></div>)}
              </div>
              <div className="mt-4 flex flex-wrap gap-3"><button className="rounded-full bg-white px-4 py-2 text-sm font-black text-slate-950"><VideoOff className="mr-2 inline h-4 w-4" /> Camera</button><button className="rounded-full bg-white/10 px-4 py-2 text-sm font-black"><ScreenShare className="mr-2 inline h-4 w-4" /> Share</button><button className="rounded-full bg-white/10 px-4 py-2 text-sm font-black"><Pause className="mr-2 inline h-4 w-4" /> Pause</button><button className="rounded-full bg-red-500 px-4 py-2 text-sm font-black">End Meeting</button></div>
            </div>
            <div className="space-y-3">
              <div className="rounded-2xl bg-indigo-50 p-4"><h3 className="font-black"><Bot className="mr-2 inline h-4 w-4" /> AI Meeting Assistant</h3><p className="mt-2 text-sm text-slate-600">Captures decisions, action items, risks, and follow-ups.</p></div>
              <div className="rounded-2xl bg-slate-50 p-4"><h3 className="font-black"><MonitorUp className="mr-2 inline h-4 w-4" /> Collaboration Board</h3><p className="mt-2 text-sm text-slate-600">Dataset, analysis, publication, and protocol notes.</p></div>
              <div className="rounded-2xl bg-emerald-50 p-4"><h3 className="font-black"><CalendarCheck className="mr-2 inline h-4 w-4" /> Calendar Sync</h3><p className="mt-2 text-sm text-slate-600">Google/Outlook ICS export and reminder status.</p></div>
            </div>
          </div>
        </section>
      </div>
      <section className="rounded-[2rem] border bg-white p-6 shadow-xl shadow-slate-200/70"><h2 className="font-black"><WandSparkles className="mr-2 inline h-5 w-5" /> Meeting Lifecycle Queue</h2><div className="mt-4 grid gap-4 md:grid-cols-2">{videoMeetings.map((m) => <div key={m.id} className="rounded-2xl bg-slate-50 p-5"><div className="flex justify-between"><h3 className="font-black">{m.title}</h3><span className="rounded-full bg-indigo-100 px-3 py-1 text-xs font-black text-indigo-700">{m.status}</span></div><p className="mt-2 text-sm text-slate-600">Accepted {m.accepted} · Declined {m.declined} · Pending {m.pending}</p><div className="mt-4 flex gap-2"><button className="rounded-full bg-slate-950 px-4 py-2 text-xs font-black text-white">Open R-ZOOMA</button><button className="rounded-full bg-white px-4 py-2 text-xs font-black">ICS</button><button className="rounded-full bg-red-50 px-4 py-2 text-xs font-black text-red-600">Cancel</button></div></div>)}</div></section>
    </CommunicationShell>
  );
}
