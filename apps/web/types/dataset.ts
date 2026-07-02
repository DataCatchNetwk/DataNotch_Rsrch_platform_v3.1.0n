export type DatasetVisibility = "PRIVATE" | "TEAM" | "PUBLIC" | "RESTRICTED"

export type DatasetStatus =
  | "QUEUED"
  | "UPLOADING"
  | "PROCESSING"
  | "READY"
  | "FAILED"

export type DatasetFileKind =
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

export interface DatasetOwner {
  id: string
  name: string
  email: string
}

export interface DatasetItem {
  id: string
  name: string
  description?: string | null
  workspaceId?: string | null
  workspace?: {
    id: string
    name: string
  } | null
  visibility: DatasetVisibility
  status: DatasetStatus
  fileKind: DatasetFileKind
  sizeBytes: number
  rowsCount?: number | null
  columnsCount?: number | null
  createdAt: string
  updatedAt: string
  owner?: DatasetOwner | null
  domain?: string | null
  sourceName?: string | null
  tags?: string[]
  isFavorite?: boolean
}

export interface DatasetStats {
  total: number
  queued: number
  processing: number
  ready: number
  failed: number
  totalStorageBytes: number
}

export interface DatasetsResponse {
  items: DatasetItem[]
  total: number
  page: number
  pageSize: number
}

export interface DatasetFilters {
  search?: string
  visibility?: DatasetVisibility | "ALL"
  status?: DatasetStatus | "ALL"
  fileKind?: DatasetFileKind | "ALL"
  domain?: string
  source?: string
  tags?: string
  dateFrom?: string
  dateTo?: string
  page?: number
  pageSize?: number
  sortBy?: "name" | "createdAt" | "updatedAt" | "sizeBytes" | "status" | "popularity"
  sortOrder?: "asc" | "desc"
  viewMode?: "table" | "grid"
}
