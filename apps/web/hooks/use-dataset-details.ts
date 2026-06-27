"use client"

import { useQuery } from "@tanstack/react-query"
import { fetchDatasetDetails } from "@/lib/api/dataset-details"

export function useDatasetDetails(datasetId: string) {
  return useQuery({
    queryKey: ["dataset-details", datasetId],
    queryFn: () => fetchDatasetDetails(datasetId),
    enabled: !!datasetId,
    refetchOnWindowFocus: false,
  })
}
