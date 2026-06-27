"use client"

import { useQuery } from "@tanstack/react-query"

import { fetchAnalysisJob } from "@/lib/api/analysis"

export function useAnalysisJobDetails(jobId?: string) {
  return useQuery({
    queryKey: ["analysis-job", jobId],
    queryFn: () => fetchAnalysisJob(jobId as string),
    enabled: Boolean(jobId),
    refetchInterval: (query) => {
      const status = query.state.data?.status
      return status === "RUNNING" || status === "QUEUED" ? 3000 : false
    },
  })
}
