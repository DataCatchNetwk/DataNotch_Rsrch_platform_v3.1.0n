'use client';

import React from 'react';
import Link from 'next/link';
import { ArrowRight, Play, Eye, Save, CheckCircle2 } from 'lucide-react';

export type StageShellProps = {
  title: string;
  badge?: string;
  description: string;
  previous: string;
  current: string;
  next: string;
  metrics: Array<{ label: string; value: string; note: string }>;
  children: React.ReactNode;
  onRun?: () => void;
  onPreview?: () => void;
  onSave?: () => void;
  nextHref?: string;
};

export function StageShell({
  title,
  badge = 'Data Preparation',
  description,
  previous,
  current,
  next,
  metrics,
  children,
  onRun,
  onPreview,
  onSave,
  nextHref,
}: StageShellProps) {
  return (
    <main className="p-8 space-y-6">
      <section className="rounded-[28px] border bg-white p-8 shadow-sm">
        <div className="flex items-start justify-between gap-6">
          <div>
            <span className="inline-flex rounded-full bg-blue-50 px-3 py-1 text-sm text-blue-700">{badge}</span>
            <h1 className="mt-4 text-4xl font-bold tracking-tight">{title}</h1>
            <p className="mt-2 max-w-4xl text-slate-600">{description}</p>
          </div>
          {nextHref ? (
            <Link href={nextHref} className="rounded-xl bg-slate-950 px-5 py-3 text-white inline-flex gap-2">
              Send Forward <ArrowRight size={18} />
            </Link>
          ) : null}
        </div>

        <div className="mt-8 grid grid-cols-4 gap-4">
          {metrics.map((m) => (
            <div key={m.label} className="rounded-2xl border bg-slate-50 p-5">
              <p className="text-sm uppercase tracking-wide text-slate-500">{m.label}</p>
              <p className="mt-2 text-3xl font-bold">{m.value}</p>
              <p className="mt-1 text-sm text-slate-500">{m.note}</p>
            </div>
          ))}
        </div>
      </section>

      <section className="rounded-[28px] border bg-white p-5 shadow-sm">
        <div className="grid grid-cols-3 gap-4">
          <div className="rounded-2xl border p-5">
            <p className="text-sm uppercase text-slate-500">Previous Stage</p>
            <p className="mt-1 font-bold">{previous}</p>
          </div>
          <div className="rounded-2xl border border-blue-200 bg-blue-50 p-5">
            <p className="text-sm uppercase text-slate-500">Current Stage</p>
            <p className="mt-1 font-bold">{current}</p>
          </div>
          <div className="rounded-2xl border p-5">
            <p className="text-sm uppercase text-slate-500">Next Stage</p>
            <p className="mt-1 font-bold">{next}</p>
          </div>
        </div>
      </section>

      <section className="grid grid-cols-[1fr_360px] gap-6">
        <div className="rounded-[28px] border bg-white p-6 shadow-sm">{children}</div>
        <div className="rounded-[28px] border bg-white p-6 shadow-sm">
          <h2 className="mb-4 flex items-center gap-2 text-xl font-bold">
            <CheckCircle2 className="text-emerald-600" size={22} /> Stage Actions
          </h2>
          <div className="space-y-3">
            <button onClick={onRun} className="w-full rounded-xl border px-4 py-3 text-left hover:bg-slate-50">
              <Play className="mr-2 inline" size={16} /> Run Stage
            </button>
            <button onClick={onPreview} className="w-full rounded-xl border px-4 py-3 text-left hover:bg-slate-50">
              <Eye className="mr-2 inline" size={16} /> Preview Changes
            </button>
            <button onClick={onSave} className="w-full rounded-xl border px-4 py-3 text-left hover:bg-slate-50">
              <Save className="mr-2 inline" size={16} /> Save Result
            </button>
          </div>
        </div>
      </section>
    </main>
  );
}
