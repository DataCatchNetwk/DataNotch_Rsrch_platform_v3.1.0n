export interface ExperimentRunRecord {
  experimentId: string
  analysisRunId: string
  metricSummary: Record<string, number>
  datasetVersionRef?: string
  featureSetVersionRef?: string
}
