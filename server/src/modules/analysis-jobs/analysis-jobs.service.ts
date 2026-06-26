import { PipelineRunStatus, Prisma } from '@prisma/client'
import { prisma } from '../../db/prisma.js'
import { RESEARCH_QUEUES } from '../../pipelines/queue.constants.js'
import { PipelinesService } from '../../pipelines/service.js'
import { assertWorkspaceAction } from '../../services/workspace-access.service.js'
import { WorkspaceAction } from '../../services/workspace-permissions.js'
import { HttpError } from '../../utils/errors.js'
import { getQueueRegistry, isRedisReachable } from '../../workers/queue.factory.js'
import { AnalysisJobsMapper } from './analysis-jobs.mapper.js'
import type { BulkJobActionDto } from './dto/bulk-job-action.dto.js'
import type { ListAnalysisJobsQueryDto } from './dto/list-analysis-jobs-query.dto.js'
import type { AnalysisJobDetails, AnalysisJobListItem, AnalysisJobQueueInfo, AuthUser, PaginatedResult } from './analysis-jobs.types.js'

const pipelinesService = new PipelinesService(prisma)

type PipelineRunListRecord = Prisma.PipelineRunGetPayload<{
  include: {
    dataset: { select: { id: true; name: true } }
    workspace: { select: { id: true; name: true; ownerId: true } }
    template: { select: { id: true; code: true; name: true } }
    triggeredBy: { select: { firstname: true; surname: true; email: true } }
    _count: { select: { artifacts: true } }
    jobs: { select: { queueName: true; status: true; createdAt: true }; orderBy: { createdAt: 'desc' }; take: 5 }
    steps: { select: { order: true; type: true; status: true; workerType: true }; orderBy: { order: 'asc' } }
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
    steps: { select: { order: true; name: true; type: true; status: true; progressPercent: true; workerType: true }; orderBy: { order: 'asc' } }
    jobs: { select: { queueName: true; status: true; createdAt: true }; orderBy: { createdAt: 'desc' }; take: 10 }
  }
}>

type PipelineRunDuplicateRecord = Prisma.PipelineRunGetPayload<{
  include: {
    template: { select: { code: true } }
    steps: { select: { order: true; name: true; type: true; workerType: true; configJson: true }; orderBy: { order: 'asc' } }
  }
}>

type ArchiveMetadata = {
  archivedAt: string | null
  archivedById?: string
  archivedByEmail?: string
}

type QueueSnapshot = {
  backendAvailable: boolean
  targetJobsPerReplica: number
  waitingByQueue: Record<string, number>
  activeByQueue: Record<string, number>
  avgMinutesByQueue: Record<string, number>
}

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

function asObject(value: Prisma.JsonValue | null | undefined): Record<string, unknown> {
  if (!value || typeof value !== 'object' || Array.isArray(value)) {
    return {}
  }

  return { ...(value as Record<string, unknown>) }
}

function getArchiveMetadata(contextJson: Prisma.JsonValue | null | undefined): ArchiveMetadata {
  const root = asObject(contextJson)
  const analysisJobs = asObject(root.analysisJobs as Prisma.JsonValue | undefined)

  return {
    archivedAt: typeof analysisJobs.archivedAt === 'string' ? analysisJobs.archivedAt : null,
    archivedById: typeof analysisJobs.archivedById === 'string' ? analysisJobs.archivedById : undefined,
    archivedByEmail: typeof analysisJobs.archivedByEmail === 'string' ? analysisJobs.archivedByEmail : undefined,
  }
}

function withArchiveMetadata(
  contextJson: Prisma.JsonValue | null | undefined,
  archiveMetadata: ArchiveMetadata,
): Prisma.InputJsonValue {
  const root = asObject(contextJson)
  const analysisJobs = asObject(root.analysisJobs as Prisma.JsonValue | undefined)
  const nextAnalysisJobs: Record<string, unknown> = { ...analysisJobs }

  if (archiveMetadata.archivedAt) {
    nextAnalysisJobs.archivedAt = archiveMetadata.archivedAt
    nextAnalysisJobs.archivedById = archiveMetadata.archivedById ?? null
    nextAnalysisJobs.archivedByEmail = archiveMetadata.archivedByEmail ?? null
  } else {
    delete nextAnalysisJobs.archivedAt
    delete nextAnalysisJobs.archivedById
    delete nextAnalysisJobs.archivedByEmail
  }

  return {
    ...root,
    analysisJobs: nextAnalysisJobs,
  } as Prisma.InputJsonValue
}

function mapStepTypeToQueue(stepType?: string | null) {
  if (!stepType) return null
  if (['INGEST', 'PROFILE', 'VALIDATE'].includes(stepType)) return RESEARCH_QUEUES.INGEST
  if (['CLEAN', 'TRANSFORM', 'FEATURE_ENGINEERING', 'SPLIT'].includes(stepType)) return RESEARCH_QUEUES.TRANSFORM
  if (stepType === 'TRAIN') return RESEARCH_QUEUES.TRAIN
  if (['EVALUATE', 'EXPLAIN', 'CHART'].includes(stepType)) return RESEARCH_QUEUES.EVALUATE
  if (stepType === 'REPORT') return RESEARCH_QUEUES.REPORT
  if (stepType === 'EXPORT') return RESEARCH_QUEUES.EXPORT
  if (stepType === 'PUBLISH') return RESEARCH_QUEUES.PUBLISH
  return RESEARCH_QUEUES.INGEST
}

function getQueueNameForRecord(record: { jobs: Array<{ queueName: string; status: string }>; steps: Array<{ type: string; status: string }> }) {
  const workerJob = record.jobs.find((job) => ['QUEUED', 'ACTIVE', 'RETRYING'].includes(job.status))
  if (workerJob) {
    return workerJob.queueName
  }

  const step = record.steps.find((item) => ['RUNNING', 'QUEUED', 'PENDING'].includes(item.status))
  return mapStepTypeToQueue(step?.type)
}

function roundMinutes(value: number) {
  return Math.max(0, Math.round(value * 10) / 10)
}

function buildQueueInfo(
  record: { status: string; createdAt: Date; jobs: Array<{ queueName: string; status: string }>; steps: Array<{ type: string; status: string }> },
  snapshot: QueueSnapshot,
): AnalysisJobQueueInfo | null {
  const queueName = getQueueNameForRecord(record)
  const queuedMinutes = ['DRAFT', 'QUEUED'].includes(record.status)
    ? roundMinutes((Date.now() - record.createdAt.getTime()) / 60000)
    : null

  if (!queueName) {
    return {
      queueName: null,
      backendAvailable: snapshot.backendAvailable,
      waitingJobs: 0,
      activeJobs: 0,
      queuedMinutes,
      estimatedWaitMinutes: null,
      note: 'Queue details are unavailable for this job stage.',
    }
  }

  const waitingJobs = snapshot.waitingByQueue[queueName] ?? 0
  const activeJobs = snapshot.activeByQueue[queueName] ?? 0
  const avgMinutes = snapshot.avgMinutesByQueue[queueName] ?? 5
  const waitingAhead = ['DRAFT', 'QUEUED'].includes(record.status) ? Math.max(0, waitingJobs - 1) : 0
  const estimatedWaitMinutes =
    ['DRAFT', 'QUEUED'].includes(record.status) && snapshot.backendAvailable
      ? roundMinutes((waitingAhead / Math.max(1, snapshot.targetJobsPerReplica)) * avgMinutes)
      : record.status === 'RUNNING'
        ? 0
        : null

  let note = 'Queue estimate is based on current backlog and recent worker durations.'
  if (!snapshot.backendAvailable) {
    note = 'PostgreSQL local queue mode is active; ETA falls back to observed queued time only.'
  } else if (record.status === 'RUNNING') {
    note = 'This job is currently executing on a worker.'
  }

  return {
    queueName,
    backendAvailable: snapshot.backendAvailable,
    waitingJobs,
    activeJobs,
    queuedMinutes,
    estimatedWaitMinutes,
    note,
  }
}

async function buildQueueSnapshot(queueNames: string[]): Promise<QueueSnapshot> {
  const targetJobsPerReplica = Number(process.env.AUTOSCALE_TARGET_JOBS_PER_REPLICA ?? 8)
  const uniqueQueueNames = Array.from(new Set(queueNames.filter(Boolean)))
  const waitingByQueue: Record<string, number> = {}
  const activeByQueue: Record<string, number> = {}

  const recentWorkerJobs = uniqueQueueNames.length
    ? await prisma.workerJob.findMany({
        where: {
          queueName: { in: uniqueQueueNames },
          status: 'COMPLETED',
          startedAt: { not: null },
          completedAt: { not: null },
        },
        select: { queueName: true, startedAt: true, completedAt: true },
        orderBy: { completedAt: 'desc' },
        take: 400,
      })
    : []

  const avgMinutesByQueue = uniqueQueueNames.reduce<Record<string, number>>((acc, queueName) => {
    const matches = recentWorkerJobs.filter((job) => job.queueName === queueName)
    if (!matches.length) {
      acc[queueName] = 5
      return acc
    }

    const avgMs =
      matches.reduce((sum, job) => sum + (job.completedAt!.getTime() - job.startedAt!.getTime()), 0) / matches.length
    acc[queueName] = Math.max(1, roundMinutes(avgMs / 60000))
    return acc
  }, {})

  const backendAvailable = await isRedisReachable()
  if (backendAvailable && uniqueQueueNames.length) {
    const registry = getQueueRegistry()
    await Promise.all(
      uniqueQueueNames.map(async (queueName) => {
        try {
          const queue = registry[queueName]
          const counts = queue ? await queue.getJobCounts('waiting', 'active') : { waiting: 0, active: 0 }
          waitingByQueue[queueName] = counts.waiting ?? 0
          activeByQueue[queueName] = counts.active ?? 0
        } catch {
          waitingByQueue[queueName] = 0
          activeByQueue[queueName] = 0
        }
      }),
    )
  }

  return {
    backendAvailable,
    targetJobsPerReplica,
    waitingByQueue,
    activeByQueue,
    avgMinutesByQueue,
  }
}

function mapListRecord(record: PipelineRunListRecord, queueSnapshot: QueueSnapshot): AnalysisJobListItem {
  const archiveMetadata = getArchiveMetadata(record.contextJson)

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
    archivedAt: archiveMetadata.archivedAt ? new Date(archiveMetadata.archivedAt) : null,
    queue: buildQueueInfo(record, queueSnapshot),
  }
}

function mapDetailsRecord(record: PipelineRunDetailsRecord, queueSnapshot: QueueSnapshot): AnalysisJobDetails {
  const archiveMetadata = getArchiveMetadata(record.contextJson)
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
    archivedAt: archiveMetadata.archivedAt ? new Date(archiveMetadata.archivedAt) : null,
    queue: buildQueueInfo(record, queueSnapshot),
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
        jobs: { select: { queueName: true, status: true, createdAt: true }, orderBy: { createdAt: 'desc' }, take: 5 },
        steps: { select: { order: true, type: true, status: true, workerType: true }, orderBy: { order: 'asc' } },
      },
    })

    const queueSnapshot = await buildQueueSnapshot(records.map((record) => getQueueNameForRecord(record) ?? '').filter(Boolean))
    const mapped = sortItems(
      records
        .map((record) => mapListRecord(record, queueSnapshot))
        .filter((record) => (query.includeArchived ? true : !record.archivedAt)),
      query.sort,
    )
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
          select: { order: true, name: true, type: true, status: true, progressPercent: true, workerType: true },
          orderBy: { order: 'asc' },
        },
        jobs: { select: { queueName: true, status: true, createdAt: true }, orderBy: { createdAt: 'desc' }, take: 10 },
      },
    })

    if (!record) {
      throw new HttpError(404, `Analysis job ${jobId} not found`)
    }

    await assertWorkspaceAction(record.workspaceId, user, WorkspaceAction.VIEW_ANALYSIS)
    const queueSnapshot = await buildQueueSnapshot([getQueueNameForRecord(record) ?? ''].filter(Boolean))
    return mapDetailsRecord(record, queueSnapshot)
  }

  async archive(user: AuthUser, jobId: string) {
    const run = await prisma.pipelineRun.findUnique({ where: { id: jobId }, select: { id: true, workspaceId: true, status: true, name: true, contextJson: true } })

    if (!run) {
      throw new HttpError(404, `Analysis job ${jobId} not found`)
    }

    await assertWorkspaceAction(run.workspaceId, user, WorkspaceAction.CANCEL_ANALYSIS)

    if (['QUEUED', 'RUNNING'].includes(run.status)) {
      throw new HttpError(400, 'Active jobs must be cancelled before they can be archived')
    }

    const currentArchive = getArchiveMetadata(run.contextJson)
    if (currentArchive.archivedAt) {
      return { ok: true as const, message: 'Job is already archived' }
    }

    await prisma.pipelineRun.update({
      where: { id: jobId },
      data: {
        contextJson: withArchiveMetadata(run.contextJson, {
          archivedAt: new Date().toISOString(),
          archivedById: user.id,
          archivedByEmail: user.email,
        }),
      },
    })

    return { ok: true as const, message: `Job ${run.name} archived successfully` }
  }

  async restore(user: AuthUser, jobId: string) {
    const run = await prisma.pipelineRun.findUnique({ where: { id: jobId }, select: { id: true, workspaceId: true, name: true, contextJson: true } })

    if (!run) {
      throw new HttpError(404, `Analysis job ${jobId} not found`)
    }

    await assertWorkspaceAction(run.workspaceId, user, WorkspaceAction.CANCEL_ANALYSIS)

    await prisma.pipelineRun.update({
      where: { id: jobId },
      data: {
        contextJson: withArchiveMetadata(run.contextJson, { archivedAt: null }),
      },
    })

    return { ok: true as const, message: `Job ${run.name} restored successfully` }
  }

  async duplicate(user: AuthUser, jobId: string) {
    const run = await prisma.pipelineRun.findUnique({
      where: { id: jobId },
      include: {
        template: { select: { code: true } },
        steps: {
          select: { order: true, name: true, type: true, workerType: true, configJson: true },
          orderBy: { order: 'asc' },
        },
      },
    }) as PipelineRunDuplicateRecord | null

    if (!run) {
      throw new HttpError(404, `Analysis job ${jobId} not found`)
    }

    const manualSteps = run.steps.map((step) => ({
      order: step.order,
      name: step.name,
      type: step.type,
      workerType: step.workerType ?? undefined,
      config: (step.configJson && typeof step.configJson === 'object' && !Array.isArray(step.configJson)
        ? (step.configJson as Record<string, unknown>)
        : undefined),
    }))

    const duplicatedRun = await pipelinesService.createWorkspaceRun(user, {
      workspaceId: run.workspaceId,
      datasetId: run.datasetId ?? undefined,
      requestId: run.requestId ?? undefined,
      templateCode: run.template?.code ?? undefined,
      name: `${run.name} (copy)`,
      parameters: Object.keys(asObject(run.parametersJson)).length ? asObject(run.parametersJson) : undefined,
      manualSteps,
    })

    return {
      ok: true as const,
      newJobId: duplicatedRun.id,
      message: `Job ${run.name} duplicated successfully`,
    }
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

  async delete(user: AuthUser, jobId: string) {
    const run = await prisma.pipelineRun.findUnique({ where: { id: jobId }, select: { id: true, workspaceId: true, status: true, name: true, contextJson: true } })

    if (!run) {
      throw new HttpError(404, `Analysis job ${jobId} not found`)
    }

    await assertWorkspaceAction(run.workspaceId, user, WorkspaceAction.CANCEL_ANALYSIS)

    const archive = getArchiveMetadata(run.contextJson)
    if (['QUEUED', 'RUNNING'].includes(run.status)) {
      throw new HttpError(400, 'Active jobs must be cancelled before they can be deleted')
    }

    if (!archive.archivedAt) {
      throw new HttpError(400, 'Archive the job first before permanently deleting it')
    }

    await prisma.pipelineRun.delete({ where: { id: jobId } })

    return {
      ok: true as const,
      message: `Job ${run.name} deleted successfully`,
    }
  }

  async archiveBulk(user: AuthUser, body: BulkJobActionDto) {
    const processedIds: string[] = []
    const skippedIds: string[] = []

    for (const jobId of body.jobIds) {
      try {
        await this.archive(user, jobId)
        processedIds.push(jobId)
      } catch {
        skippedIds.push(jobId)
      }
    }

    return {
      ok: true as const,
      processedIds,
      skippedIds,
      message: 'Bulk archive completed successfully',
    }
  }

  async restoreBulk(user: AuthUser, body: BulkJobActionDto) {
    const processedIds: string[] = []
    const skippedIds: string[] = []

    for (const jobId of body.jobIds) {
      try {
        await this.restore(user, jobId)
        processedIds.push(jobId)
      } catch {
        skippedIds.push(jobId)
      }
    }

    return {
      ok: true as const,
      processedIds,
      skippedIds,
      message: 'Bulk restore completed successfully',
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

  async deleteBulk(user: AuthUser, body: BulkJobActionDto) {
    const processedIds: string[] = []
    const skippedIds: string[] = []

    for (const jobId of body.jobIds) {
      try {
        await this.delete(user, jobId)
        processedIds.push(jobId)
      } catch {
        skippedIds.push(jobId)
      }
    }

    return {
      ok: true as const,
      processedIds,
      skippedIds,
      message: 'Bulk delete completed successfully',
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
