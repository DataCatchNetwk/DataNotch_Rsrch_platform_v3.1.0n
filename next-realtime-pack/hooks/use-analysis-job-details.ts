"use client"

import { useQuery } from "@tanstack/react-query"
import { fetchAnalysisJob } from "@/lib/api/analysis"

export function useAnalysisJobDetails(jobId: string) {
  return useQuery({
    queryKey: ["analysis-job", jobId],
    queryFn: () => fetchAnalysisJob(jobId),
    enabled: !!jobId,
    refetchInterval: 10_000,
  })
}
