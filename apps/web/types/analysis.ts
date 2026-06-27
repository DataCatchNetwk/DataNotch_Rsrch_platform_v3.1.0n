export type AnalysisJobStatus =
  | "QUEUED"
  | "RUNNING"
  | "SUCCEEDED"
  | "FAILED"
  | "CANCELLED"

export type AnalysisJobStageStatus = "PENDING" | "RUNNING" | "DONE" | "FAILED"

export interface AnalysisJobOwner {
  id: string
  name: string
  email?: string
}

export interface AnalysisJobDataset {
  id: string
  name: string
}

export interface AnalysisJobSummary {
  id: string
  title: string
  templateName: string
  status: AnalysisJobStatus
  progressPercent: number
  startedAt?: string | null
  finishedAt?: string | null
  createdAt: string
  owner?: AnalysisJobOwner | null
  dataset?: AnalysisJobDataset | null
  latestMessage?: string | null
}

export interface AnalysisJobLogEntry {
  id: string
  timestamp: string
  level: "INFO" | "WARN" | "ERROR" | "DEBUG"
  message: string
}

export interface AnalysisJobStage {
  key: string
  label: string
  status: AnalysisJobStageStatus
  startedAt?: string | null
  completedAt?: string | null
  progressPercent?: number | null
}

export interface AnalysisJobDetails extends AnalysisJobSummary {
  notes?: string | null
  parameters?: Record<string, unknown> | null
  stages: AnalysisJobStage[]
  logs: AnalysisJobLogEntry[]
  reportId?: string | null
  artifactIds?: string[]
}

export interface AnalysisJobsResponse {
  items: AnalysisJobSummary[]
  total: number
  page: number
  pageSize: number
}

export interface AnalysisJobFilters {
  search?: string
  status?: AnalysisJobStatus | "ALL"
  page?: number
  pageSize?: number
  sortBy?: "createdAt" | "startedAt" | "finishedAt" | "progressPercent" | "title"
  sortOrder?: "asc" | "desc"
}

export type AnalysisStreamEventType =
  | "job.updated"
  | "job.stage.updated"
  | "job.log"
  | "job.completed"
  | "job.failed"
  | "heartbeat"

export interface AnalysisStreamEvent<T = unknown> {
  type: AnalysisStreamEventType
  jobId: string
  payload: T
}
