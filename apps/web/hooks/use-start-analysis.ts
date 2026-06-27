"use client"

import { useMutation } from "@tanstack/react-query"
import { startDatasetAnalysis } from "@/lib/api/dataset-details"

export function useStartAnalysis() {
  return useMutation({
    mutationFn: startDatasetAnalysis,
  })
}
