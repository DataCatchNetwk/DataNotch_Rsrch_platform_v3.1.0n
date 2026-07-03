import Link from 'next/link';
import { ArrowRight, CalendarClock, Headphones, Mail, ShieldCheck, Video } from 'lucide-react';
import { CommShell } from '@/components/communication/CommShell';
import { MetricCard } from '@/components/communication/MetricCard';

const workspaces = [
  { href: '/admin/communication/rmeet', title: 'R-MEET Audio Workspace', desc: 'Dedicated audio call command center with active calls, queue, participants, logs, recordings, and end-call controls.', icon: Headphones, accent: 'from-orange-500 to-red-500' },
  { href: '/admin/communication/rzooma', title: 'R-ZOOMA Video Workspace', desc: 'Modern video meeting console with email invite, scheduler, live room, AI notes, board, recordings, and monitoring.', icon: Video, accent: 'from-indigo-600 to-violet-600' },
  { href: '/admin/communication/messaging', title: 'Messaging Email Only Workspace', desc: 'Email-only messaging hub with inbox, sent, drafts, templates, broadcasts, support tickets, and delivery logs.', icon: Mail, accent: 'from-pink-500 to-rose-500' },
];

export default function CommunicationLandingPage() {
  return (
    <CommShell title="Admin Communication Command Center" subtitle="Select a dedicated communication workspace instead of mixing all tools on one long page.">
      <section className="grid gap-4 md:grid-cols-4">
        <MetricCard label="Active sessions" value="31" delta="Live" />
        <MetricCard label="Pending invites" value="18" />
        <MetricCard label="Email deliveries" value="99.4%" />
        <MetricCard label="Open support" value="7" />
      </section>

      <section className="mt-6 grid gap-5 lg:grid-cols-3">
        {workspaces.map((item) => {
          const Icon = item.icon;
          return (
            <Link key={item.href} href={item.href} className="group overflow-hidden rounded-[2rem] border bg-white shadow-sm transition hover:-translate-y-1 hover:shadow-xl">
              <div className={`h-2 bg-gradient-to-r ${item.accent}`} />
              <div className="p-6">
                <div className="mb-6 flex items-center justify-between">
                  <div className="rounded-3xl bg-slate-100 p-4"><Icon className="h-8 w-8" /></div>
                  <ArrowRight className="h-5 w-5 transition group-hover:translate-x-1" />
                </div>
                <h2 className="text-2xl font-black">{item.title}</h2>
                <p className="mt-3 min-h-20 text-sm leading-6 text-slate-600">{item.desc}</p>
              </div>
            </Link>
          );
        })}
      </section>

      <section className="mt-6 rounded-[2rem] border bg-slate-950 p-6 text-white">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <p className="flex items-center gap-2 text-sm font-bold text-emerald-300"><ShieldCheck className="h-4 w-4" /> RBAC protected meeting lifecycle</p>
            <h3 className="mt-2 text-2xl font-black">Schedule by choosing Audio or Video</h3>
            <p className="mt-1 text-sm text-slate-300">Invitations must be accepted before auto-open or meeting start is allowed.</p>
          </div>
          <Link href="/admin/communication/scheduler" className="inline-flex items-center justify-center rounded-2xl bg-white px-5 py-3 font-bold text-slate-950">
            <CalendarClock className="mr-2 h-4 w-4" /> Open Scheduler
          </Link>
        </div>
      </section>
    </CommShell>
  );
}
