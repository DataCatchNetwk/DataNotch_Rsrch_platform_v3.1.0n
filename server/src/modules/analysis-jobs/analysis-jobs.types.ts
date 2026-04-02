export type AnalysisJobStatus = "QUEUED" | "RUNNING" | "SUCCEEDED" | "FAILED" | "CANCELLED"

export type AnalysisJobsSort =
  | "submittedAt:desc"
  | "submittedAt:asc"
  | "runtimeMinutes:desc"
  | "status:asc"
  | "updatedAt:desc"

export type AnalysisJobQueueInfo = {
  queueName: string | null
  backendAvailable: boolean
  waitingJobs: number
  activeJobs: number
  queuedMinutes: number | null
  estimatedWaitMinutes: number | null
  note: string
}

export type AnalysisJobListItem = {
  id: string
  jobName: string
  datasetName: string
  workspaceName: string
  analysisType: string
  status: AnalysisJobStatus
  submittedAt: Date
  updatedAt: Date
  runtimeMinutes: number | null
  ownerName: string
  artifactCount: number
  pipelineName?: string | null
  archivedAt: Date | null
  queue: AnalysisJobQueueInfo | null
}

export type AnalysisJobDetails = AnalysisJobListItem & {
  params?: Record<string, string | number | boolean | null> | null
  logs?: string[] | null
}

export type PaginatedResult<T> = {
  items: T[]
  total: number
  page: number
  pageSize: number
}

export type AuthUser = {
  id: string
  email: string
}
