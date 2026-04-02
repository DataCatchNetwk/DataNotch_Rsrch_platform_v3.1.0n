export type DatasetSection =
  | 'library'
  | 'deposit'
  | 'workspace'
  | 'cohort'
  | 'operations'
  | 'analysis'
  | 'lineage'
  | 'access'
  | 'favorites'

export type DatasetViewMode = 'grid' | 'table'

export type DatasetStatus = 'READY' | 'PROCESSING' | 'RESTRICTED' | 'ARCHIVED'
export type DatasetVisibility = 'PRIVATE' | 'TEAM' | 'PUBLIC' | 'RESTRICTED'

export interface DatasetListItem {
  id: string
  slug: string
  name: string
  description: string
  section: DatasetSection
  visibility: DatasetVisibility
  status: DatasetStatus
  ownerName: string
  workspaceCount: number
  recordCount: number
  fileCount: number
  sizeLabel: string
  tags: string[]
  modalities: string[]
  updatedAt: string
  createdAt: string
  isFavorite: boolean
  lineageVersion: string
  lineageParentName?: string | null
  sampleColumns: string[]
  governanceSummary: string
}

export interface DatasetQueryState {
  search: string
  section: DatasetSection | 'all'
  visibility: DatasetVisibility | 'all'
  workspaceId: string
  tag: string
  sortBy: 'updatedAt' | 'name' | 'recordCount' | 'createdAt'
  favoritesOnly: boolean
}
