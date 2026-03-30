import { api } from "@/lib/api/client"
import type {
  DatasetArtifactsResponse,
  DatasetDetails,
  StartAnalysisPayload,
  StartAnalysisResponse,
} from "@/types/dataset-details"

export async function fetchDatasetDetails(datasetId: string): Promise<DatasetDetails> {
  const { data } = await api.get(`/datasets/${datasetId}`)
  return data
}

export async function fetchDatasetArtifacts(datasetId: string): Promise<DatasetArtifactsResponse> {
  const { data } = await api.get(`/datasets/${datasetId}/artifacts`)
  return data
}

export async function startDatasetAnalysis(
  payload: StartAnalysisPayload
): Promise<StartAnalysisResponse> {
  const { data } = await api.post(`/analysis/jobs`, payload)
  return data
}

export async function uploadDatasetWithProgress(
  payload: {
    file: File
    name: string
    description?: string
    visibility: "PRIVATE" | "TEAM" | "PUBLIC" | "RESTRICTED"
    workspaceId?: string
  },
  onProgress?: (percent: number) => void
) {
  const formData = new FormData()
  formData.append("file", payload.file)
  formData.append("name", payload.name)
  if (payload.description) formData.append("description", payload.description)
  formData.append("visibility", payload.visibility)
  if (payload.workspaceId) formData.append("workspaceId", payload.workspaceId)

  const { data } = await api.post(`/datasets/upload`, formData, {
    headers: {
      "Content-Type": "multipart/form-data",
    },
    onUploadProgress(progressEvent) {
      const total = progressEvent.total ?? 0
      const loaded = progressEvent.loaded ?? 0
      if (!total) return
      const percent = Math.round((loaded / total) * 100)
      onProgress?.(percent)
    },
  })

  return data
}
