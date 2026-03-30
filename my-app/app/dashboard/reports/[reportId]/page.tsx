"use client"

import Link from "next/link"
import { notFound, useParams } from "next/navigation"

import { ArtifactViewer } from "@/components/reports/artifact-viewer"
import { ReportMetricsGrid } from "@/components/reports/report-metrics-grid"
import { ReportSectionsPanel } from "@/components/reports/report-sections-panel"
import { Button } from "@/components/ui/button"
import { useReportDetails } from "@/hooks/use-report-details"

export default function ReportDetailsPage() {
  const params = useParams<{ reportId: string }>()
  const reportId = params?.reportId

  const { data, isLoading, isError } = useReportDetails(reportId)

  if (!reportId) {
    notFound()
  }

  return (
    <main className="space-y-4 p-4 md:p-6">
      <header className="flex flex-wrap items-center justify-between gap-3">
        <div className="space-y-1">
          <h1 className="text-2xl font-semibold">Report Details</h1>
          <p className="text-sm text-muted-foreground">Summary, sections, and export artifacts.</p>
        </div>
        <Button asChild size="sm" variant="outline">
          <Link href="/dashboard/reports">Back to reports</Link>
        </Button>
      </header>

      {isLoading ? <p className="text-sm text-muted-foreground">Loading report...</p> : null}
      {isError ? <p className="text-sm text-red-600">Failed to load report details.</p> : null}

      {data ? (
        <>
          <section className="rounded-lg border p-4">
            <h2 className="text-lg font-semibold">{data.title}</h2>
            <p className="mt-1 text-sm text-muted-foreground">Status: {data.status}</p>
            {data.summary ? <p className="mt-2 text-sm text-muted-foreground">{data.summary}</p> : null}
          </section>
          <ReportMetricsGrid metrics={data.metrics} />
          <ReportSectionsPanel sections={data.sections} />
          <ArtifactViewer artifacts={data.artifacts} />
        </>
      ) : null}
    </main>
  )
}
