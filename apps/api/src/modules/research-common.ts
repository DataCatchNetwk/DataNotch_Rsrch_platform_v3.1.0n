import type { Request } from 'express'
import { Prisma, type AnalysisRun, type Dataset, type Experiment, type ResearchWorkspace } from '@prisma/client'
import { prisma } from '../db/prisma.js'
import { HttpError } from '../utils/errors.js'

export type ResearchAuthUser = {
  id: string
  email: string
  roles: string[]
}

export type AnalysisRunResponse = {
  id: string
  researchWorkspaceId: string
  type: string
  algorithm?: string
  status: string
  configJson: Record<string, unknown>
  metricsJson?: Record<string, unknown>
  artifactsJson?: Record<string, unknown>
  startedAt?: Date
  finishedAt?: Date
  createdAt: Date
  updatedAt: Date
}

export function requireResearchUser(req: Request): ResearchAuthUser {
  if (!req.user) {
    throw new HttpError(401, 'Authentication required')
  }

  return {
    id: req.user.id,
    email: req.user.email,
    roles: req.user.roles ?? [],
  }
}

export function isResearchAdmin(user: ResearchAuthUser) {
  return user.roles.includes('ADMIN') || user.roles.includes('SUPER_ADMIN')
}

export function asObject(value: Prisma.JsonValue | null | undefined): Record<string, unknown> {
  if (!value || typeof value !== 'object' || Array.isArray(value)) {
    return {}
  }

  return value as Record<string, unknown>
}

export function toRunResponse(run: AnalysisRun): AnalysisRunResponse {
  return {
    id: run.id,
    researchWorkspaceId: run.researchWorkspaceId,
    type: run.type,
    algorithm: run.algorithm ?? undefined,
    status: run.status,
    configJson: asObject(run.configJson),
    metricsJson: Object.keys(asObject(run.metricsJson)).length ? asObject(run.metricsJson) : undefined,
    artifactsJson: Object.keys(asObject(run.artifactsJson)).length ? asObject(run.artifactsJson) : undefined,
    startedAt: run.startedAt ?? undefined,
    finishedAt: run.finishedAt ?? undefined,
    createdAt: run.createdAt,
    updatedAt: run.updatedAt,
  }
}

export async function assertResearchWorkspaceAccess(user: ResearchAuthUser, researchWorkspaceId: string): Promise<ResearchWorkspace> {
  const workspace = await prisma.researchWorkspace.findUnique({ where: { id: researchWorkspaceId } })
  if (!workspace) {
    throw new HttpError(404, 'Research workspace not found')
  }

  if (!isResearchAdmin(user) && workspace.ownerId !== user.id) {
    throw new HttpError(403, 'You do not have access to this research workspace')
  }

  return workspace
}

export async function assertAnalysisRunAccess(user: ResearchAuthUser, runId: string): Promise<AnalysisRun> {
  const run = await prisma.analysisRun.findUnique({ where: { id: runId } })
  if (!run) {
    throw new HttpError(404, 'Analysis run not found')
  }

  await assertResearchWorkspaceAccess(user, run.researchWorkspaceId)
  return run
}

export async function assertExperimentAccess(user: ResearchAuthUser, experimentId: string): Promise<Experiment> {
  const experiment = await prisma.experiment.findUnique({ where: { id: experimentId } })
  if (!experiment) {
    throw new HttpError(404, 'Experiment not found')
  }

  await assertResearchWorkspaceAccess(user, experiment.researchWorkspaceId)
  return experiment
}

export async function assertDatasetAccess(user: ResearchAuthUser, datasetId: string): Promise<Dataset> {
  const dataset = await prisma.dataset.findUnique({
    where: { id: datasetId },
    include: { workspace: { select: { ownerId: true } } },
  })

  if (!dataset) {
    throw new HttpError(404, 'Dataset not found')
  }

  if (!dataset.isDepositListed && !isResearchAdmin(user) && dataset.workspace.ownerId !== user.id) {
    throw new HttpError(403, 'You do not have access to this dataset')
  }

  return dataset
}

export async function listAccessibleResearchWorkspaceIds(user: ResearchAuthUser): Promise<string[]> {
  if (isResearchAdmin(user)) {
    const workspaces = await prisma.researchWorkspace.findMany({ select: { id: true } })
    return workspaces.map((workspace) => workspace.id)
  }

  const workspaces = await prisma.researchWorkspace.findMany({
    where: { ownerId: user.id },
    select: { id: true },
  })

  return workspaces.map((workspace) => workspace.id)
}
