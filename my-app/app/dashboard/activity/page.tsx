'use client';

import { History, User, Clock, Filter } from 'lucide-react';
import { ProtectedRoute } from '@/components/protected-route';

export default function ActivityLogPage() {
  return (
    <ProtectedRoute routeKey="ACTIVITY">
      <div className="space-y-8 p-6">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Activity Log</h1>
          <p className="mt-1 text-sm text-slate-500">
            Full audit trail of user actions, system events, and platform activity.
          </p>
        </div>

        <div className="grid gap-4 sm:grid-cols-3">
          {[
            { icon: History, label: 'Total Events', value: '—', color: 'text-indigo-600 bg-indigo-50' },
            { icon: User, label: 'Active Users Today', value: '—', color: 'text-violet-600 bg-violet-50' },
            { icon: Clock, label: 'Last 24 Hours', value: '—', color: 'text-emerald-600 bg-emerald-50' },
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

        <div className="rounded-2xl border border-slate-200 bg-white shadow-sm">
          <div className="flex items-center justify-between border-b border-slate-200 px-5 py-4">
            <h2 className="text-sm font-semibold text-slate-800">Recent Activity</h2>
            <button className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 px-3 py-1.5 text-xs font-medium text-slate-600 hover:bg-slate-50 transition">
              <Filter className="h-3.5 w-3.5" />
              Filter
            </button>
          </div>
          <div className="p-12 text-center text-slate-400">
            <History className="mx-auto h-8 w-8 mb-2" />
            <p className="text-sm">No activity recorded yet.</p>
          </div>
        </div>
      </div>
    </ProtectedRoute>
  );
}
