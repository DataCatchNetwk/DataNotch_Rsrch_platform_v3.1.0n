'use client';

import Link from 'next/link';
import { ArrowLeft, Bell, CalendarDays, ShieldCheck } from 'lucide-react';

export function CommunicationShell({
  title,
  eyebrow = 'Research Platform V3',
  description,
  children,
  backHref = '/admin/communication',
}: {
  title: string;
  eyebrow?: string;
  description: string;
  children: React.ReactNode;
  backHref?: string;
}) {
  return (
    <main className="min-h-screen bg-[radial-gradient(circle_at_top_left,#e8f8ff,transparent_32%),linear-gradient(180deg,#f8fbff,#eef3ff)] px-6 py-10 text-slate-950">
      <section className="mx-auto max-w-7xl space-y-8">
        <header className="rounded-[2rem] border border-white/70 bg-white/80 p-7 shadow-xl shadow-slate-200/70 backdrop-blur">
          <div className="flex flex-col gap-5 md:flex-row md:items-center md:justify-between">
            <div>
              <p className="text-xs font-black uppercase tracking-[0.45em] text-sky-600">{eyebrow}</p>
              <h1 className="mt-3 text-4xl font-black tracking-tight">{title}</h1>
              <p className="mt-2 max-w-3xl text-sm leading-6 text-slate-600">{description}</p>
            </div>
            <div className="flex flex-wrap gap-3">
              <span className="inline-flex items-center gap-2 rounded-full bg-emerald-50 px-4 py-2 text-sm font-bold text-emerald-700"><ShieldCheck className="h-4 w-4" /> RBAC Live</span>
              <span className="inline-flex items-center gap-2 rounded-full bg-indigo-50 px-4 py-2 text-sm font-bold text-indigo-700"><Bell className="h-4 w-4" /> Notifications</span>
              <Link href="/admin/communication/scheduler" className="inline-flex items-center gap-2 rounded-full bg-slate-950 px-4 py-2 text-sm font-bold text-white"><CalendarDays className="h-4 w-4" /> Scheduler</Link>
              {backHref && <Link href={backHref} className="inline-flex items-center gap-2 rounded-full border bg-white px-4 py-2 text-sm font-bold"><ArrowLeft className="h-4 w-4" /> Back</Link>}
            </div>
          </div>
        </header>
        {children}
      </section>
    </main>
  );
}

export function MetricCard({ label, value, detail }: { label: string; value: string; detail?: string }) {
  return (
    <div className="rounded-[1.5rem] border border-white/70 bg-white/75 p-5 shadow-lg shadow-slate-200/70">
      <p className="text-[11px] font-black uppercase tracking-[0.35em] text-slate-500">{label}</p>
      <div className="mt-3 flex items-end justify-between">
        <p className="text-3xl font-black">{value}</p>
        {detail && <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-bold text-slate-600">{detail}</span>}
      </div>
    </div>
  );
}
