'use client';

import React from 'react';
import Link from 'next/link';
import { ArrowRight, ShieldCheck, Activity, Database, FlaskConical, BarChart3, FileText, UploadCloud } from 'lucide-react';

export const stages = [
  { key: 'workspace-intake', title: 'Workspace Intake', icon: UploadCloud, description: 'Upload, unzip, explore files, create projects/tasks, register datasets.' },
  { key: 'data-management', title: 'Data Management', icon: Database, description: 'Register, catalog, classify, govern, and route datasets.' },
  { key: 'data-preparation', title: 'Data Preparation', icon: FlaskConical, description: 'Profile, clean, harmonize, engineer, validate, and version datasets.' },
  { key: 'research-studio', title: 'Research Studio', icon: FlaskConical, description: 'Questions, hypotheses, study design, cohorts, variables, protocols, experiments.' },
  { key: 'analytics-ai', title: 'Analytics & AI', icon: BarChart3, description: 'Statistics, ML, AI, causal, survival, KG, explainability, digital twin.' },
  { key: 'outputs', title: 'Outputs', icon: FileText, description: 'Dashboards, visualizations, reports, publications, manuscripts, exports.' },
];

export function PlatformHeader({ title, subtitle, actionLabel, actionHref }: { title: string; subtitle: string; actionLabel?: string; actionHref?: string }) {
  return (
    <div className="rounded-3xl border bg-white p-8 shadow-sm">
      <div className="flex items-start justify-between gap-4">
        <div>
          <div className="text-sm text-blue-600 font-medium mb-2">DataNotch Research Platform</div>
          <h1 className="text-4xl font-bold tracking-tight">{title}</h1>
          <p className="mt-3 text-slate-600 max-w-4xl">{subtitle}</p>
        </div>
        {actionLabel && actionHref ? (
          <Link href={actionHref} className="inline-flex items-center gap-2 rounded-xl bg-slate-950 px-5 py-3 text-white">
            {actionLabel}<ArrowRight className="h-4 w-4" />
          </Link>
        ) : null}
      </div>
    </div>
  );
}

export function StageFlow({ active }: { active: string }) {
  return (
    <div className="rounded-3xl border bg-white p-5 shadow-sm">
      <div className="grid grid-cols-1 md:grid-cols-6 gap-3">
        {stages.map((s, index) => {
          const Icon = s.icon;
          const isActive = s.key === active;
          return (
            <Link key={s.key} href={`/dashboard/${s.key}`} className={`rounded-2xl border p-4 ${isActive ? 'border-blue-400 bg-blue-50' : 'bg-white hover:bg-slate-50'}`}>
              <div className="flex items-center gap-2">
                <Icon className="h-5 w-5 text-blue-600" />
                <span className="text-xs text-slate-500">Stage {index + 1}</span>
              </div>
              <div className="mt-2 font-semibold">{s.title}</div>
              <div className="mt-1 text-xs text-slate-500">{s.description}</div>
            </Link>
          );
        })}
      </div>
    </div>
  );
}

export function CrossCuttingLayers() {
  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
      <Link href="/dashboard/governance" className="rounded-3xl border bg-white p-6 shadow-sm hover:bg-slate-50">
        <div className="flex items-center gap-3"><ShieldCheck className="h-6 w-6 text-emerald-600" /><h2 className="text-xl font-bold">Governance Layer</h2></div>
        <p className="mt-2 text-slate-600">Audit logs, lineage, compliance, provenance, approvals, RBAC, ownership, reproducibility.</p>
      </Link>
      <Link href="/dashboard/system-services" className="rounded-3xl border bg-white p-6 shadow-sm hover:bg-slate-50">
        <div className="flex items-center gap-3"><Activity className="h-6 w-6 text-violet-600" /><h2 className="text-xl font-bold">System Services Layer</h2></div>
        <p className="mt-2 text-slate-600">Runtime monitoring, pipeline monitoring, job scheduler, notifications, authentication, security, administration, storage, workers.</p>
      </Link>
    </div>
  );
}

export function MetricCard({ label, value, note }: { label: string; value: string | number; note?: string }) {
  return <div className="rounded-2xl border bg-white p-5 shadow-sm"><div className="text-xs uppercase text-slate-500">{label}</div><div className="mt-2 text-3xl font-bold">{value}</div>{note && <div className="mt-1 text-sm text-slate-500">{note}</div>}</div>;
}

export function ActionCard({ title, description, href }: { title: string; description: string; href: string }) {
  return <Link href={href} className="rounded-2xl border bg-white p-5 shadow-sm hover:border-violet-300"><div className="font-semibold">{title}</div><p className="mt-2 text-sm text-slate-600">{description}</p><div className="mt-4 text-sm text-violet-700 inline-flex items-center gap-1">Open <ArrowRight className="h-4 w-4" /></div></Link>;
}
