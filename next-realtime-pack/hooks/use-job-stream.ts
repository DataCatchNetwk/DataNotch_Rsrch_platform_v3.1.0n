"use client"

import * as React from "react"
import { useQueryClient } from "@tanstack/react-query"
import type {
  AnalysisJobDetails,
  AnalysisJobLogEntry,
  AnalysisJobStage,
  AnalysisJobSummary,
  AnalysisStreamEvent,
} from "@/types/analysis"

function isTerminal(status?: string | null) {
  return status === "SUCCEEDED" || status === "FAILED" || status === "CANCELLED"
}

export function useJobStream(jobId: string) {
  const queryClient = useQueryClient()
  const [connected, setConnected] = React.useState(false)
  const [lastEventAt, setLastEventAt] = React.useState<string | null>(null)

  React.useEffect(() => {
    if (!jobId) return

    const base = process.env.NEXT_PUBLIC_API_BASE_URL ?? "http://localhost:4000/api"
    const url = `${base}/analysis/jobs/${jobId}/stream`
    const source = new EventSource(url, { withCredentials: true })

    source.onopen = () => {
      setConnected(true)
    }

    source.onerror = () => {
      setConnected(false)
    }

    source.onmessage = (message) => {
      try {
        const event = JSON.parse(message.data) as AnalysisStreamEvent
        setLastEventAt(new Date().toISOString())

        queryClient.setQueryData(
          ["analysis-job", jobId],
          (current: AnalysisJobDetails | undefined) => {
            if (!current) return current

            switch (event.type) {
              case "job.updated":
              case "job.completed":
              case "job.failed": {
                const payload = event.payload as Partial<AnalysisJobDetails>
                return {
                  ...current,
                  ...payload,
                }
              }
              case "job.stage.updated": {
                const incoming = event.payload as AnalysisJobStage
                return {
                  ...current,
                  stages: current.stages.map((stage) =>
                    stage.key === incoming.key ? { ...stage, ...incoming } : stage
                  ),
                }
              }
              case "job.log": {
                const log = event.payload as AnalysisJobLogEntry
                return {
                  ...current,
                  logs: [...current.logs, log].slice(-300),
                }
              }
              default:
                return current
            }
          }
        )

        queryClient.setQueriesData(
          { queryKey: ["analysis-jobs"] },
          (current: { items?: AnalysisJobSummary[] } | undefined) => {
            if (!current?.items) return current
            const payload = event.payload as Partial<AnalysisJobSummary>
            return {
              ...current,
              items: current.items.map((item) =>
                item.id === jobId
                  ? {
                      ...item,
                      ...payload,
                    }
                  : item
              ),
            }
          }
        )
      } catch {
        // Ignore malformed SSE frames silently.
      }
    }

    return () => {
      source.close()
      setConnected(false)
    }
  }, [jobId, queryClient])

  const status = queryClient.getQueryData<AnalysisJobDetails>(["analysis-job", jobId])?.status

  return {
    connected,
    lastEventAt,
    isTerminal: isTerminal(status),
  }
}
