"use client"

import Link from "next/link"
import { notFound, useParams } from "next/navigation"

import { LiveLogPanel } from "@/components/analysis/live-log-panel"
import { JobStatusBadge } from "@/components/analysis/job-status-badge"
import { StageTimeline } from "@/components/analysis/stage-timeline"
import { StreamStatusBadge } from "@/components/analysis/stream-status-badge"
import { Button } from "@/components/ui/button"
import { useAnalysisJobDetails } from "@/hooks/use-analysis-job-details"
import { useCancelAnalysisJob } from "@/hooks/use-cancel-analysis-job"
import { useJobStream } from "@/hooks/use-job-stream"

export default function AnalysisJobDetailsPage() {
  const params = useParams<{ jobId: string }>()
  const jobId = params?.jobId

  const { data, isLoading, isError } = useAnalysisJobDetails(jobId)
  const cancelMutation = useCancelAnalysisJob()
  const stream = useJobStream(jobId)

  if (!jobId) {
    notFound()
  }

  return (
    <main className="space-y-4 p-4 md:p-6">
      <header className="flex flex-wrap items-center justify-between gap-3">
        <div className="space-y-1">
          <h1 className="text-2xl font-semibold">Job Details</h1>
          <p className="text-sm text-muted-foreground">Live stage and log stream for the selected analysis job.</p>
        </div>
        <Button asChild variant="outline" size="sm">
          <Link href="/dashboard/analysis/jobs">Back to jobs</Link>
        </Button>
      </header>

      {isLoading ? <p className="text-sm text-muted-foreground">Loading job...</p> : null}
      {isError ? <p className="text-sm text-red-600">Failed to load job details.</p> : null}

      {data ? (
        <>
          <section className="rounded-lg border p-4">
            <div className="flex flex-wrap items-center gap-2">
              <h2 className="text-lg font-semibold">{data.title}</h2>
              <JobStatusBadge status={data.status} />
              <StreamStatusBadge state={stream.state} />
            </div>
            <p className="mt-2 text-sm text-muted-foreground">Template: {data.templateName}</p>
            <p className="text-sm text-muted-foreground">Progress: {data.progressPercent}%</p>
            <div className="mt-3 flex flex-wrap gap-2">
              <Button
                size="sm"
                variant="destructive"
                disabled={cancelMutation.isPending || data.status !== "RUNNING"}
                onClick={() => cancelMutation.mutate(data.id)}
              >
                Cancel job
              </Button>
              {data.reportId ? (
                <Button asChild size="sm" variant="outline">
                  <Link href={`/dashboard/reports/${data.reportId}`}>Open report</Link>
                </Button>
              ) : null}
            </div>
          </section>

          <section className="grid gap-4 lg:grid-cols-2">
            <div className="rounded-lg border p-4">
              <h3 className="mb-3 text-sm font-semibold">Stage Timeline</h3>
              <StageTimeline stages={data.stages} />
            </div>
            <LiveLogPanel logs={data.logs} streamEvents={stream.events} />
          </section>
        </>
      ) : null}
    </main>
  )
}
