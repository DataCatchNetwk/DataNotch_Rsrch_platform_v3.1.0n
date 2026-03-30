import type { ReportMetric } from "@/types/report"

export function ReportMetricsGrid({ metrics }: { metrics: ReportMetric[] }) {
  return (
    <section className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
      {metrics.map((metric) => (
        <article key={metric.label} className="rounded-lg border p-3">
          <p className="text-xs text-muted-foreground">{metric.label}</p>
          <p className="mt-1 text-xl font-semibold">{metric.value}</p>
          {metric.helper ? <p className="mt-1 text-xs text-muted-foreground">{metric.helper}</p> : null}
        </article>
      ))}
    </section>
  )
}
