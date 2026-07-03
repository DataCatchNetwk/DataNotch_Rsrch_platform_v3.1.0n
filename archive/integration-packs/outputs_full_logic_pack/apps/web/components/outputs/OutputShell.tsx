'use client';

import Link from 'next/link';

const items = [
  ['dashboards', 'Interactive Dashboards'],
  ['visualizations', 'Visualizations'],
  ['reports', 'Reports'],
  ['publications', 'Publications'],
  ['manuscripts', 'Manuscripts'],
  ['executive', 'Executive Summaries'],
  ['presentations', 'Presentations'],
  ['data-exports', 'Data Exports'],
  ['model-exports', 'Model Exports'],
  ['api', 'API Outputs'],
];

export function OutputShell({ active, children }: { active: string; children: React.ReactNode }) {
  return (
    <div className="space-y-6">
      <div className="rounded-[28px] bg-white border shadow-sm p-6">
        <div className="flex flex-wrap gap-2">
          {items.map(([key, label]) => (
            <Link
              key={key}
              href={`/dashboard/outputs?view=${key}`}
              className={`px-4 py-2 rounded-xl text-sm border ${
                active === key ? 'bg-black text-white' : 'bg-white hover:bg-slate-50'
              }`}
            >
              {label}
            </Link>
          ))}
        </div>
      </div>
      {children}
    </div>
  );
}

export function StatCard({ label, value, sub }: { label: string; value: string | number; sub?: string }) {
  return (
    <div className="rounded-2xl border bg-slate-50 p-5">
      <div className="text-xs uppercase tracking-wide text-slate-500">{label}</div>
      <div className="mt-2 text-3xl font-bold">{value}</div>
      {sub ? <div className="text-sm text-slate-500 mt-1">{sub}</div> : null}
    </div>
  );
}

export function PageHero({ tag, title, description, action }: {
  tag: string; title: string; description: string; action?: React.ReactNode;
}) {
  return (
    <section className="rounded-[32px] bg-white border shadow-sm p-8">
      <div className="flex justify-between gap-6">
        <div>
          <span className="text-xs bg-violet-50 text-violet-700 px-3 py-1 rounded-full">{tag}</span>
          <h1 className="text-4xl font-bold mt-5">{title}</h1>
          <p className="text-slate-600 mt-3 max-w-4xl">{description}</p>
        </div>
        <div>{action}</div>
      </div>
    </section>
  );
}
