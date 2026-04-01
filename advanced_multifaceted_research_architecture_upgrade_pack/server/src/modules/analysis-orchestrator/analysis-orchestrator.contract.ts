export interface LaunchAnalysisRunDto {
  workspaceId: string
  type: 'DESCRIPTIVE' | 'REGRESSION' | 'CLASSIFICATION' | 'SURVIVAL' | 'CLUSTERING' | 'DIM_REDUCTION' | 'GENOMICS' | 'CUSTOM'
  configJson: Record<string, unknown>
}
