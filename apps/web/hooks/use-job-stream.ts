"use client"

import { useEffect, useMemo, useState } from "react"

import { apiPathUrl } from "@/lib/api-base"
import type { AnalysisStreamEvent } from "@/types/analysis"

type StreamState = "connecting" | "open" | "closed" | "error"

export function useJobStream(jobId?: string) {
  const [state, setState] = useState<StreamState>("closed")
  const [events, setEvents] = useState<AnalysisStreamEvent[]>([])

  const streamUrl = useMemo(() => {
    if (!jobId) return null
    return apiPathUrl(`/analysis/jobs/${jobId}/stream`)
  }, [jobId])

  useEffect(() => {
    if (!streamUrl) return

    const eventSource = new EventSource(streamUrl, { withCredentials: true })
    setState("connecting")

    eventSource.onopen = () => {
      setState("open")
    }

    eventSource.onmessage = (event) => {
      try {
        const parsed = JSON.parse(event.data) as AnalysisStreamEvent
        setEvents((current) => [...current.slice(-499), parsed])
      } catch {
        // Ignore malformed events from non-standard servers.
      }
    }

    eventSource.onerror = () => {
      setState("error")
    }

    return () => {
      eventSource.close()
      setState("closed")
    }
  }, [streamUrl])

  return {
    state,
    events,
  }
}
