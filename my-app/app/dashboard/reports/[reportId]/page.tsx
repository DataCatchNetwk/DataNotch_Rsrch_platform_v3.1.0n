"use client"

import Link from "next/link"
import { notFound, useParams } from "next/navigation"

import { ArtifactViewer } from "@/components/reports/artifact-viewer"
import { ReportChartsPanel } from "@/components/reports/report-charts-panel"
import { ReportMetricsGrid } from "@/components/reports/report-metrics-grid"
import { ReportSectionsPanel } from "@/components/reports/report-sections-panel"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { useReportDetails } from "@/hooks/use-report-details"

const STATUS_VARIANT: Record<string, "default" | "secondary" | "destructive"> = {
  READY: "default",
  PROCESSING: "secondary",
  FAILED: "destructive",
}

export default function ReportDetailsPage() {
  const params = useParams<{ reportId: string }>()
  const reportId = params?.reportId

  const { data, isLoading, isError } = useReportDetails(reportId)

  if (!reportId) {
    notFound()
  }

  return (
    <main className="space-y-6 p-4 md:p-6">
      <header className="flex flex-wrap items-center justify-between gap-3">
        <div className="space-y-1">
          <h1 className="text-2xl font-semibold">Report Details</h1>
          <p className="text-sm text-muted-foreground">Summary, charts, sections, and export artifacts.</p>
        </div>
        <Button asChild size="sm" variant="outline">
          <Link href="/dashboard/reports">Back to reports</Link>
        </Button>
      </header>

      {isLoading ? (
        <div className="flex h-40 items-center justify-center rounded-xl border">
          <p className="text-sm text-muted-foreground">Loading report...</p>
        </div>
      ) : null}
      {isError ? (
        <div className="rounded-xl border border-destructive/30 bg-destructive/5 p-4">
          <p className="text-sm text-destructive">Failed to load report details.</p>
        </div>
      ) : null}

      {data ? (
        <>
          {/* Hero card */}
          <section className="rounded-xl border bg-gradient-to-br from-indigo-50/60 to-violet-50/40 p-5 dark:from-indigo-950/20 dark:to-violet-950/10">
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div className="space-y-1">
                <h2 className="text-xl font-semibold">{data.title}</h2>
                {data.summary ? (
                  <p className="max-w-2xl text-sm text-muted-foreground">{data.summary}</p>
                ) : null}
              </div>
              <Badge variant={STATUS_VARIANT[data.status] ?? "secondary"}>{data.status}</Badge>
            </div>
            <div className="mt-3 flex flex-wrap gap-4 text-xs text-muted-foreground">
              <span>Created: {new Date(data.createdAt).toLocaleDateString()}</span>
              <span>Updated: {new Date(data.updatedAt).toLocaleDateString()}</span>
              {data.dataset ? <span>Dataset: {data.dataset.name}</span> : null}
              {data.analysisJob ? <span>Job: {data.analysisJob.title}</span> : null}
            </div>
          </section>

          {/* KPI metrics */}
          <ReportMetricsGrid metrics={data.metrics} />

          {/* Charts */}
          <ReportChartsPanel charts={data.charts} />

          {/* Text sections */}
          <ReportSectionsPanel sections={data.sections} />

          {/* Artifacts */}
          <ArtifactViewer artifacts={data.artifacts} />
        </>
      ) : null}
    </main>
  )
}
