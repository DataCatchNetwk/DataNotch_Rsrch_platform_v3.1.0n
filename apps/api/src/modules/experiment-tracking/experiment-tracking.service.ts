import { prisma } from '../../db/prisma.js'
import { MetricsModule } from '../metrics/metrics.module.js'
import { assertAnalysisRunAccess, assertExperimentAccess, assertResearchWorkspaceAccess, asObject, listAccessibleResearchWorkspaceIds, ResearchAuthUser, toRunResponse } from '../research-common.js'
import { HttpError } from '../../utils/errors.js'

const metricsModule = new MetricsModule()

export class ExperimentTrackingService {
  async create(user: ResearchAuthUser, input: { researchWorkspaceId: string; name: string; description?: string }) {
    await assertResearchWorkspaceAccess(user, input.researchWorkspaceId)

    return prisma.experiment.create({
      data: {
        researchWorkspaceId: input.researchWorkspaceId,
        name: input.name,
        description: input.description,
      },
    })
  }

  async list(user: ResearchAuthUser, researchWorkspaceId?: string) {
    const accessibleWorkspaceIds = researchWorkspaceId
      ? [(await assertResearchWorkspaceAccess(user, researchWorkspaceId)).id]
      : await listAccessibleResearchWorkspaceIds(user)

    return prisma.experiment.findMany({
      where: { researchWorkspaceId: { in: accessibleWorkspaceIds } },
      orderBy: { createdAt: 'desc' },
    })
  }

  async getById(user: ResearchAuthUser, experimentId: string) {
    const experiment = await assertExperimentAccess(user, experimentId)
    const runs = await this.listRuns(user, experimentId)

    return {
      ...experiment,
      runs,
    }
  }

  async attachRun(user: ResearchAuthUser, experimentId: string, analysisRunId: string) {
    const [experiment, run] = await Promise.all([
      assertExperimentAccess(user, experimentId),
      assertAnalysisRunAccess(user, analysisRunId),
    ])

    if (experiment.researchWorkspaceId !== run.researchWorkspaceId) {
      throw new HttpError(400, 'Analysis run belongs to a different research workspace')
    }

    const artifacts = asObject(run.artifactsJson)
    await prisma.analysisRun.update({
      where: { id: run.id },
      data: {
        artifactsJson: {
          ...artifacts,
          __experimentTracking: {
            experimentId,
            linkedAt: new Date().toISOString(),
          },
        },
      },
    })

    return { ok: true as const }
  }

  async listRuns(user: ResearchAuthUser, experimentId: string) {
    const experiment = await assertExperimentAccess(user, experimentId)
    const runs = await prisma.analysisRun.findMany({
      where: { researchWorkspaceId: experiment.researchWorkspaceId },
      orderBy: { createdAt: 'desc' },
    })

    return runs
      .filter((run) => {
        const tracking = asObject(asObject(run.artifactsJson).__experimentTracking as any)
        return tracking.experimentId === experimentId || experiment.championRunId === run.id
      })
      .map((run) => ({
        ...toRunResponse(run),
        linkedExperimentId: experimentId,
      }))
  }

  async setChampion(user: ResearchAuthUser, experimentId: string, analysisRunId: string) {
    await this.attachRun(user, experimentId, analysisRunId)
    await prisma.experiment.update({
      where: { id: experimentId },
      data: { championRunId: analysisRunId },
    })

    return { ok: true as const, championRunId: analysisRunId }
  }

  async compareRuns(user: ResearchAuthUser, experimentId: string, currentRunId: string, previousRunId: string) {
    const runs = await this.listRuns(user, experimentId)
    const runIds = new Set(runs.map((run) => run.id))

    if (!runIds.has(currentRunId) || !runIds.has(previousRunId)) {
      throw new HttpError(400, 'Both runs must be attached to the experiment before comparison')
    }

    const comparison = await metricsModule.compareMetrics(currentRunId, previousRunId)
    return {
      experimentId,
      currentRunId,
      previousRunId,
      comparison,
    }
  }
}
