import { Bot, CalendarCheck, MonitorUp, PanelsTopLeft, ScreenShare, Video } from 'lucide-react';
import { CommShell } from '@/components/communication/CommShell';
import { MetricCard } from '@/components/communication/MetricCard';
import { MeetingSchedulerPanel } from '@/components/communication/MeetingSchedulerPanel';
import { Button } from '@/components/ui/button';

export default function RZoomaPage() {
  return (
    <CommShell title="R-ZOOMA Video Workspace" subtitle="Dedicated video meeting application with email invitation, scheduler, live room, AI notes, board, and monitoring.">
      <section className="grid gap-4 md:grid-cols-5">
        <MetricCard label="Live rooms" value="8" />
        <MetricCard label="Upcoming" value="16" />
        <MetricCard label="Accepted" value="42" />
        <MetricCard label="Declined" value="5" />
        <MetricCard label="Recordings" value="21" />
      </section>

      <section className="mt-6 grid gap-6 xl:grid-cols-[1.2fr_0.8fr]">
        <div className="overflow-hidden rounded-[2rem] border bg-slate-950 shadow-sm">
          <div className="flex items-center justify-between border-b border-white/10 p-5 text-white">
            <div><h2 className="text-2xl font-black">Live Video Room Preview</h2><p className="text-sm text-slate-300">Auto-opens when accepted invitation reaches scheduled time.</p></div>
            <span className="rounded-full bg-emerald-400/20 px-3 py-1 text-xs font-black text-emerald-200">READY</span>
          </div>
          <div className="grid min-h-[420px] gap-4 p-5 lg:grid-cols-[1fr_280px]">
            <div className="rounded-[2rem] bg-gradient-to-br from-indigo-700 via-slate-900 to-violet-800 p-5 text-white">
              <div className="grid h-full gap-4 md:grid-cols-2">
                {[1,2,3,4].map((i) => <div key={i} className="flex items-center justify-center rounded-3xl bg-white/10 text-4xl font-black">U{i}</div>)}
              </div>
            </div>
            <aside className="space-y-3 text-white">
              <div className="rounded-3xl bg-white/10 p-4"><PanelsTopLeft className="mb-2 h-5 w-5 text-indigo-200" /><b>Agenda</b><p className="text-sm text-slate-300">Review dataset approval and publication readiness.</p></div>
              <div className="rounded-3xl bg-white/10 p-4"><Bot className="mb-2 h-5 w-5 text-indigo-200" /><b>AI Notes</b><p className="text-sm text-slate-300">Summary and action items will generate after recording.</p></div>
              <div className="rounded-3xl bg-white/10 p-4"><MonitorUp className="mb-2 h-5 w-5 text-indigo-200" /><b>Monitoring</b><p className="text-sm text-slate-300">Latency 31ms · Quality 98%</p></div>
            </aside>
          </div>
          <div className="flex flex-wrap gap-2 border-t border-white/10 p-5">
            <Button className="rounded-2xl bg-white text-slate-950"><Video className="mr-2 h-4 w-4" /> Camera</Button>
            <Button className="rounded-2xl bg-white text-slate-950"><ScreenShare className="mr-2 h-4 w-4" /> Share</Button>
            <Button className="rounded-2xl bg-white text-slate-950"><CalendarCheck className="mr-2 h-4 w-4" /> ICS</Button>
            <Button variant="destructive" className="rounded-2xl">End Meeting</Button>
          </div>
        </div>
        <MeetingSchedulerPanel />
      </section>
    </CommShell>
  );
}
