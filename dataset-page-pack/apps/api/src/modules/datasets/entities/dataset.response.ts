export class DatasetResponse {
  id!: string
  slug!: string
  name!: string
  description!: string
  section!: string
  visibility!: string
  status!: string
  ownerName!: string
  workspaceCount!: number
  recordCount!: number
  fileCount!: number
  sizeLabel!: string
  tags!: string[]
  modalities!: string[]
  updatedAt!: Date
  createdAt!: Date
  isFavorite!: boolean
  lineageVersion!: string
  lineageParentName?: string | null
  sampleColumns!: string[]
  governanceSummary!: string
}
