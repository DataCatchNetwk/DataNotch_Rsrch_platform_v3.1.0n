"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import type { PipelineMonitoringMetrics } from "@/src/lib/api/pipelines";

export function PipelineMetricsCards({ metrics }: { metrics: PipelineMonitoringMetrics }) {
  const cards = [
    { label: "Total", value: metrics.totalRuns },
    { label: "Running", value: metrics.runningRuns },
    { label: "Queued", value: metrics.queuedRuns },
    { label: "Failed", value: metrics.failedRuns },
    { label: "Success %", value: `${metrics.successRate}%` },
  ];

  return (
    <div className="grid gap-4 md:grid-cols-5">
      {cards.map((card) => (
        <Card className="rounded-2xl border-slate-200 bg-white shadow-sm" key={card.label}>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm text-slate-500">{card.label}</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold text-slate-900">{card.value}</p>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
