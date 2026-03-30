"use client"

import { Card, CardContent } from "@/components/ui/card"
import type { ReportMetric } from "@/types/report"

export function ReportMetricsGrid({ metrics }: { metrics: ReportMetric[] }) {
  if (!metrics.length) return null

  return (
    <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
      {metrics.map((metric) => (
        <Card key={metric.label} className="shadow-sm">
          <CardContent className="p-5">
            <p className="text-sm text-muted-foreground">{metric.label}</p>
            <p className="text-2xl font-semibold">{metric.value}</p>
            {metric.helper ? <p className="mt-1 text-xs text-muted-foreground">{metric.helper}</p> : null}
          </CardContent>
        </Card>
      ))}
    </div>
  )
}
