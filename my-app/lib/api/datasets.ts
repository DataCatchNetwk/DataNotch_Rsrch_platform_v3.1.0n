import { api } from "@/lib/api/client"
import type {
  DatasetFilters,
  DatasetItem,
  DatasetsResponse,
  DatasetStats,
} from "@/types/dataset"

function cleanParams(filters: DatasetFilters) {
  const params: Record<string, string | number> = {}

  if (filters.search) params.search = filters.search
  if (filters.visibility && filters.visibility !== "ALL") params.visibility = filters.visibility
  if (filters.status && filters.status !== "ALL") params.status = filters.status
  if (filters.fileKind && filters.fileKind !== "ALL") params.fileKind = filters.fileKind
  if (filters.dateFrom) params.dateFrom = filters.dateFrom
  if (filters.dateTo) params.dateTo = filters.dateTo
  if (filters.page) params.page = filters.page
  if (filters.pageSize) params.pageSize = filters.pageSize
  if (filters.sortBy) params.sortBy = filters.sortBy
  if (filters.sortOrder) params.sortOrder = filters.sortOrder

  return params
}

export async function fetchDatasets(filters: DatasetFilters): Promise<DatasetsResponse> {
  const { data } = await api.get("/datasets", {
    params: cleanParams(filters),
  })
  return data
}

export async function fetchDatasetStats(): Promise<DatasetStats> {
  const { data } = await api.get("/datasets/stats")
  return data
}

export async function uploadDataset(payload: {
  file: File
  name: string
  description?: string
  visibility: "PRIVATE" | "TEAM" | "PUBLIC" | "RESTRICTED"
}) {
  const formData = new FormData()
  formData.append("file", payload.file)
  formData.append("name", payload.name)
  if (payload.description) formData.append("description", payload.description)
  formData.append("visibility", payload.visibility)

  const { data } = await api.post("/datasets/upload", formData, {
    headers: {
      "Content-Type": "multipart/form-data",
    },
  })

  return data as DatasetItem
}

export async function deleteDataset(datasetId: string) {
  const { data } = await api.delete(`/datasets/${datasetId}`)
  return data
}
