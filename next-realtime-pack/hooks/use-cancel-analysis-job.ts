"use client"

import { useMutation, useQueryClient } from "@tanstack/react-query"
import { cancelAnalysisJob } from "@/lib/api/analysis"

export function useCancelAnalysisJob() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: cancelAnalysisJob,
    onSuccess: async (_data, jobId) => {
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ["analysis-job", jobId] }),
        queryClient.invalidateQueries({ queryKey: ["analysis-jobs"] }),
      ])
    },
  })
}
