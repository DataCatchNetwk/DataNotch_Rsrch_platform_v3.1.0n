'use client';

import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import type { MonitoringLogItem } from '@/lib/api/system-monitoring-api-client';

function logBadge(level: MonitoringLogItem['level']) {
  if (level === 'INFO') return <Badge variant="secondary">INFO</Badge>;
  if (level === 'WARN') return <Badge className="border-amber-200 bg-amber-50 text-amber-700">WARN</Badge>;
  return <Badge className="border-red-200 bg-red-50 text-red-700">ERROR</Badge>;
}

export function MonitoringLogsPanel({ logs }: { logs: MonitoringLogItem[] }) {
  return (
    <Card className="rounded-xl border-0 shadow-sm">
      <CardHeader>
        <CardTitle>Live Activity & Logs</CardTitle>
        <CardDescription>Recent runtime events, warnings, and service-level messages.</CardDescription>
      </CardHeader>
      <CardContent className="space-y-2.5">
        {logs.map((log) => (
          <div key={log.id} className="rounded-xl border bg-white p-3">
            <div className="flex items-center justify-between gap-3">
              <div className="flex items-center gap-2">
                {logBadge(log.level)}
                <span className="text-sm font-medium text-slate-800">{log.source}</span>
              </div>
              <span className="text-xs text-slate-500">{log.time}</span>
            </div>
            <p className="mt-1.5 text-sm text-slate-700">{log.message}</p>
          </div>
        ))}
      </CardContent>
    </Card>
  );
}