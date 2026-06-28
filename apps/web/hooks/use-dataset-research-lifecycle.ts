"use client"

import { useQuery } from "@tanstack/react-query"
import { fetchDatasetResearchLifecycle } from "@/lib/api/research-lifecycle"

export function useDatasetResearchLifecycle(datasetId: string) {
  return useQuery({
    queryKey: ["dataset-research-lifecycle", datasetId],
    queryFn: () => fetchDatasetResearchLifecycle(datasetId),
    enabled: !!datasetId,
    refetchOnWindowFocus: false,
  })
}
