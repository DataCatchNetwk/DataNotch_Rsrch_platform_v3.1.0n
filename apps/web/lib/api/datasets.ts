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

export async function listUploadWorkspaces(): Promise<Array<{ id: string; name: string }>> {
  const { data } = await api.get("/v1/workspaces/mine")
  const workspaces = Array.isArray(data?.workspaces) ? data.workspaces : []
  return workspaces
    .map((workspace: { id?: unknown; name?: unknown }) => ({
      id: typeof workspace.id === "string" ? workspace.id : "",
      name: typeof workspace.name === "string" ? workspace.name : "Workspace",
    }))
    .filter((workspace: { id: string }) => workspace.id.length > 0)
}

type DepositDatasetApiItem = {
  id: string
  name: string
  description?: string | null
  workspaceId?: string | null
  workspace?: { id?: unknown; name?: unknown } | null
  visibility?: "PRIVATE" | "TEAM" | "WORKSPACE" | "PUBLIC" | "RESTRICTED"
  depositStatus?: "DRAFT" | "AVAILABLE" | "ARCHIVED"
  storagePath?: string | null
  mimeType?: string | null
  sourceName?: string | null
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
  if (value.includes("fhir")) return "FHIR"
  if (value.includes("geojson")) return "GEOJSON"
  if (value.includes("xml")) return "XML"
  if (value.includes("parquet")) return "PARQUET"
  if (value.includes("pdf")) return "PDF"
  if (value.includes("text") || value.includes("plain")) return "TXT"
  if (value.includes("nifti") || value.includes("dicom") || value.includes("image/nii")) return "IMAGING"
  if (value.includes("csv")) return "CSV"
  if (value.includes("json")) return "JSON"
  if (value.includes("excel") || value.includes("spreadsheet") || value.includes("xlsx")) return "XLSX"
  if (value.includes("tab-separated") || value.includes("tsv")) return "TSV"
  if (value.includes("zip")) return "ZIP"
  return "CSV"
}

function mapStatus(item: Pick<DepositDatasetApiItem, "depositStatus" | "storagePath" | "sizeBytes" | "sourceName">): DatasetItem["status"] {
  const hasStoredUpload = Boolean(item.storagePath) || Boolean(item.sizeBytes && item.sizeBytes > 0) || /upload/i.test(item.sourceName ?? "")
  if (item.depositStatus === "AVAILABLE" || (item.depositStatus === "DRAFT" && hasStoredUpload)) return "READY"
  return "QUEUED"
}

function mapDatasetVisibility(visibility?: DepositDatasetApiItem["visibility"]): DatasetItem["visibility"] {
  return visibility === "WORKSPACE" ? "TEAM" : visibility ?? "PUBLIC"
}

function mapUploadVisibility(visibility: "PRIVATE" | "TEAM" | "PUBLIC" | "RESTRICTED") {
  return visibility === "TEAM" ? "WORKSPACE" : visibility
}

const LAST_DATASET_WORKSPACE_KEY = "datanotch:last-dataset-workspace-id"

export function getSavedDatasetWorkspaceId() {
  if (typeof window === "undefined") return null
  return window.localStorage.getItem(LAST_DATASET_WORKSPACE_KEY)
}

export function saveDatasetWorkspaceId(workspaceId: string) {
  if (typeof window === "undefined") return
  window.localStorage.setItem(LAST_DATASET_WORKSPACE_KEY, workspaceId)
}

export type DatasetUploadKind = "files" | "folder" | "zip" | "cloud" | "repository"

export type UploadDatasetPayload = {
  file?: File
  files?: File[]
  relativePaths?: string[]
  uploadKind?: DatasetUploadKind
  name: string
  description?: string
  visibility: "PRIVATE" | "TEAM" | "PUBLIC" | "RESTRICTED"
  workspaceId?: string
  sourceProvider?: string
  sourceLocator?: string
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
    workspaceId: item.workspaceId ?? null,
    workspace:
      item.workspace && typeof item.workspace.id === "string"
        ? {
            id: item.workspace.id,
            name: typeof item.workspace.name === "string" ? item.workspace.name : "Workspace",
          }
        : item.workspaceId
          ? { id: item.workspaceId, name: "Workspace" }
          : null,
    visibility: mapDatasetVisibility(item.visibility),
    status: mapStatus(raw),
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
    const workspaces: Array<{ id: string; name: string }> = Array.isArray(mine.data?.workspaces)
      ? mine.data.workspaces
          .map((workspace: { id?: unknown; name?: unknown }) => ({
            id: typeof workspace.id === "string" ? workspace.id : "",
            name: typeof workspace.name === "string" ? workspace.name : "Workspace",
          }))
          .filter((workspace: { id: string }) => workspace.id.length > 0)
      : []

    const responses = await Promise.all(
      workspaces.map((workspace) =>
        api.get(`/v1/workspaces/${workspace.id}/datasets`).then((response) => ({
          response,
          workspace,
        }))
      )
    )

    return responses.flatMap(({ response, workspace }) =>
      Array.isArray(response.data?.datasets)
        ? response.data.datasets.map((item: WorkspaceDatasetApiItem) =>
            mapWorkspaceDataset({
              ...item,
              workspaceId: workspace.id,
              workspace,
            })
          )
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
  ;[...depositItems, ...workspaceItems].forEach((item) => byId.set(item.id, item))

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
  ;[...depositItems, ...workspaceItems].forEach((item) => byId.set(item.id, item))
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

export async function uploadDataset(payload: UploadDatasetPayload) {
  const workspaceId = payload.workspaceId || (await resolveWorkspaceId())
  saveDatasetWorkspaceId(workspaceId)

  if (payload.uploadKind === "cloud" || payload.uploadKind === "repository") {
    const { data } = await api.post(`/v1/workspaces/${workspaceId}/datasets`, {
      name: payload.name,
      description:
        payload.description ||
        `${payload.uploadKind === "cloud" ? "Cloud import" : "Repository import"} from ${payload.sourceProvider ?? "external source"}: ${payload.sourceLocator ?? "pending sync"}`,
      visibility: mapUploadVisibility(payload.visibility),
      uploadKind: payload.uploadKind,
      sourceProvider: payload.sourceProvider,
      sourceLocator: payload.sourceLocator,
      tags: [
        payload.uploadKind === "cloud" ? "cloud-import" : "repository-import",
        payload.sourceProvider?.toLowerCase().replace(/[^a-z0-9]+/g, "-"),
      ].filter(Boolean),
    })
    return (data?.dataset ?? data) as DatasetItem
  }

  if (payload.files?.length) {
    const formData = new FormData()
    payload.files.forEach((file) => formData.append("files", file))
    formData.append("relativePaths", JSON.stringify(payload.relativePaths ?? payload.files.map((file) => file.name)))
    formData.append("uploadKind", payload.uploadKind ?? "files")
    formData.append("name", payload.name)
    if (payload.description) formData.append("description", payload.description)
    formData.append("visibility", mapUploadVisibility(payload.visibility))
    formData.append("autoRunPipeline", "false")

    try {
      const { data } = await api.post(`/v1/workspaces/${workspaceId}/datasets/upload-bundle`, formData)
      return (data?.dataset ?? data) as DatasetItem
    } catch (error) {
      if (!isNotFoundError(error)) {
        throw error
      }

      const { data } = await api.post(`/workspaces/${workspaceId}/datasets/upload-bundle`, formData)
      return (data?.dataset ?? data) as DatasetItem
    }
  }

  if (!payload.file) {
    throw new Error("Please choose at least one dataset file")
  }

  const formData = new FormData()
  formData.append("file", payload.file)
  formData.append("name", payload.name)
  if (payload.description) formData.append("description", payload.description)
  formData.append("visibility", mapUploadVisibility(payload.visibility))
  formData.append("autoRunPipeline", "false")
  formData.append("uploadKind", payload.uploadKind ?? (payload.file.name.toLowerCase().endsWith(".zip") ? "zip" : "files"))

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
    retryFormData.append("uploadKind", payload.uploadKind ?? (payload.file.name.toLowerCase().endsWith(".zip") ? "zip" : "files"))

    const { data } = await api.post(`/workspaces/${workspaceId}/datasets/upload`, retryFormData)
    return (data?.dataset ?? data) as DatasetItem
  }
}

export async function deleteDataset(datasetId: string) {
  const { data } = await api.delete(`/v1/datasets/deposit/${datasetId}`)
  return data
}
