export type DatasetDomain =
  | "HEALTH"
  | "SOCIAL"
  | "CLIMATE"
  | "GENOMICS"
  | "WEARABLES"
  | "PUBLIC"
  | "OTHER"

export type DatasetAccessLevel =
  | "PUBLIC"
  | "INTERNAL"
  | "RESTRICTED"
  | "APPROVAL_REQUIRED"

export type DatasetFileType =
  | "TABULAR"
  | "TIME_SERIES"
  | "IMAGE"
  | "TEXT"
  | "GENOMICS"
  | "MULTIMODAL"

export interface DatasetPreviewRow {
  [key: string]: string | number | boolean | null
}

export interface Dataset {
  id: string
  slug: string
  name: string
  description: string
  domain: DatasetDomain
  source: string
  tags: string[]
  accessLevel: DatasetAccessLevel
  fileType: DatasetFileType
  rowCount?: number | null
  sizeBytes?: number | null
  updatedAt: string
  ownerName?: string | null
  isFavorite?: boolean
  schemaFields?: Array<{
    name: string
    type: string
    nullable?: boolean
  }>
}

export interface DatasetListResponse {
  items: Dataset[]
  total: number
}

export interface DatasetPreviewResponse {
  datasetId: string
  columns: string[]
  rows: DatasetPreviewRow[]
}

export interface PullDatasetInput {
  datasetId: string
  workspaceId: string
  alias?: string
  selectedColumns?: string[]
  filters?: Record<string, unknown>
}
