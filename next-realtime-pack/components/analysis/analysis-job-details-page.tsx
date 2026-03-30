"use client"

import * as React from "react"
import { useRouter } from "next/navigation"
import { format } from "date-fns"
import { ArrowLeft, Ban, FileText, RefreshCw } from "lucide-react"
import { toast } from "sonner"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { AnalysisJobStatusBadge } from "@/components/analysis/analysis-job-status-badge"
import { AnalysisStageTimeline } from "@/components/analysis/analysis-stage-timeline"
import { AnalysisLiveLogPanel } from "@/components/analysis/analysis-live-log-panel"
import { AnalysisStreamStatus } from "@/components/analysis/analysis-stream-status"
import { Progress } from "@/components/ui/progress"
import { useAnalysisJobDetails } from "@/hooks/use-analysis-job-details"
import { useJobStream } from "@/hooks/use-job-stream"
import { useCancelAnalysisJob } from "@/hooks/use-cancel-analysis-job"

export function AnalysisJobDetailsPage({ jobId }: { jobId: string }) {
  const router = useRouter()
  const { data, isLoading, isError, error, refetch } = useAnalysisJobDetails(jobId)
  const { connected, isTerminal } = useJobStream(jobId)
  const cancelMutation = useCancelAnalysisJob()

  const onCancel = async () => {
    if (!data) return
    const ok = window.confirm(`Cancel job \"${data.title}\"?`)
    if (!ok) return
    try {
      await cancelMutation.mutateAsync(data.id)
      toast.success("Analysis job cancelled.")
    } catch (e) {
      toast.error((e as Error).message)
    }
  }

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
            <p className="text-lg font-semibold">Unable to load job details</p>
            <p className="text-sm text-muted-foreground">{(error as Error)?.message || "Unknown error"}</p>
            <Button onClick={() => refetch()}>Retry</Button>
          </CardContent>
        </Card>
      </div>
    )
  }

  const canCancel = data.status === "QUEUED" || data.status === "RUNNING"

  return (
    <div className="space-y-6 p-6">
      <div className="flex flex-col gap-4 xl:flex-row xl:items-center xl:justify-between">
        <div className="space-y-2">
          <Button variant="ghost" className="w-fit px-0" onClick={() => router.push("/analysis/jobs")}>
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Analysis Jobs
          </Button>
          <div className="flex flex-wrap items-center gap-3">
            <h1 className="text-3xl font-semibold tracking-tight">{data.title}</h1>
            <AnalysisJobStatusBadge status={data.status} />
            <AnalysisStreamStatus connected={connected} isTerminal={isTerminal} />
          </div>
          <p className="text-sm text-muted-foreground">
            Template: {data.templateName} · Dataset: {data.dataset?.name ?? "—"}
          </p>
        </div>

        <div className="flex flex-wrap gap-2">
          <Button variant="outline" onClick={() => refetch()}>
            <RefreshCw className="mr-2 h-4 w-4" />
            Refresh
          </Button>
          {data.reportId ? (
            <Button variant="outline" onClick={() => router.push(`/reports/${data.reportId}`)}>
              <FileText className="mr-2 h-4 w-4" />
              Open Report
            </Button>
          ) : null}
          {canCancel ? (
            <Button variant="destructive" onClick={onCancel} disabled={cancelMutation.isPending}>
              <Ban className="mr-2 h-4 w-4" />
              Cancel Job
            </Button>
          ) : null}
        </div>
      </div>

      <Card className="rounded-2xl shadow-sm">
        <CardHeader>
          <CardTitle>Run Summary</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
            <div>
              <p className="text-sm text-muted-foreground">Created</p>
              <p className="font-medium">{format(new Date(data.createdAt), "PPP p")}</p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Started</p>
              <p className="font-medium">{data.startedAt ? format(new Date(data.startedAt), "PPP p") : "—"}</p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Finished</p>
              <p className="font-medium">{data.finishedAt ? format(new Date(data.finishedAt), "PPP p") : "—"}</p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Owner</p>
              <p className="font-medium">{data.owner?.name ?? "System"}</p>
            </div>
          </div>
          <div>
            <div className="mb-2 flex items-center justify-between text-sm">
              <span className="text-muted-foreground">Overall progress</span>
              <span className="font-medium">{data.progressPercent}%</span>
            </div>
            <Progress value={data.progressPercent} />
          </div>
          {data.notes ? (
            <div>
              <p className="text-sm text-muted-foreground">Notes</p>
              <p className="text-sm">{data.notes}</p>
            </div>
          ) : null}
        </CardContent>
      </Card>

      <div className="grid gap-6 xl:grid-cols-3">
        <div className="space-y-6 xl:col-span-2">
          <AnalysisStageTimeline stages={data.stages} />
          <AnalysisLiveLogPanel logs={data.logs} />
        </div>
        <div className="space-y-6">
          <Card className="rounded-2xl shadow-sm">
            <CardHeader>
              <CardTitle>Execution Parameters</CardTitle>
            </CardHeader>
            <CardContent>
              <pre className="overflow-auto rounded-xl border bg-muted/30 p-4 text-xs">
{JSON.stringify(data.parameters ?? {}, null, 2)}
              </pre>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
