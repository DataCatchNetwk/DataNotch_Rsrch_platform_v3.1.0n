export type DepositAccessibility = 'PUBLIC' | 'RESTRICTED' | 'CONTROLLED'
export type DepositDomain =
  | 'HEALTH'
  | 'SOCIAL'
  | 'CLIMATE'
  | 'ECONOMIC'
  | 'DEMOGRAPHIC'
  | 'EDUCATION'
  | 'OTHER'

export interface DepositDatasetSummary {
  id: string
  slug: string
  name: string
  description: string
  domain: DepositDomain
  tags: string[]
  sourceName?: string | null
  sizeBytes?: number | null
  recordCount?: number | null
  updatedAt: string
  accessibility: DepositAccessibility
  isFavorite?: boolean
}

export interface DepositDatasetDetail extends DepositDatasetSummary {
  schema?: Array<{ name: string; type: string; nullable?: boolean }>
  license?: string | null
  refreshCadence?: string | null
  provenance?: string | null
}

export interface DepositPreviewResponse {
  dataset: DepositDatasetDetail
  columns: string[]
  rows: Array<Record<string, unknown>>
  previewJobId?: string
  generatedAt: string
}

export interface PullToWorkspacePayload {
  workspaceId: string
  mode: 'COPY' | 'VIRTUAL_VIEW'
  selectedColumns?: string[]
  rowLimit?: number
  filterJson?: Record<string, unknown>
}
