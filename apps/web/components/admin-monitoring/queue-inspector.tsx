'use client';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import type { QueueBreakdown } from '@/lib/api/system-monitoring-api-client';

export function MonitoringQueueInspector({ queue }: { queue: QueueBreakdown }) {
  return (
    <Card className="rounded-xl border-0 shadow-sm">
      <CardHeader>
        <CardTitle>Queue Inspector</CardTitle>
        <CardDescription>Breakdown of current queue state across execution stages.</CardDescription>
      </CardHeader>
      <CardContent className="grid gap-2.5">
        {[
          ['Queued', queue.queued],
          ['Processing', queue.processing],
          ['Failed', queue.failed],
          ['Delayed', queue.delayed],
          ['Completed', queue.completed],
        ].map(([label, value]) => (
          <div key={String(label)} className="flex items-center justify-between rounded-xl border bg-slate-50 p-3">
            <span className="text-sm font-medium text-slate-700">{label}</span>
            <span className="text-lg font-semibold text-slate-950">{String(value)}</span>
          </div>
        ))}
      </CardContent>
    </Card>
  );
}