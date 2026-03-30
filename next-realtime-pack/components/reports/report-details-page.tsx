"use client"

import { useRouter } from "next/navigation"
import { format } from "date-fns"
import { ArrowLeft, RefreshCw } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { useReportDetails } from "@/hooks/use-report-details"
import { ReportMetricsGrid } from "@/components/reports/report-metrics-grid"
import { ReportSectionsPanel } from "@/components/reports/report-sections-panel"
import { ReportArtifactViewer } from "@/components/reports/report-artifact-viewer"
import { Badge } from "@/components/ui/badge"

export function ReportDetailsPage({ reportId }: { reportId: string }) {
  const router = useRouter()
  const { data, isLoading, isError, error, refetch } = useReportDetails(reportId)

  if (isLoading) {
    return (
      <div className="space-y-6 p-6">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="h-40 animate-pulse rounded-2xl bg-muted" />
        ))}
      </div>
    )
  }

  if (isError || !data) {
    return (
      <div className="p-6">
        <Card>
          <CardContent className="flex flex-col items-center gap-4 p-12 text-center">
            <p className="text-lg font-semibold">Unable to load report</p>
            <p className="text-sm text-muted-foreground">{(error as Error)?.message || "Unknown error"}</p>
            <Button onClick={() => refetch()}>Retry</Button>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="space-y-6 p-6">
      <div className="flex flex-col gap-4 xl:flex-row xl:items-center xl:justify-between">
        <div className="space-y-2">
          <Button variant="ghost" className="w-fit px-0" onClick={() => router.back()}>
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back
          </Button>
          <div className="flex flex-wrap items-center gap-3">
            <h1 className="text-3xl font-semibold tracking-tight">{data.title}</h1>
            <Badge>{data.status}</Badge>
          </div>
          <p className="text-sm text-muted-foreground">
            Created {format(new Date(data.createdAt), "PPP p")} · Dataset: {data.dataset?.name ?? "—"}
          </p>
        </div>

        <Button variant="outline" onClick={() => refetch()}>
          <RefreshCw className="mr-2 h-4 w-4" />
          Refresh
        </Button>
      </div>

      {data.summary ? (
        <Card className="rounded-2xl shadow-sm">
          <CardHeader>
            <CardTitle>Executive Summary</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground">{data.summary}</p>
          </CardContent>
        </Card>
      ) : null}

      <ReportMetricsGrid metrics={data.metrics} />
      <ReportSectionsPanel sections={data.sections} />
      <ReportArtifactViewer artifacts={data.artifacts} />
    </div>
  )
}
