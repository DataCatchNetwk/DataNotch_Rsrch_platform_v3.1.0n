import { PipelineRunStatus } from '@prisma/client'
import type { AnalysisJobDetails, AnalysisJobListItem, AnalysisJobStatus, PaginatedResult } from './analysis-jobs.types.js'
import type {
  AnalysisJobDetailsDto,
  AnalysisJobsListItemDto,
  PaginatedAnalysisJobsDto,
} from './dto/analysis-job-response.dto.js'

function mapPipelineStatus(status: PipelineRunStatus): AnalysisJobStatus {
  switch (status) {
    case 'DRAFT':
    case 'QUEUED':
      return 'QUEUED'
    case 'RUNNING':
      return 'RUNNING'
    case 'SUCCEEDED':
    case 'PARTIAL_SUCCESS':
      return 'SUCCEEDED'
    case 'FAILED':
      return 'FAILED'
    case 'CANCELED':
      return 'CANCELLED'
  }
}

function toIsoString(value: Date) {
  return value.toISOString()
}

export class AnalysisJobsMapper {
  static mapPipelineStatus = mapPipelineStatus

  static toListItemDto(item: AnalysisJobListItem): AnalysisJobsListItemDto {
    return {
      id: item.id,
      jobName: item.jobName,
      datasetName: item.datasetName,
      workspaceName: item.workspaceName,
      analysisType: item.analysisType,
      status: item.status,
      submittedAt: toIsoString(item.submittedAt),
      updatedAt: toIsoString(item.updatedAt),
      runtimeMinutes: item.runtimeMinutes,
      ownerName: item.ownerName,
      artifactCount: item.artifactCount,
      pipelineName: item.pipelineName ?? null,
      archivedAt: item.archivedAt ? toIsoString(item.archivedAt) : null,
      queue: item.queue
        ? {
            queueName: item.queue.queueName,
            backendAvailable: item.queue.backendAvailable,
            waitingJobs: item.queue.waitingJobs,
            activeJobs: item.queue.activeJobs,
            queuedMinutes: item.queue.queuedMinutes,
            estimatedWaitMinutes: item.queue.estimatedWaitMinutes,
            note: item.queue.note,
          }
        : null,
    }
  }

  static toDetailsDto(item: AnalysisJobDetails): AnalysisJobDetailsDto {
    return {
      ...this.toListItemDto(item),
      params: item.params ?? null,
      logs: item.logs ?? null,
    }
  }

  static toPaginatedDto(result: PaginatedResult<AnalysisJobListItem>): PaginatedAnalysisJobsDto {
    return {
      items: result.items.map((item) => this.toListItemDto(item)),
      total: result.total,
      page: result.page,
      pageSize: result.pageSize,
    }
  }
}
