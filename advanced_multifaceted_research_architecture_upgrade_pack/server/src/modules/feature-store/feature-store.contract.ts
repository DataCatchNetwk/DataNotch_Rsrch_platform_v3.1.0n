export interface CreateFeatureSetDto {
  name: string
  description?: string
  domain: string
  cohortId?: string
  recipeJson: Record<string, unknown>
}
