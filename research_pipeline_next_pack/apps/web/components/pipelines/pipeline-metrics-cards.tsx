'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import type { PipelineMetrics } from '@/lib/types/pipeline';

export function PipelineMetricsCards({ metrics }: { metrics: PipelineMetrics }) {
  const cards = [
    { label: 'Total Pipelines', value: metrics.total },
    { label: 'Queued', value: metrics.queued },
    { label: 'Running', value: metrics.running },
    { label: 'Completed', value: metrics.completed },
    { label: 'Failed', value: metrics.failed },
  ];

  return (
    <div className="grid gap-4 md:grid-cols-5">
      {cards.map((card) => (
        <Card key={card.label} className="rounded-2xl">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm text-muted-foreground">{card.label}</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold">{card.value}</p>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
