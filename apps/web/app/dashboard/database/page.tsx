'use client';

import { Table2, PlugZap, RefreshCw, ShieldCheck } from 'lucide-react';

export default function DatabasePage() {
  return (
    <div className="space-y-8 p-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">Database</h1>
        <p className="mt-1 text-sm text-slate-500">
          Manage database connections, tables, and schemas for your research data.
        </p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {[
          { icon: Table2, label: 'Tables', value: '—', color: 'text-indigo-600 bg-indigo-50' },
          { icon: PlugZap, label: 'Connections', value: '—', color: 'text-violet-600 bg-violet-50' },
          { icon: RefreshCw, label: 'Sync Status', value: 'Idle', color: 'text-emerald-600 bg-emerald-50' },
          { icon: ShieldCheck, label: 'Access Level', value: 'Read/Write', color: 'text-amber-600 bg-amber-50' },
        ].map(({ icon: Icon, label, value, color }) => (
          <div key={label} className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
            <div className={`inline-flex h-10 w-10 items-center justify-center rounded-xl ${color}`}>
              <Icon className="h-5 w-5" />
            </div>
            <p className="mt-3 text-xs font-medium uppercase tracking-wide text-slate-500">{label}</p>
            <p className="mt-1 text-xl font-semibold text-slate-900">{value}</p>
          </div>
        ))}
      </div>

      <div className="rounded-2xl border border-dashed border-slate-300 bg-slate-50 p-12 text-center">
        <Table2 className="mx-auto h-10 w-10 text-slate-400" />
        <p className="mt-3 text-sm font-semibold text-slate-700">No database connections yet</p>
        <p className="mt-1 text-xs text-slate-500">
          Connect a PostgreSQL, MySQL, or MongoDB source to start querying your data.
        </p>
        <button className="mt-4 inline-flex items-center gap-2 rounded-xl bg-linear-to-r from-indigo-500 to-violet-600 px-4 py-2 text-sm font-medium text-white shadow hover:opacity-90 transition">
          <PlugZap className="h-4 w-4" />
          Add Connection
        </button>
      </div>
    </div>
  );
}
