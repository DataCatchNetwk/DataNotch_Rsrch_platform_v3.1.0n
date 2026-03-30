'use client';

import { BarChart3, CheckCircle2, Clock, Download } from 'lucide-react';

export default function ResultsPage() {
  return (
    <div className="space-y-8 p-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">Results</h1>
        <p className="mt-1 text-sm text-slate-500">
          View outputs and findings from completed analysis jobs, models, and pipeline runs.
        </p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {[
          { icon: BarChart3, label: 'Total Results', value: '0', color: 'text-indigo-600 bg-indigo-50' },
          { icon: CheckCircle2, label: 'Successful', value: '0', color: 'text-emerald-600 bg-emerald-50' },
          { icon: Clock, label: 'Processing', value: '0', color: 'text-amber-600 bg-amber-50' },
          { icon: Download, label: 'Ready to Export', value: '0', color: 'text-violet-600 bg-violet-50' },
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
        <BarChart3 className="mx-auto h-10 w-10 text-slate-400" />
        <p className="mt-3 text-sm font-semibold text-slate-700">No results yet</p>
        <p className="mt-1 text-xs text-slate-500">
          Run an analysis job or pipeline to see its output results here.
        </p>
      </div>
    </div>
  );
}
