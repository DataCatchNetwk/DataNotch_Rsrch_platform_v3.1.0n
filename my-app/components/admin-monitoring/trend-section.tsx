'use client';

import {
  Line,
  LineChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import type { MonitoringMetrics } from '@/lib/api/system-monitoring-api-client';

export function MonitoringTrendSection({ metrics }: { metrics: MonitoringMetrics }) {
  return (
    <Card className="rounded-xl border-0 shadow-sm">
      <CardHeader>
        <CardTitle>Trend Monitoring</CardTitle>
        <CardDescription>Rolling activity across latency, CPU, memory, and queue depth.</CardDescription>
      </CardHeader>
      <CardContent className="grid gap-5 xl:grid-cols-2">
        {[
          ['API Latency', metrics.apiLatencyTrend],
          ['CPU Load', metrics.cpuTrend],
          ['Memory Usage', metrics.memoryTrend],
          ['Queue Depth', metrics.queueTrend],
        ].map(([title, data]) => (
          <div key={String(title)} className="space-y-2.5">
            <p className="text-sm font-medium text-slate-700">{String(title)}</p>
            <div className="h-52 rounded-xl border bg-white p-3">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={data as Array<{ label: string; value: number }>}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="label" />
                  <YAxis />
                  <Tooltip />
                  <Line type="monotone" dataKey="value" strokeWidth={2} dot={false} />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </div>
        ))}
      </CardContent>
    </Card>
  );
}