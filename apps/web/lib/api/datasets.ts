import { api } from "@/lib/api/client"
import type {
  DatasetFilters,
  DatasetFileKind,
  DatasetItem,
  DatasetOwner,
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

function isNotFoundError(error: unknown) {
  if (typeof error !== "object" || error === null) {
    return false
  }

  const candidate = error as { response?: { status?: number }; message?: string }
  return candidate.response?.status === 404 || /status code 404|not found/i.test(candidate.message ?? "")
}

async function resolveWorkspaceId() {
  const { data } = await api.get("/v1/workspaces/mine")
  const workspaceId = data?.workspaces?.[0]?.id
  if (!workspaceId || typeof workspaceId !== "string") {
    const created = await api.post("/v1/workspaces", {
      name: "Research Data Workspace",
      description: "Default workspace for uploaded research datasets.",
    })
    const createdWorkspaceId = created.data?.workspace?.id
    if (typeof createdWorkspaceId === "string" && createdWorkspaceId.length > 0) {
      return createdWorkspaceId
    }

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

type WorkspaceDatasetApiItem = Omit<DepositDatasetApiItem, "visibility"> & {
  storagePath?: string | null
  createdBy?: DatasetOwner | null
  visibility?: DepositDatasetApiItem["visibility"] | "WORKSPACE"
  sourceName?: string | null
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

function mapUploadVisibility(visibility: "PRIVATE" | "TEAM" | "PUBLIC" | "RESTRICTED") {
  return visibility === "TEAM" ? "WORKSPACE" : visibility
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

function mapWorkspaceDataset(item: WorkspaceDatasetApiItem): DatasetItem {
  const visibility = item.visibility === "WORKSPACE" ? "TEAM" : item.visibility

  return {
    ...mapDataset({
      ...item,
      depositStatus: item.depositStatus ?? "AVAILABLE",
      visibility,
    } as DepositDatasetApiItem),
    owner: item.createdBy ?? null,
    sourceName: item.sourceName ?? "Workspace Upload",
  }
}

async function fetchWorkspaceDatasets() {
  try {
    const mine = await api.get("/v1/workspaces/mine")
    const workspaceIds: string[] = Array.isArray(mine.data?.workspaces)
      ? mine.data.workspaces
          .map((workspace: { id?: unknown }) => workspace.id)
          .filter((id: unknown): id is string => typeof id === "string" && id.length > 0)
      : []

    const responses = await Promise.all(
      workspaceIds.map((workspaceId) => api.get(`/v1/workspaces/${workspaceId}/datasets`))
    )

    return responses.flatMap((response) =>
      Array.isArray(response.data?.datasets)
        ? response.data.datasets.map((item: WorkspaceDatasetApiItem) => mapWorkspaceDataset(item))
        : []
    )
  } catch {
    return []
  }
}

function applyClientFilters(items: DatasetItem[], filters: DatasetFilters) {
  const search = filters.search?.trim().toLowerCase()

  return items.filter((item) => {
    if (search) {
      const haystack = [
        item.name,
        item.description,
        item.domain,
        item.sourceName,
        ...(item.tags ?? []),
      ]
        .filter(Boolean)
        .join(" ")
        .toLowerCase()

      if (!haystack.includes(search)) return false
    }

    if (filters.visibility && filters.visibility !== "ALL" && item.visibility !== filters.visibility) return false
    if (filters.status && filters.status !== "ALL" && item.status !== filters.status) return false
    if (filters.fileKind && filters.fileKind !== "ALL" && item.fileKind !== filters.fileKind) return false
    if (filters.domain && item.domain !== filters.domain) return false
    if (filters.source && item.sourceName !== filters.source) return false

    return true
  })
}

function sortDatasets(items: DatasetItem[], filters: DatasetFilters) {
  const direction = filters.sortOrder === "asc" ? 1 : -1
  const sortBy = filters.sortBy ?? "createdAt"

  return items.slice().sort((a, b) => {
    const aValue = a[sortBy as keyof DatasetItem]
    const bValue = b[sortBy as keyof DatasetItem]

    if (typeof aValue === "number" && typeof bValue === "number") {
      return (aValue - bValue) * direction
    }

    return String(aValue ?? "").localeCompare(String(bValue ?? "")) * direction
  })
}

export async function fetchDatasets(filters: DatasetFilters): Promise<DatasetsResponse> {
  const [{ data }, workspaceItems] = await Promise.all([
    api.get("/v1/datasets/deposit", {
      params: { ...cleanParams(filters), page: 1, pageSize: 200 },
    }),
    fetchWorkspaceDatasets(),
  ])

  const depositItems: DatasetItem[] = Array.isArray(data?.items) ? data.items.map(mapDataset) : []
  const byId = new Map<string, DatasetItem>()
  ;[...workspaceItems, ...depositItems].forEach((item) => byId.set(item.id, item))

  const page = Number(filters.page ?? 1)
  const pageSize = Number(filters.pageSize ?? 10)
  const filtered = applyClientFilters(Array.from(byId.values()), filters)
  const sorted = sortDatasets(filtered, filters)

  return {
    items: sorted.slice((page - 1) * pageSize, page * pageSize),
    total: filtered.length,
    page,
    pageSize,
  }
}

export async function fetchDatasetStats(): Promise<DatasetStats> {
  const [{ data }, workspaceItems] = await Promise.all([
    api.get("/v1/datasets/deposit", {
      params: { page: 1, pageSize: 200 },
    }),
    fetchWorkspaceDatasets(),
  ])

  const depositItems: DatasetItem[] = Array.isArray(data?.items) ? data.items.map(mapDataset) : []
  const byId = new Map<string, DatasetItem>()
  ;[...workspaceItems, ...depositItems].forEach((item) => byId.set(item.id, item))
  const items = Array.from(byId.values())

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
  formData.append("visibility", mapUploadVisibility(payload.visibility))
  formData.append("autoRunPipeline", "false")

  try {
    const { data } = await api.post(`/v1/workspaces/${workspaceId}/datasets/upload`, formData)
    return (data?.dataset ?? data) as DatasetItem
  } catch (error) {
    if (!isNotFoundError(error)) {
      throw error
    }

    const retryFormData = new FormData()
    retryFormData.append("file", payload.file)
    retryFormData.append("name", payload.name)
    if (payload.description) retryFormData.append("description", payload.description)
    retryFormData.append("visibility", mapUploadVisibility(payload.visibility))
    retryFormData.append("autoRunPipeline", "false")

    const { data } = await api.post(`/workspaces/${workspaceId}/datasets/upload`, retryFormData)
    return (data?.dataset ?? data) as DatasetItem
  }
}

export async function deleteDataset(datasetId: string) {
  const { data } = await api.delete(`/v1/datasets/deposit/${datasetId}`)
  return data
}
