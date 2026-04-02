export type ReportStatus = "READY" | "PROCESSING" | "FAILED"
export type ArtifactKind = "REPORT" | "CHART" | "CLEANED_FILE" | "MODEL_OUTPUT" | "ATTACHMENT"
export type ReportChartType = "area" | "bar" | "line" | "pie"

export interface ReportChartSeries {
  label: string
  dataKey: string
  color: string
}

export interface ReportChartConfig {
  id: string
  title: string
  description?: string
  type: ReportChartType
  /** x-axis key in each data row; omitted for pie charts */
  xKey?: string
  data: Array<Record<string, string | number>>
  series: ReportChartSeries[]
}

export interface ReportArtifact {
  id: string
  name: string
  kind: ArtifactKind
  mimeType?: string | null
  sizeBytes: number
  status: ReportStatus
  createdAt: string
  downloadUrl?: string | null
  previewUrl?: string | null
}

export interface ReportMetric {
  label: string
  value: string | number
  helper?: string
}

export interface ReportSection {
  id: string
  title: string
  body: string
}

export interface ReportDetails {
  id: string
  title: string
  status: ReportStatus
  summary?: string | null
  dataset?: {
    id: string
    name: string
  } | null
  analysisJob?: {
    id: string
    title: string
  } | null
  createdAt: string
  updatedAt: string
  metrics: ReportMetric[]
  sections: ReportSection[]
  artifacts: ReportArtifact[]
  charts?: ReportChartConfig[]
}
