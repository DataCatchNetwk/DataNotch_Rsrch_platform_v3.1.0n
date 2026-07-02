"use client"

import { useMutation, useQueryClient } from "@tanstack/react-query"
import { uploadDataset, deleteDataset } from "@/lib/api/datasets"

export function useUploadDataset() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: uploadDataset,
    onSuccess: async () => {
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ["datasets"] }),
        queryClient.invalidateQueries({ queryKey: ["dataset-stats"] }),
        queryClient.invalidateQueries({ queryKey: ["workspace"] }),
        queryClient.invalidateQueries({ queryKey: ["workspaces"] }),
        queryClient.invalidateQueries({ queryKey: ["workspace-datasets"] }),
        queryClient.invalidateQueries({ queryKey: ["workspace-detail"] }),
      ])
    },
  })
}

export function useDeleteDataset() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: deleteDataset,
    onSuccess: async () => {
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ["datasets"] }),
        queryClient.invalidateQueries({ queryKey: ["dataset-stats"] }),
      ])
    },
  })
}
