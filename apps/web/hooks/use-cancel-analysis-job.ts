"use client"

import { useMutation, useQueryClient } from "@tanstack/react-query"

import { cancelAnalysisJob } from "@/lib/api/analysis"

export function useCancelAnalysisJob() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (jobId: string) => cancelAnalysisJob(jobId),
    onSuccess: (_, jobId) => {
      queryClient.invalidateQueries({ queryKey: ["analysis-jobs"] })
      queryClient.invalidateQueries({ queryKey: ["analysis-job", jobId] })
    },
  })
}
