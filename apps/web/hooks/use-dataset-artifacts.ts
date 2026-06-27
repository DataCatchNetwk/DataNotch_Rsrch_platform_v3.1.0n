"use client"

import { useQuery } from "@tanstack/react-query"
import { fetchDatasetArtifacts } from "@/lib/api/dataset-details"

export function useDatasetArtifacts(datasetId: string) {
  return useQuery({
    queryKey: ["dataset-artifacts", datasetId],
    queryFn: () => fetchDatasetArtifacts(datasetId),
    enabled: !!datasetId,
  })
}
