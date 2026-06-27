'use client';

import { Activity, AlertTriangle, CheckCircle2 } from 'lucide-react';
import type { MonitoringAlert } from '@/lib/api/system-monitoring-api-client';

function alertToneClass(tone: MonitoringAlert['tone']) {
  switch (tone) {
    case 'healthy':
      return 'border-emerald-200 bg-emerald-50';
    case 'warning':
      return 'border-amber-200 bg-amber-50';
    case 'critical':
      return 'border-red-200 bg-red-50';
    default:
      return 'border-slate-200 bg-slate-50';
  }
}

export function MonitoringAlertsStrip({ alerts }: { alerts: MonitoringAlert[] }) {
  return (
    <section className="grid gap-3 lg:grid-cols-2 xl:grid-cols-3">
      {alerts.map((item) => (
        <div key={item.id} className={`rounded-xl border p-3 shadow-sm ${alertToneClass(item.tone)}`}>
          <div className="flex items-start gap-3">
            {item.tone === 'critical' ? <AlertTriangle className="mt-0.5 h-4 w-4 text-red-700" /> : item.tone === 'warning' ? <Activity className="mt-0.5 h-4 w-4 text-amber-700" /> : <CheckCircle2 className="mt-0.5 h-4 w-4 text-emerald-700" />}
            <div>
              <p className="text-sm font-semibold text-slate-950">{item.title}</p>
              <p className="mt-1 text-xs text-slate-600 md:text-sm">{item.text}</p>
            </div>
          </div>
        </div>
      ))}
    </section>
  );
}