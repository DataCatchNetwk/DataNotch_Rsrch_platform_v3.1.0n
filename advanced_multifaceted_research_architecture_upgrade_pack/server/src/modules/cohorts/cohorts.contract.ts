export interface CreateCohortDto {
  name: string
  description?: string
  domain: string
  criteriaJson: Record<string, unknown>
  sourceDatasetIds: string[]
}

export interface CohortPreviewResponse {
  estimatedCount: number
  warnings: string[]
  sourceDatasets: string[]
}
