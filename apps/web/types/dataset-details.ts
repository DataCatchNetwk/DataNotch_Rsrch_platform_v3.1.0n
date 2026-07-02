export type DatasetHealthStatus = "GOOD" | "WARNING" | "CRITICAL"

export type DatasetArtifactKind =
  | "REPORT"
  | "CHART"
  | "CLEANED_FILE"
  | "MODEL_OUTPUT"
  | "ATTACHMENT"

export interface DatasetColumnProfile {
  name: string
  type: string
  nullable: boolean
  unique?: boolean
  nullPercent?: number
  sampleValues?: string[]
}

export interface DatasetQualitySummary {
  missingValues: number
  duplicateRows: number
  invalidRows: number
  completenessScore: number
  qualityStatus: DatasetHealthStatus
}

export interface DatasetVersionInfo {
  version: number
  label: string
  createdAt: string
  createdBy?: string | null
  notes?: string | null
}

export interface DatasetArtifact {
  id: string
  name: string
  kind: DatasetArtifactKind
  sizeBytes: number
  createdAt: string
  status: "READY" | "PROCESSING" | "FAILED"
  downloadUrl?: string | null
}

export interface DatasetAnalysisTemplate {
  id: string
  name: string
  description: string
  category: "DESCRIPTIVE" | "PREDICTIVE" | "CLEANING" | "VISUALIZATION" | "CUSTOM"
}

export interface DatasetDetails {
  id: string
  name: string
  description?: string | null
  visibility: "PRIVATE" | "TEAM" | "PUBLIC" | "RESTRICTED"
  status: "QUEUED" | "UPLOADING" | "PROCESSING" | "READY" | "FAILED"
  fileKind:
    | "CSV"
    | "XLSX"
    | "JSON"
    | "TSV"
    | "TXT"
    | "XML"
    | "PARQUET"
    | "ZIP"
    | "PDF"
    | "FHIR"
    | "GEOJSON"
    | "IMAGING"
  sizeBytes: number
  rowsCount?: number | null
  columnsCount?: number | null
  createdAt: string
  updatedAt: string
  owner?: {
    id: string
    name: string
    email: string
  } | null
  workspace?: {
    id: string
    name: string
  } | null
  quality?: DatasetQualitySummary | null
  schemaPreview: DatasetColumnProfile[]
  versions: DatasetVersionInfo[]
  previewColumns?: string[]
  previewRows?: Array<Record<string, unknown>>
  license?: string | null
  sourceName?: string | null
  sourceUrl?: string | null
  domain?: string | null
  tags?: string[]
  provenance?: string | null
  refreshCadence?: string | null
}

export interface DatasetArtifactsResponse {
  items: DatasetArtifact[]
}

export interface StartAnalysisPayload {
  datasetId: string
  templateId: string
  title: string
  notes?: string
  parameters?: Record<string, unknown>
}

export interface StartAnalysisResponse {
  jobId: string
  status: "QUEUED" | "RUNNING"
}

export interface UploadProgressState {
  progress: number
  stage:
    | "IDLE"
    | "PREPARING"
    | "UPLOADING"
    | "PROCESSING"
    | "FINALIZING"
    | "DONE"
    | "FAILED"
  message?: string
}
