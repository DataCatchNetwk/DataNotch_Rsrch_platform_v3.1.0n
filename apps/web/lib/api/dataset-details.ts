import { api } from "@/lib/api/client"
import type {
  DatasetArtifactsResponse,
  DatasetDetails,
  StartAnalysisPayload,
  StartAnalysisResponse,
} from "@/types/dataset-details"

type DepositDatasetDetail = {
  id: string
  name: string
  description?: string | null
  workspaceId?: string | null
  workspace?: { id?: unknown; name?: unknown } | null
  visibility?: "PRIVATE" | "TEAM" | "WORKSPACE" | "PUBLIC" | "RESTRICTED"
  depositStatus?: "DRAFT" | "AVAILABLE" | "ARCHIVED"
  storagePath?: string | null
  mimeType?: string | null
  sizeBytes?: number | null
  rowCount?: number | null
  recordCount?: number | null
  columnCount?: number | null
  createdAt?: string
  updatedAt?: string
  schema?: Array<{ name: string; type: string; nullable?: boolean; nullPercent?: number }>
  domain?: string | null
  tags?: string[]
  sourceName?: string | null
  sourceUrl?: string | null
  license?: string | null
  provenance?: string | null
  refreshCadence?: string | null
  previewRowsJson?: unknown
  metadataJson?: unknown
}

function mapFileKind(mimeType?: string | null): DatasetDetails["fileKind"] {
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

async function resolveWorkspaceId(preferredWorkspaceId?: string) {
  if (preferredWorkspaceId) {
    return preferredWorkspaceId
  }

  const { data } = await api.get("/v1/workspaces/mine")
  const workspaceId = data?.workspaces?.[0]?.id
  if (!workspaceId || typeof workspaceId !== "string") {
    throw new Error("No workspace available for this action")
  }

  return workspaceId
}

function mapDatasetVisibility(visibility?: DepositDatasetDetail["visibility"]): DatasetDetails["visibility"] {
  return visibility === "WORKSPACE" ? "TEAM" : visibility ?? "PUBLIC"
}

async function resolveDatasetWorkspaceId(datasetId: string, preferredWorkspaceId?: string) {
  if (preferredWorkspaceId) {
    return preferredWorkspaceId
  }

  try {
    const { data } = await api.get(`/v1/datasets/deposit/${datasetId}`)
    const workspaceId = data?.workspaceId ?? data?.workspace?.id
    if (typeof workspaceId === "string" && workspaceId.length > 0) {
      return workspaceId
    }
  } catch {
    // Fall through to the workspace scan below. Queued uploads can still be
    // present in a workspace even when a deposit detail endpoint is unavailable.
  }

  const { data } = await api.get("/v1/workspaces/mine")
  const workspaces: Array<{ id: string }> = Array.isArray(data?.workspaces)
    ? data.workspaces
        .map((workspace: { id?: unknown }) => ({
          id: typeof workspace.id === "string" ? workspace.id : "",
        }))
        .filter((workspace: { id: string }) => workspace.id.length > 0)
    : []

  for (const workspace of workspaces) {
    try {
      const response = await api.get(`/v1/workspaces/${workspace.id}/datasets`)
      const datasets = Array.isArray(response.data?.datasets) ? response.data.datasets : []
      if (datasets.some((dataset: { id?: unknown }) => dataset.id === datasetId)) {
        return workspace.id
      }
    } catch {
      // Keep scanning the remaining workspaces.
    }
  }

  return resolveWorkspaceId()
}

function mapUploadVisibility(visibility: "PRIVATE" | "TEAM" | "PUBLIC" | "RESTRICTED") {
  return visibility === "TEAM" ? "WORKSPACE" : visibility
}

function parsePreviewRows(previewRowsJson: unknown): { columns: string[]; rows: Array<Record<string, unknown>> } {
  try {
    const parsed = typeof previewRowsJson === "string" ? JSON.parse(previewRowsJson) : previewRowsJson
    if (Array.isArray(parsed) && parsed.length > 0 && typeof parsed[0] === "object") {
      const rows = parsed as Array<Record<string, unknown>>
      const columns = Object.keys(rows[0])
      return { columns, rows }
    }
  } catch {
    // ignore parse errors
  }
  return { columns: [], rows: [] }
}

function asRecord(value: unknown): Record<string, unknown> | null {
  return value && typeof value === "object" && !Array.isArray(value) ? (value as Record<string, unknown>) : null
}

function parseMetadata(metadataJson: unknown): Record<string, unknown> {
  try {
    if (typeof metadataJson === "string") {
      return asRecord(JSON.parse(metadataJson)) ?? {}
    }
    return asRecord(metadataJson) ?? {}
  } catch {
    return {}
  }
}

function numberValue(value: unknown, fallback = 0) {
  const numeric = Number(value)
  return Number.isFinite(numeric) ? numeric : fallback
}

function mapQualitySummary(metadataJson: unknown): DatasetDetails["quality"] {
  const metadata = parseMetadata(metadataJson)
  const preparation = asRecord(metadata.dataPreparation)
  const profile = asRecord(preparation?.profile)

  if (!profile && metadata.dataQualityScore === undefined && metadata.missingnessRate === undefined) {
    return null
  }

  const qualityScore = numberValue(profile?.qualityScore ?? metadata.dataQualityScore, 0)
  const missingRate = numberValue(profile?.missingRate ?? metadata.missingnessRate, 0)
  const completenessScore = Math.max(0, Math.min(100, 100 - missingRate * 100))
  const qualityStatus = qualityScore >= 80 ? "GOOD" : qualityScore >= 60 ? "WARNING" : "CRITICAL"

  return {
    qualityStatus,
    completenessScore,
    missingValues: Math.max(0, Math.round(numberValue(profile?.totalMissingValues, 0))),
    duplicateRows: Math.max(0, Math.round(numberValue(profile?.duplicateRows ?? metadata.duplicateRows, 0))),
    invalidRows: Math.max(0, Math.round(numberValue(profile?.outlierCount ?? metadata.invalidRows, 0))),
  }
}

export async function fetchDatasetDetails(datasetId: string): Promise<DatasetDetails> {
  const { data } = await api.get(`/v1/datasets/deposit/${datasetId}`)
  const item = data as DepositDatasetDetail

  const { columns: previewColumns, rows: previewRows } = parsePreviewRows(item.previewRowsJson)
  const hasStoredUpload = Boolean(item.storagePath) || Boolean(item.sizeBytes && item.sizeBytes > 0) || /upload/i.test(item.sourceName ?? "")

  return {
    id: item.id,
    name: item.name,
    description: item.description ?? null,
    visibility: mapDatasetVisibility(item.visibility),
    status: item.depositStatus === "AVAILABLE" || (item.depositStatus === "DRAFT" && hasStoredUpload) ? "READY" : "QUEUED",
    fileKind: mapFileKind(item.mimeType),
    sizeBytes: item.sizeBytes ?? 0,
    rowsCount: item.rowCount ?? item.recordCount ?? null,
    columnsCount: item.columnCount ?? null,
    createdAt: item.createdAt ?? item.updatedAt ?? new Date().toISOString(),
    updatedAt: item.updatedAt ?? item.createdAt ?? new Date().toISOString(),
    owner: null,
    workspace:
      item.workspace && typeof item.workspace.id === "string"
        ? {
            id: item.workspace.id,
            name: typeof item.workspace.name === "string" ? item.workspace.name : "Workspace",
          }
        : item.workspaceId
          ? { id: item.workspaceId, name: "Workspace" }
          : null,
    quality: mapQualitySummary(item.metadataJson),
    schemaPreview: Array.isArray(item.schema)
      ? item.schema.map((column) => ({
          name: column.name,
          type: column.type,
          nullable: Boolean(column.nullable),
          nullPercent: typeof column.nullPercent === "number" ? column.nullPercent : undefined,
        }))
      : [],
    versions: [
      {
        version: 1,
        label: "Current",
        createdAt: item.updatedAt ?? item.createdAt ?? new Date().toISOString(),
        createdBy: null,
        notes: null,
      },
    ],
    previewColumns,
    previewRows,
    license: item.license ?? null,
    sourceName: item.sourceName ?? null,
    sourceUrl: item.sourceUrl ?? null,
    domain: item.domain ?? null,
    tags: Array.isArray(item.tags) ? item.tags : [],
    provenance: item.provenance ?? null,
    refreshCadence: item.refreshCadence ?? null,
  }
}

export async function fetchDatasetPreview(datasetId: string): Promise<{ columns: string[]; rows: Array<Record<string, unknown>> }> {
  try {
    const { data } = await api.get(`/v1/datasets/deposit/${datasetId}/preview`)
    const columns: string[] = Array.isArray(data?.columns) ? data.columns : []
    const rows: Array<Record<string, unknown>> = Array.isArray(data?.rows) ? data.rows : []
    return { columns, rows }
  } catch {
    return { columns: [], rows: [] }
  }
}

export async function fetchDatasetAuditTrail(datasetId: string): Promise<Array<{
  id: string
  action: string
  actor: string
  createdAt: string
  severity: "LOW" | "MEDIUM" | "HIGH"
}>> {
  try {
    const { data } = await api.get(`/v1/datasets/deposit/${datasetId}/audit`)
    if (Array.isArray(data?.events)) {
      return data.events as Array<{ id: string; action: string; actor: string; createdAt: string; severity: "LOW" | "MEDIUM" | "HIGH" }>
    }
  } catch {
    // fall through
  }
  return []
}

export async function pullDatasetToWorkspace(datasetId: string, workspaceId: string, mode: "COPY" | "VIRTUAL_VIEW" = "COPY"): Promise<{ jobId: string }> {
  const { data } = await api.post(`/v1/datasets/deposit/${datasetId}/pull`, { workspaceId, mode })
  return { jobId: data?.jobId ?? data?.id ?? "" }
}

export async function requestDatasetAccess(datasetId: string, justification: string): Promise<{ accessRequestId: string }> {
  const { data } = await api.post(`/v1/datasets/deposit/${datasetId}/access-request`, { justification })
  return { accessRequestId: data?.accessRequestId ?? "" }
}

export async function fetchDatasetArtifacts(datasetId: string): Promise<DatasetArtifactsResponse> {
  return { items: [] }
}

export async function startDatasetAnalysis(
  payload: StartAnalysisPayload
): Promise<StartAnalysisResponse> {
  const workspaceId = await resolveDatasetWorkspaceId(
    payload.datasetId,
    typeof payload.parameters?.workspaceId === "string" ? payload.parameters.workspaceId : undefined
  )

  const requestBody = {
    name: payload.title,
    jobType: payload.templateId,
    description: payload.notes,
    datasetId: payload.datasetId,
    parametersJson: {
      templateId: payload.templateId,
      ...(payload.parameters ?? {}),
    },
    autoPipeline: true,
    analysisType: payload.templateId,
  }

  const { data } = await api.post(`/v1/workspaces/${workspaceId}/analysis-jobs`, requestBody)
  const analysisJob = data?.analysisJob ?? data

  if (!analysisJob?.id || typeof analysisJob.id !== "string") {
    throw new Error("Analysis job was created but no job id was returned")
  }

  return {
    jobId: analysisJob.id,
    status: analysisJob?.status === "RUNNING" ? "RUNNING" : "QUEUED",
  }
}

export async function uploadDatasetWithProgress(
  payload: {
    file: File
    name: string
    description?: string
    visibility: "PRIVATE" | "TEAM" | "PUBLIC" | "RESTRICTED"
    workspaceId?: string
    uploadKind?: "files" | "folder" | "zip" | "cloud" | "repository"
  },
  onProgress?: (percent: number) => void
) {
  const workspaceId = await resolveWorkspaceId(payload.workspaceId)

  const formData = new FormData()
  formData.append("file", payload.file)
  formData.append("name", payload.name)
  if (payload.description) formData.append("description", payload.description)
  formData.append("visibility", mapUploadVisibility(payload.visibility))
  formData.append("uploadKind", payload.uploadKind ?? (payload.file.name.toLowerCase().endsWith(".zip") ? "zip" : "files"))

  const { data } = await api.post(`/v1/workspaces/${workspaceId}/datasets/upload`, formData, {
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

  return data?.dataset ?? data
}
