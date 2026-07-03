import Link from 'next/link';
import { Headphones, Mail, Video, ArrowRight, CalendarClock, Sparkles } from 'lucide-react';
import { CommunicationShell, MetricCard } from '@/components/communication/CommunicationShell';
import { commandMetrics, upcomingMeetings } from '@/lib/communication-demo-data';

const workspaces = [
  { href: '/admin/communication/rmeet', icon: Headphones, title: 'R-MEET Audio Workspace', line: 'Audio call command center with live queue, participant controls, end call, logs, and recordings.', accent: 'from-orange-500 to-red-500' },
  { href: '/admin/communication/rzooma', icon: Video, title: 'R-ZOOMA Video Workspace', line: 'Video meeting console with scheduler, lifecycle acceptance, AI notes, board, recordings, and monitoring.', accent: 'from-indigo-500 to-fuchsia-500' },
  { href: '/admin/communication/messaging', icon: Mail, title: 'Messaging Email Only Workspace', line: 'Inbox, sent, drafts, templates, broadcasts, support tickets, external email, and delivery logs.', accent: 'from-pink-500 to-rose-600' },
];

export default function CommunicationLandingPage() {
  return (
    <CommunicationShell title="Admin Communication Command Center" description="Select a dedicated communication workspace. Each selector opens its own application instead of mixing all communication tools on one long page." backHref="/admin">
      <div className="grid gap-4 md:grid-cols-4">{commandMetrics.map((m) => <MetricCard key={m.label} {...m} />)}</div>
      <div className="grid gap-6 lg:grid-cols-3">
        {workspaces.map((w) => {
          const Icon = w.icon;
          return (
            <Link key={w.title} href={w.href} className="group overflow-hidden rounded-[2rem] border border-white/70 bg-white shadow-xl shadow-slate-200/70 transition hover:-translate-y-1 hover:shadow-2xl">
              <div className={`h-2 bg-gradient-to-r ${w.accent}`} />
              <div className="p-7">
                <div className="flex items-center justify-between">
                  <span className="rounded-2xl bg-slate-100 p-4"><Icon className="h-8 w-8" /></span>
                  <ArrowRight className="h-6 w-6 transition group-hover:translate-x-1" />
                </div>
                <h2 className="mt-8 text-2xl font-black">{w.title}</h2>
                <p className="mt-3 text-sm leading-6 text-slate-600">{w.line}</p>
              </div>
            </Link>
          );
        })}
      </div>
      <section className="grid gap-6 lg:grid-cols-[1.2fr_.8fr]">
        <div className="rounded-[2rem] bg-slate-950 p-7 text-white shadow-xl">
          <div className="flex items-center gap-2 text-emerald-300"><Sparkles className="h-5 w-5" /><span className="text-sm font-black">Research asset communication</span></div>
          <h3 className="mt-4 text-2xl font-black">Schedule by choosing Audio or Video</h3>
          <p className="mt-2 text-sm text-slate-300">Invitations must be accepted before auto-open or meeting start is allowed. Attach meetings to projects, studies, datasets, analyses, or publications.</p>
          <Link href="/admin/communication/scheduler" className="mt-6 inline-flex rounded-full bg-white px-5 py-3 text-sm font-black text-slate-950"><CalendarClock className="mr-2 h-4 w-4" /> Open Scheduler</Link>
        </div>
        <div className="rounded-[2rem] border bg-white p-6 shadow-xl shadow-slate-200/70">
          <h3 className="font-black">Upcoming Communication Schedule</h3>
          <div className="mt-4 space-y-3">
            {upcomingMeetings.map((m) => <div key={m.id} className="rounded-2xl bg-slate-50 p-4"><div className="flex justify-between gap-3"><b>{m.title}</b><span className="text-xs font-black text-indigo-600">{m.mode}</span></div><p className="mt-1 text-sm text-slate-600">{m.time} · {m.status}</p></div>)}
          </div>
        </div>
      </section>
    </CommunicationShell>
  );
}
