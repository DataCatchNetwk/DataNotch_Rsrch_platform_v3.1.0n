import type { AnalysisJobStatus } from '../analysis-jobs.types.js'

export interface AnalysisJobQueueDto {
  queueName: string | null
  backendAvailable: boolean
  waitingJobs: number
  activeJobs: number
  queuedMinutes: number | null
  estimatedWaitMinutes: number | null
  note: string
}

export interface AnalysisJobsListItemDto {
  id: string
  jobName: string
  datasetName: string
  workspaceName: string
  analysisType: string
  status: AnalysisJobStatus
  submittedAt: string
  updatedAt: string
  runtimeMinutes: number | null
  ownerName: string
  artifactCount: number
  pipelineName?: string | null
  archivedAt?: string | null
  queue?: AnalysisJobQueueDto | null
}

export interface AnalysisJobDetailsDto extends AnalysisJobsListItemDto {
  params?: Record<string, string | number | boolean | null> | null
  logs?: string[] | null
}

export interface PaginatedAnalysisJobsDto {
  items: AnalysisJobsListItemDto[]
  total: number
  page: number
  pageSize: number
}

export interface RetryJobResponseDto {
  ok: true
  newJobId?: string
  message?: string
}

export interface DuplicateJobResponseDto {
  ok: true
  newJobId?: string
  message?: string
}

export interface CancelJobResponseDto {
  ok: true
  message?: string
}

export interface ArchiveJobResponseDto {
  ok: true
  message?: string
}

export interface RestoreJobResponseDto {
  ok: true
  message?: string
}

export interface BulkJobActionResponseDto {
  ok: true
  processedIds: string[]
  skippedIds?: string[]
  message?: string
}
