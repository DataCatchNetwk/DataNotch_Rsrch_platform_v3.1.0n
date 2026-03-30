"use client"

import { useQuery } from "@tanstack/react-query"
import { fetchDatasets, fetchDatasetStats } from "@/lib/api/datasets"
import type { DatasetFilters } from "@/types/dataset"

export function useDatasets(filters: DatasetFilters) {
  return useQuery({
    queryKey: ["datasets", filters],
    queryFn: () => fetchDatasets(filters),
    placeholderData: (previousData) => previousData,
  })
}

export function useDatasetStats() {
  return useQuery({
    queryKey: ["dataset-stats"],
    queryFn: fetchDatasetStats,
  })
}
