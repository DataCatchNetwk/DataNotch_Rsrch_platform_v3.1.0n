'use client';

import { BrainCircuit, Cpu, BookOpen, TrendingUp } from 'lucide-react';

export default function ModelsPage() {
  return (
    <div className="space-y-8 p-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">Models</h1>
        <p className="mt-1 text-sm text-slate-500">
          Manage machine learning models, training runs, and model versions for research workflows.
        </p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {[
          { icon: BrainCircuit, label: 'Registered Models', value: '0', color: 'text-indigo-600 bg-indigo-50' },
          { icon: Cpu, label: 'Training Jobs', value: '0', color: 'text-violet-600 bg-violet-50' },
          { icon: TrendingUp, label: 'Deployed', value: '0', color: 'text-emerald-600 bg-emerald-50' },
          { icon: BookOpen, label: 'Experiments', value: '0', color: 'text-amber-600 bg-amber-50' },
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
        <BrainCircuit className="mx-auto h-10 w-10 text-slate-400" />
        <p className="mt-3 text-sm font-semibold text-slate-700">No models registered yet</p>
        <p className="mt-1 text-xs text-slate-500">
          Register a trained model or start a new training run to manage your ML workflow here.
        </p>
        <button className="mt-4 inline-flex items-center gap-2 rounded-xl bg-linear-to-r from-indigo-500 to-violet-600 px-4 py-2 text-sm font-medium text-white shadow hover:opacity-90 transition">
          <BrainCircuit className="h-4 w-4" />
          Register Model
        </button>
      </div>
    </div>
  );
}
