'use client';

import { Card, CardContent } from '@/components/ui/card';
import type { MonitoringMetrics } from '@/lib/api/system-monitoring-api-client';

export function MonitoringMetricsGrid({ metrics }: { metrics: MonitoringMetrics }) {
  return (
    <section className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
      {[
        ['API Latency (ms)', metrics.apiLatencyMs, 'Current request latency'],
        ['Worker Status', metrics.workerStatus, 'Worker runtime state'],
        ['Queue Depth', metrics.queueDepth, 'Pending and in-flight jobs'],
        ['Failure Rate (%)', metrics.failureRate, 'Error ratio across recent jobs'],
        ['CPU Load (%)', metrics.cpuLoad, 'Application compute usage'],
        ['Memory Usage (%)', metrics.memoryUsage, 'Current memory pressure'],
      ].map(([label, value, helper]) => (
        <Card key={String(label)} className="rounded-xl border-0 shadow-sm">
          <CardContent className="p-4">
            <p className="text-sm font-medium text-slate-500">{label}</p>
            <p className="mt-2 text-3xl font-semibold tracking-tight text-slate-950">{String(value)}</p>
            <p className="mt-1.5 text-xs text-slate-600 md:text-sm">{helper}</p>
          </CardContent>
        </Card>
      ))}
    </section>
  );
}