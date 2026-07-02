'use client';

import Link from 'next/link';
import { ArrowRight, Activity, BarChart3, Database, FileText, FlaskConical, ShieldCheck, UploadCloud } from 'lucide-react';

type StageDef = {
  key: string;
  title: string;
  href: string;
  description: string;
  icon: typeof UploadCloud;
};

const stages: StageDef[] = [
  {
    key: 'workspace-intake',
    title: 'Workspace Intake',
    href: '/dashboard/workspace-intake',
    description: 'Upload assets, assign work, and register candidates.',
    icon: UploadCloud,
  },
  {
    key: 'data-management',
    title: 'Data Management',
    href: '/dashboard/data-management',
    description: 'Catalog, govern, and route datasets.',
    icon: Database,
  },
  {
    key: 'data-preparation',
    title: 'Data Preparation',
    href: '/dashboard/data-preparation',
    description: 'Profile, clean, harmonize, engineer, and validate.',
    icon: FlaskConical,
  },
  {
    key: 'research-studio',
    title: 'Research Studio',
    href: '/dashboard/research-studio',
    description: 'Questions, cohorts, protocols, and experiments.',
    icon: FlaskConical,
  },
  {
    key: 'analytics-ai',
    title: 'Analytics & AI',
    href: '/dashboard/analytics-ai',
    description: 'Statistics, ML/AI, causal, survival, and explainability.',
    icon: BarChart3,
  },
  {
    key: 'outputs',
    title: 'Outputs',
    href: '/dashboard/outputs',
    description: 'Results, reports, visualizations, and exports.',
    icon: FileText,
  },
];

export function PlatformHeader({
  title,
  subtitle,
  actionLabel,
  actionHref,
}: {
  title: string;
  subtitle: string;
  actionLabel?: string;
  actionHref?: string;
}) {
  return (
    <div className="rounded-3xl border bg-white p-8 shadow-sm">
      <div className="flex items-start justify-between gap-4">
        <div>
          <div className="mb-2 text-sm font-medium text-blue-600">DataNotch Research Platform</div>
          <h1 className="text-4xl font-bold tracking-tight text-slate-950">{title}</h1>
          <p className="mt-3 max-w-4xl text-slate-600">{subtitle}</p>
        </div>
        {actionLabel && actionHref ? (
          <Link href={actionHref} className="inline-flex items-center gap-2 rounded-xl bg-slate-950 px-5 py-3 text-white">
            {actionLabel}
            <ArrowRight className="h-4 w-4" />
          </Link>
        ) : null}
      </div>
    </div>
  );
}

export function StageFlow({ active }: { active: string }) {
  return (
    <div className="rounded-3xl border bg-white p-5 shadow-sm">
      <div className="grid grid-cols-1 gap-3 md:grid-cols-6">
        {stages.map((stage, index) => {
          const Icon = stage.icon;
          const isActive = stage.key === active;
          return (
            <Link
              key={stage.key}
              href={stage.href}
              className={`rounded-2xl border p-4 ${
                isActive ? 'border-blue-400 bg-blue-50' : 'bg-white hover:bg-slate-50'
              }`}
            >
              <div className="flex items-center gap-2">
                <Icon className="h-5 w-5 text-blue-600" />
                <span className="text-xs text-slate-500">Stage {index + 1}</span>
              </div>
              <div className="mt-2 font-semibold text-slate-900">{stage.title}</div>
              <div className="mt-1 text-xs text-slate-500">{stage.description}</div>
            </Link>
          );
        })}
      </div>
    </div>
  );
}

export function CrossCuttingLayers() {
  return (
    <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
      <Link href="/dashboard/governance" className="rounded-3xl border bg-white p-6 shadow-sm hover:bg-slate-50">
        <div className="flex items-center gap-3">
          <ShieldCheck className="h-6 w-6 text-emerald-600" />
          <h2 className="text-xl font-bold">Governance Layer</h2>
        </div>
        <p className="mt-2 text-slate-600">
          Audit logs, lineage, compliance, approvals, RBAC, ownership, and reproducibility across all stages.
        </p>
      </Link>
      <Link href="/dashboard/system-services" className="rounded-3xl border bg-white p-6 shadow-sm hover:bg-slate-50">
        <div className="flex items-center gap-3">
          <Activity className="h-6 w-6 text-violet-600" />
          <h2 className="text-xl font-bold">System Services Layer</h2>
        </div>
        <p className="mt-2 text-slate-600">
          Runtime and pipeline monitoring, jobs, notifications, security, storage, and worker operations.
        </p>
      </Link>
    </div>
  );
}

export function MetricCard({ label, value, note }: { label: string; value: string | number; note?: string }) {
  return (
    <div className="rounded-2xl border bg-white p-5 shadow-sm">
      <div className="text-xs uppercase text-slate-500">{label}</div>
      <div className="mt-2 text-3xl font-bold text-slate-950">{value}</div>
      {note ? <div className="mt-1 text-sm text-slate-500">{note}</div> : null}
    </div>
  );
}

export function ActionCard({ title, description, href }: { title: string; description: string; href: string }) {
  return (
    <Link href={href} className="rounded-2xl border bg-white p-5 shadow-sm transition hover:border-violet-300 hover:bg-violet-50">
      <div className="font-semibold text-slate-900">{title}</div>
      <p className="mt-2 text-sm text-slate-600">{description}</p>
      <div className="mt-4 inline-flex items-center gap-1 text-sm text-violet-700">
        Open <ArrowRight className="h-4 w-4" />
      </div>
    </Link>
  );
}
