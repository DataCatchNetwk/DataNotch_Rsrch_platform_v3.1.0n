import { Headphones, Mic, PhoneCall, PhoneOff, Radio, Timer, Users } from 'lucide-react';
import { CommShell } from '@/components/communication/CommShell';
import { MetricCard } from '@/components/communication/MetricCard';
import { MeetingSchedulerPanel } from '@/components/communication/MeetingSchedulerPanel';
import { Button } from '@/components/ui/button';

const calls = ['Dataset Review Audio', 'Research PI Check-in', 'Support Escalation Call'];

export default function RMeetPage() {
  return (
    <CommShell title="R-MEET Audio Workspace" subtitle="Dedicated audio operations page with scheduling, active calls, call queue, logs, and end-call controls.">
      <section className="grid gap-4 md:grid-cols-4">
        <MetricCard label="Live audio calls" value="23" delta="+4" />
        <MetricCard label="Queued calls" value="6" />
        <MetricCard label="Avg duration" value="18m" />
        <MetricCard label="Recorded calls" value="14" />
      </section>

      <section className="mt-6 grid gap-6 xl:grid-cols-[1.1fr_0.9fr]">
        <div className="rounded-[2rem] border bg-white p-6 shadow-sm">
          <div className="mb-5 flex items-center justify-between">
            <div><h2 className="text-2xl font-black">Audio Control Deck</h2><p className="text-sm text-slate-600">Manage phone/email onboarded registered-user calls.</p></div>
            <div className="rounded-full bg-orange-50 p-4"><Headphones className="h-7 w-7 text-orange-600" /></div>
          </div>
          <div className="grid gap-4 md:grid-cols-3">
            {calls.map((call) => (
              <div key={call} className="rounded-3xl border bg-slate-50 p-5">
                <p className="font-black">{call}</p>
                <p className="mt-1 text-sm text-slate-600">3 participants · Ready</p>
                <div className="mt-4 flex flex-wrap gap-2">
                  <Button size="sm" className="rounded-xl bg-orange-600"><PhoneCall className="mr-1 h-4 w-4" /> Start</Button>
                  <Button size="sm" variant="outline" className="rounded-xl"><Mic className="mr-1 h-4 w-4" /> Mute</Button>
                  <Button size="sm" variant="destructive" className="rounded-xl"><PhoneOff className="mr-1 h-4 w-4" /> End</Button>
                </div>
              </div>
            ))}
          </div>

          <div className="mt-6 rounded-3xl bg-slate-950 p-5 text-white">
            <p className="flex items-center gap-2 font-black"><Radio className="h-5 w-5 text-orange-300" /> Live Audio Session Screen</p>
            <div className="mt-4 grid gap-3 md:grid-cols-4">
              <div className="rounded-2xl bg-white/10 p-4"><Users className="mb-2 h-5 w-5" /> Participants<br /><b>8</b></div>
              <div className="rounded-2xl bg-white/10 p-4"><Timer className="mb-2 h-5 w-5" /> Duration<br /><b>00:28:11</b></div>
              <div className="rounded-2xl bg-white/10 p-4">Recording<br /><b>Enabled</b></div>
              <div className="rounded-2xl bg-white/10 p-4">Status<br /><b>LIVE</b></div>
            </div>
          </div>
        </div>
        <MeetingSchedulerPanel />
      </section>
    </CommShell>
  );
}
