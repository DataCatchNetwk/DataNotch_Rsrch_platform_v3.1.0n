import { PipelineRunStatus, Prisma } from '@prisma/client'
import { prisma } from '../../db/prisma.js'
import { PipelinesService } from '../../pipelines/service.js'
import { assertWorkspaceAction } from '../../services/workspace-access.service.js'
import { WorkspaceAction } from '../../services/workspace-permissions.js'
import { HttpError } from '../../utils/errors.js'
import { AnalysisJobsMapper } from './analysis-jobs.mapper.js'
import type { BulkJobActionDto } from './dto/bulk-job-action.dto.js'
import type { ListAnalysisJobsQueryDto } from './dto/list-analysis-jobs-query.dto.js'
import type { AuthUser, AnalysisJobDetails, AnalysisJobListItem, PaginatedResult } from './analysis-jobs.types.js'

const pipelinesService = new PipelinesService(prisma)

type PipelineRunListRecord = Prisma.PipelineRunGetPayload<{
  include: {
    dataset: { select: { id: true; name: true } }
    workspace: { select: { id: true; name: true; ownerId: true } }
    template: { select: { id: true; code: true; name: true } }
    triggeredBy: { select: { firstname: true; surname: true; email: true } }
    _count: { select: { artifacts: true } }
  }
}>

type PipelineRunDetailsRecord = Prisma.PipelineRunGetPayload<{
  include: {
    dataset: { select: { id: true; name: true } }
    workspace: { select: { id: true; name: true; ownerId: true } }
    template: { select: { id: true; code: true; name: true } }
    triggeredBy: { select: { firstname: true; surname: true; email: true } }
    artifacts: { select: { id: true; kind: true; name: true; storageKey: true; mimeType: true; createdAt: true } }
    events: { select: { id: true; level: true; message: true; createdAt: true }; orderBy: { createdAt: 'desc' }; take: 80 }
    steps: { select: { order: true; name: true; type: true; status: true; progressPercent: true }; orderBy: { order: 'asc' } }
  }
}>

function buildAccessibleRunsWhere(user: AuthUser): Prisma.PipelineRunWhereInput {
  return {
    OR: [
      { triggeredById: user.id },
      { workspace: { ownerId: user.id } },
      { workspace: { members: { some: { userId: user.id, isActive: true } } } },
    ],
  }
}

function getRuntimeMinutes(record: { startedAt: Date | null; completedAt: Date | null; canceledAt: Date | null; updatedAt: Date }) {
  if (!record.startedAt) {
    return null
  }

  const endTime = record.completedAt ?? record.canceledAt ?? record.updatedAt
  const diff = endTime.getTime() - record.startedAt.getTime()
  return Math.max(0, Math.round(diff / 60000))
}

function mapPipelineStatuses(status?: string): PipelineRunStatus[] | undefined {
  switch (status) {
    case 'QUEUED':
      return ['DRAFT', 'QUEUED']
    case 'RUNNING':
      return ['RUNNING']
    case 'SUCCEEDED':
      return ['SUCCEEDED', 'PARTIAL_SUCCESS']
    case 'FAILED':
      return ['FAILED']
    case 'CANCELLED':
      return ['CANCELED']
    default:
      return undefined
  }
}

function parseParams(input: Prisma.JsonValue | null): Record<string, string | number | boolean | null> | null {
  if (!input || typeof input !== 'object' || Array.isArray(input)) {
    return null
  }

  const entries = Object.entries(input as Record<string, unknown>).filter(([, value]) => {
    return value === null || ['string', 'number', 'boolean'].includes(typeof value)
  })

  return Object.fromEntries(entries) as Record<string, string | number | boolean | null>
}

function buildOwnerName(firstname: string, surname: string, email: string) {
  const fullName = `${firstname} ${surname}`.trim()
  return fullName || email
}

function getAnalysisType(record: { template: { code: string; name: string } | null }) {
  return record.template?.name ?? record.template?.code ?? 'Research Analysis'
}

function mapListRecord(record: PipelineRunListRecord): AnalysisJobListItem {
  return {
    id: record.id,
    jobName: record.name,
    datasetName: record.dataset?.name ?? 'N/A',
    workspaceName: record.workspace.name,
    analysisType: getAnalysisType(record),
    status: AnalysisJobsMapper.mapPipelineStatus(record.status),
    submittedAt: record.createdAt,
    updatedAt: record.updatedAt,
    runtimeMinutes: getRuntimeMinutes(record),
    ownerName: buildOwnerName(record.triggeredBy.firstname, record.triggeredBy.surname, record.triggeredBy.email),
    artifactCount: record._count.artifacts,
    pipelineName: record.template?.code ?? record.template?.name ?? null,
  }
}

function mapDetailsRecord(record: PipelineRunDetailsRecord): AnalysisJobDetails {
  const listItem: AnalysisJobListItem = {
    id: record.id,
    jobName: record.name,
    datasetName: record.dataset?.name ?? 'N/A',
    workspaceName: record.workspace.name,
    analysisType: getAnalysisType(record),
    status: AnalysisJobsMapper.mapPipelineStatus(record.status),
    submittedAt: record.createdAt,
    updatedAt: record.updatedAt,
    runtimeMinutes: getRuntimeMinutes(record),
    ownerName: buildOwnerName(record.triggeredBy.firstname, record.triggeredBy.surname, record.triggeredBy.email),
    artifactCount: record.artifacts.length,
    pipelineName: record.template?.code ?? record.template?.name ?? null,
  }

  const logs = record.events
    .slice()
    .reverse()
    .map((event) => `[${event.createdAt.toISOString()}] ${event.level}: ${event.message}`)

  if (record.failureReason && !logs.length) {
    logs.push(`[${record.updatedAt.toISOString()}] ERROR: ${record.failureReason}`)
  }

  return {
    ...listItem,
    params: parseParams(record.parametersJson),
    logs,
  }
}

function sortItems(items: AnalysisJobListItem[], sort?: ListAnalysisJobsQueryDto['sort']) {
  const next = [...items]

  switch (sort) {
    case 'submittedAt:asc':
      next.sort((a, b) => +a.submittedAt - +b.submittedAt)
      break
    case 'runtimeMinutes:desc':
      next.sort((a, b) => (b.runtimeMinutes ?? -1) - (a.runtimeMinutes ?? -1))
      break
    case 'status:asc':
      next.sort((a, b) => a.status.localeCompare(b.status))
      break
    case 'updatedAt:desc':
      next.sort((a, b) => +b.updatedAt - +a.updatedAt)
      break
    case 'submittedAt:desc':
    default:
      next.sort((a, b) => +b.submittedAt - +a.submittedAt)
      break
  }

  return next
}

export class AnalysisJobsService {
  async list(user: AuthUser, query: ListAnalysisJobsQueryDto): Promise<PaginatedResult<AnalysisJobListItem>> {
    if (query.workspaceId) {
      await assertWorkspaceAction(query.workspaceId, user, WorkspaceAction.VIEW_ANALYSIS)
    }

    const submittedDateWhere = query.submittedDate
      ? {
          gte: new Date(`${query.submittedDate}T00:00:00.000Z`),
          lt: new Date(`${query.submittedDate}T23:59:59.999Z`),
        }
      : undefined

    const pipelineStatuses = mapPipelineStatuses(query.status)

    const where: Prisma.PipelineRunWhereInput = {
      ...(query.workspaceId ? { workspaceId: query.workspaceId } : buildAccessibleRunsWhere(user)),
      ...(query.datasetId ? { datasetId: query.datasetId } : {}),
      ...(pipelineStatuses ? { status: { in: pipelineStatuses } } : {}),
      ...(submittedDateWhere ? { createdAt: submittedDateWhere } : {}),
      ...(query.search
        ? {
            OR: [
              { id: { contains: query.search, mode: 'insensitive' } },
              { name: { contains: query.search, mode: 'insensitive' } },
              { workspace: { name: { contains: query.search, mode: 'insensitive' } } },
              { dataset: { name: { contains: query.search, mode: 'insensitive' } } },
              { template: { name: { contains: query.search, mode: 'insensitive' } } },
              { template: { code: { contains: query.search, mode: 'insensitive' } } },
            ],
          }
        : {}),
    }

    const records = await prisma.pipelineRun.findMany({
      where,
      include: {
        dataset: { select: { id: true, name: true } },
        workspace: { select: { id: true, name: true, ownerId: true } },
        template: { select: { id: true, code: true, name: true } },
        triggeredBy: { select: { firstname: true, surname: true, email: true } },
        _count: { select: { artifacts: true } },
      },
    })

    const mapped = sortItems(records.map(mapListRecord), query.sort)
    const start = (query.page - 1) * query.pageSize
    const items = mapped.slice(start, start + query.pageSize)

    return {
      items,
      total: mapped.length,
      page: query.page,
      pageSize: query.pageSize,
    }
  }

  async getById(user: AuthUser, jobId: string): Promise<AnalysisJobDetails> {
    const record = await prisma.pipelineRun.findUnique({
      where: { id: jobId },
      include: {
        dataset: { select: { id: true, name: true } },
        workspace: { select: { id: true, name: true, ownerId: true } },
        template: { select: { id: true, code: true, name: true } },
        triggeredBy: { select: { firstname: true, surname: true, email: true } },
        artifacts: {
          select: { id: true, kind: true, name: true, storageKey: true, mimeType: true, createdAt: true },
          orderBy: { createdAt: 'desc' },
        },
        events: {
          select: { id: true, level: true, message: true, createdAt: true },
          orderBy: { createdAt: 'desc' },
          take: 80,
        },
        steps: {
          select: { order: true, name: true, type: true, status: true, progressPercent: true },
          orderBy: { order: 'asc' },
        },
      },
    })

    if (!record) {
      throw new HttpError(404, `Analysis job ${jobId} not found`)
    }

    await assertWorkspaceAction(record.workspaceId, user, WorkspaceAction.VIEW_ANALYSIS)
    return mapDetailsRecord(record)
  }

  async retry(user: AuthUser, jobId: string) {
    const run = await prisma.pipelineRun.findUnique({ where: { id: jobId }, select: { id: true, workspaceId: true, status: true } })

    if (!run) {
      throw new HttpError(404, `Analysis job ${jobId} not found`)
    }

    if (!['FAILED', 'CANCELED'].includes(run.status)) {
      throw new HttpError(400, 'Only failed or cancelled jobs can be retried')
    }

    await pipelinesService.retryFromFailedStage(user, jobId, {
      reason: 'Retry requested from Analysis Jobs API',
    })

    return {
      ok: true as const,
      newJobId: jobId,
      message: 'Retry queued successfully',
    }
  }

  async cancel(user: AuthUser, jobId: string) {
    const run = await prisma.pipelineRun.findUnique({ where: { id: jobId }, select: { id: true, workspaceId: true, status: true } })

    if (!run) {
      throw new HttpError(404, `Analysis job ${jobId} not found`)
    }

    if (!['QUEUED', 'RUNNING', 'DRAFT'].includes(run.status)) {
      throw new HttpError(400, 'Only queued or running jobs can be cancelled')
    }

    await pipelinesService.cancelRun(user, jobId, 'Cancelled from Analysis Jobs API')
    return {
      ok: true as const,
      message: 'Job cancelled successfully',
    }
  }

  async retryBulk(user: AuthUser, body: BulkJobActionDto) {
    const processedIds: string[] = []
    const skippedIds: string[] = []

    for (const jobId of body.jobIds) {
      try {
        await this.retry(user, jobId)
        processedIds.push(jobId)
      } catch {
        skippedIds.push(jobId)
      }
    }

    return {
      ok: true as const,
      processedIds,
      skippedIds,
      message: 'Bulk retry queued successfully',
    }
  }

  async cancelBulk(user: AuthUser, body: BulkJobActionDto) {
    const processedIds: string[] = []
    const skippedIds: string[] = []

    for (const jobId of body.jobIds) {
      try {
        await this.cancel(user, jobId)
        processedIds.push(jobId)
      } catch {
        skippedIds.push(jobId)
      }
    }

    return {
      ok: true as const,
      processedIds,
      skippedIds,
      message: 'Bulk cancel completed successfully',
    }
  }

  async getOutputDownload(user: AuthUser, jobId: string) {
    const record = await prisma.pipelineRun.findUnique({
      where: { id: jobId },
      include: {
        dataset: { select: { id: true, name: true } },
        workspace: { select: { id: true, name: true } },
        template: { select: { code: true, name: true } },
        triggeredBy: { select: { firstname: true, surname: true, email: true } },
        artifacts: {
          select: { id: true, kind: true, name: true, storageKey: true, mimeType: true, createdAt: true },
          orderBy: { createdAt: 'desc' },
        },
      },
    })

    if (!record) {
      throw new HttpError(404, `Analysis job ${jobId} not found`)
    }

    await assertWorkspaceAction(record.workspaceId, user, WorkspaceAction.VIEW_ANALYSIS)

    const payload = {
      id: record.id,
      jobName: record.name,
      status: AnalysisJobsMapper.mapPipelineStatus(record.status),
      datasetName: record.dataset?.name ?? 'N/A',
      workspaceName: record.workspace.name,
      analysisType: getAnalysisType(record),
      artifactCount: record.artifacts.length,
      artifacts: record.artifacts.map((artifact) => ({
        id: artifact.id,
        kind: artifact.kind,
        name: artifact.name,
        storageKey: artifact.storageKey,
        mimeType: artifact.mimeType,
        createdAt: artifact.createdAt.toISOString(),
      })),
    }

    return {
      content: JSON.stringify(payload, null, 2),
      fileName: `${jobId}-output.json`,
      contentType: 'application/json; charset=utf-8',
    }
  }

  async getLogsDownload(user: AuthUser, jobId: string) {
    const record = await prisma.pipelineRun.findUnique({
      where: { id: jobId },
      select: {
        id: true,
        workspaceId: true,
        failureReason: true,
        updatedAt: true,
        events: {
          select: { createdAt: true, level: true, message: true },
          orderBy: { createdAt: 'asc' },
          take: 500,
        },
      },
    })

    if (!record) {
      throw new HttpError(404, `Analysis job ${jobId} not found`)
    }

    await assertWorkspaceAction(record.workspaceId, user, WorkspaceAction.VIEW_ANALYSIS)

    const lines = record.events.map((event) => `[${event.createdAt.toISOString()}] ${event.level}: ${event.message}`)
    if (record.failureReason && !lines.some((line) => line.includes(record.failureReason!))) {
      lines.push(`[${record.updatedAt.toISOString()}] ERROR: ${record.failureReason}`)
    }

    return {
      content: lines.join('\n') || `No logs available for ${jobId}.`,
      fileName: `${jobId}-logs.txt`,
      contentType: 'text/plain; charset=utf-8',
    }
  }
}
