"use client"

import { useQuery } from "@tanstack/react-query"
import { fetchAnalysisJobs } from "@/lib/api/analysis"
import type { AnalysisJobFilters } from "@/types/analysis"

export function useAnalysisJobs(filters: AnalysisJobFilters) {
  return useQuery({
    queryKey: ["analysis-jobs", filters],
    queryFn: () => fetchAnalysisJobs(filters),
    placeholderData: (previous) => previous,
    refetchInterval: 15_000,
  })
}
