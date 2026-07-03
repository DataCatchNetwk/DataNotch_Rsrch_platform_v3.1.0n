'use client';

import { Archive, Bell, Megaphone, PenLine, Send, Ticket, Mail, Search } from 'lucide-react';
import { CommunicationShell, MetricCard } from '@/components/communication/CommunicationShell';
import { messageThreads } from '@/lib/communication-demo-data';

const modules = [
  ['Inbox', Mail], ['Sent', Send], ['Drafts', PenLine], ['Broadcasts', Megaphone], ['Support Tickets', Ticket], ['Email Logs', Archive], ['Announcements', Bell]
] as const;

export default function MessagingWorkspace() {
  return (
    <CommunicationShell title="Messaging Email Only Workspace" description="Email-only messaging page with inbox, templates, broadcasts, support tickets, announcements, external email support, and delivery logs.">
      <div className="grid gap-4 md:grid-cols-4">
        <MetricCard label="Inbox" value="124" detail="24 new" />
        <MetricCard label="Sent Today" value="38" detail="email" />
        <MetricCard label="Open Tickets" value="7" detail="2 high" />
        <MetricCard label="Delivery Rate" value="99.4%" detail="gateway" />
      </div>
      <div className="grid gap-6 lg:grid-cols-[.35fr_.65fr]">
        <aside className="rounded-[2rem] border bg-white p-6 shadow-xl shadow-slate-200/70"><h2 className="text-xl font-black">Messaging Modules</h2><div className="mt-6 space-y-2">{modules.map(([label, Icon]) => <button key={label} className="flex w-full items-center gap-3 rounded-2xl px-4 py-3 text-left font-black hover:bg-slate-50"><Icon className="h-5 w-5" /> {label}</button>)}</div></aside>
        <section className="rounded-[2rem] border bg-white p-6 shadow-xl shadow-slate-200/70">
          <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between"><h2 className="text-2xl font-black">Email Inbox Threads</h2><button className="rounded-full bg-pink-600 px-5 py-3 text-sm font-black text-white"><PenLine className="mr-2 inline h-4 w-4" /> Compose Email</button></div>
          <div className="mt-5 flex items-center gap-2 rounded-2xl border bg-slate-50 px-4 py-3"><Search className="h-4 w-4 text-slate-500" /><input className="w-full bg-transparent text-sm outline-none" placeholder="Search by project, dataset, study, publication, ticket, user, or external email" /></div>
          <div className="mt-5 space-y-3">{messageThreads.map((t) => <article key={t.id} className="rounded-2xl border bg-slate-50 p-5 transition hover:border-pink-300 hover:bg-pink-50/40"><div className="flex items-start justify-between gap-4"><div><h3 className="font-black">{t.title}</h3><p className="mt-2 text-sm text-slate-600">{t.last}</p><p className="mt-2 text-xs font-bold text-slate-500">Stored in platform inbox first. Optional email copy can go to registered or external public/private address.</p></div><span className="rounded-full bg-pink-100 px-3 py-1 text-xs font-black text-pink-700">{t.status}</span></div></article>)}</div>
        </section>
      </div>
    </CommunicationShell>
  );
}
