import { api } from "@/lib/api/client"
import type {
  DatasetFilters,
  DatasetFileKind,
  DatasetItem,
  DatasetsResponse,
  DatasetStats,
} from "@/types/dataset"

function cleanParams(filters: DatasetFilters) {
  const params: Record<string, string | number> = {}

  if (filters.search) params.search = filters.search
  if (filters.visibility && filters.visibility !== "ALL") {
    if (filters.visibility === "PUBLIC") params.accessibility = "PUBLIC"
    if (filters.visibility === "RESTRICTED") params.accessibility = "RESTRICTED"
  }
  if (filters.domain) params.domain = filters.domain
  if (filters.source) params.source = filters.source
  if (filters.tags) params.tags = filters.tags
  if (filters.dateFrom) params.dateFrom = filters.dateFrom
  if (filters.dateTo) params.dateTo = filters.dateTo
  if (filters.page) params.page = filters.page
  if (filters.pageSize) params.pageSize = filters.pageSize
  if (filters.sortBy && filters.sortBy !== "popularity") params.sortBy = filters.sortBy
  if (filters.sortOrder) params.sortOrder = filters.sortOrder

  return params
}

async function resolveWorkspaceId() {
  const { data } = await api.get("/v1/workspaces/mine")
  const workspaceId = data?.workspaces?.[0]?.id
  if (!workspaceId || typeof workspaceId !== "string") {
    throw new Error("No workspace available for dataset upload")
  }

  return workspaceId
}

type DepositDatasetApiItem = {
  id: string
  name: string
  description?: string | null
  visibility?: "PRIVATE" | "TEAM" | "PUBLIC" | "RESTRICTED"
  depositStatus?: "DRAFT" | "AVAILABLE" | "ARCHIVED"
  mimeType?: string | null
  sizeBytes?: number | null
  rowCount?: number | null
  recordCount?: number | null
  columnCount?: number | null
  updatedAt?: string
  createdAt?: string
}

function mapFileKind(mimeType?: string | null): DatasetFileKind {
  const value = (mimeType || "").toLowerCase()
  if (value.includes("csv")) return "CSV"
  if (value.includes("json")) return "JSON"
  if (value.includes("excel") || value.includes("spreadsheet") || value.includes("xlsx")) return "XLSX"
  if (value.includes("tab-separated") || value.includes("tsv")) return "TSV"
  if (value.includes("zip")) return "ZIP"
  return "CSV"
}

function mapStatus(depositStatus?: DepositDatasetApiItem["depositStatus"]): DatasetItem["status"] {
  if (depositStatus === "AVAILABLE") return "READY"
  return "QUEUED"
}

function mapDataset(item: DepositDatasetApiItem): DatasetItem {
  const raw = item as DepositDatasetApiItem & {
    domain?: string | null
    sourceName?: string | null
    tags?: string[]
    isFavorite?: boolean
  }
  return {
    id: item.id,
    name: item.name,
    description: item.description ?? null,
    visibility: item.visibility ?? "PUBLIC",
    status: mapStatus(item.depositStatus),
    fileKind: mapFileKind(item.mimeType),
    sizeBytes: item.sizeBytes ?? 0,
    rowsCount: item.rowCount ?? item.recordCount ?? null,
    columnsCount: item.columnCount ?? null,
    createdAt: item.createdAt ?? item.updatedAt ?? new Date().toISOString(),
    updatedAt: item.updatedAt ?? item.createdAt ?? new Date().toISOString(),
    owner: null,
    domain: raw.domain ?? null,
    sourceName: raw.sourceName ?? null,
    tags: Array.isArray(raw.tags) ? raw.tags : [],
    isFavorite: Boolean(raw.isFavorite),
  }
}

export async function fetchDatasets(filters: DatasetFilters): Promise<DatasetsResponse> {
  const { data } = await api.get("/v1/datasets/deposit", {
    params: cleanParams(filters),
  })

  return {
    items: Array.isArray(data?.items) ? data.items.map(mapDataset) : [],
    total: Number(data?.total ?? 0),
    page: Number(data?.page ?? filters.page ?? 1),
    pageSize: Number(data?.pageSize ?? filters.pageSize ?? 10),
  }
}

export async function fetchDatasetStats(): Promise<DatasetStats> {
  const { data } = await api.get("/v1/datasets/deposit", {
    params: { page: 1, pageSize: 200 },
  })

  const items: DatasetItem[] = Array.isArray(data?.items) ? data.items.map(mapDataset) : []

  return {
    total: items.length,
    queued: items.filter((item) => item.status === "QUEUED").length,
    processing: items.filter((item) => item.status === "PROCESSING" || item.status === "UPLOADING").length,
    ready: items.filter((item) => item.status === "READY").length,
    failed: items.filter((item) => item.status === "FAILED").length,
    totalStorageBytes: items.reduce((sum, item) => sum + (item.sizeBytes || 0), 0),
  }
}

export async function uploadDataset(payload: {
  file: File
  name: string
  description?: string
  visibility: "PRIVATE" | "TEAM" | "PUBLIC" | "RESTRICTED"
}) {
  const workspaceId = await resolveWorkspaceId()

  const formData = new FormData()
  formData.append("file", payload.file)
  formData.append("name", payload.name)
  if (payload.description) formData.append("description", payload.description)
  formData.append("visibility", payload.visibility)

  const { data } = await api.post(`/v1/workspaces/${workspaceId}/datasets/upload`, formData, {
    headers: {
      "Content-Type": "multipart/form-data",
    },
  })

  return (data?.dataset ?? data) as DatasetItem
}

export async function deleteDataset(datasetId: string) {
  const { data } = await api.delete(`/v1/datasets/deposit/${datasetId}`)
  return data
}
