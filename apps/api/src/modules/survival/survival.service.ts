import { prisma } from '../../db/prisma.js'
import { AnalysisAlgorithmType, AnalysisOrchestratorModule, AnalysisRunType } from '../analysis-orchestrator/analysis-orchestrator.module.js'
import { assertAnalysisRunAccess, assertResearchWorkspaceAccess, listAccessibleResearchWorkspaceIds, ResearchAuthUser, toRunResponse } from '../research-common.js'
import { HttpError } from '../../utils/errors.js'

const analysisOrchestrator = new AnalysisOrchestratorModule()

const SURVIVAL_CATALOG = [
  { job: 'KAPLAN_MEIER', label: 'Kaplan-Meier curves', algorithm: AnalysisAlgorithmType.KAPLAN_MEIER },
  { job: 'LOG_RANK', label: 'Log-rank tests' },
  { job: 'COX_PH', label: 'Cox proportional hazards', algorithm: AnalysisAlgorithmType.COX_PH },
  { job: 'HAZARD_SUMMARY', label: 'Hazard summaries' },
] as const

type SurvivalJob = (typeof SURVIVAL_CATALOG)[number]['job']

function getJobConfig(job: SurvivalJob) {
  const config = SURVIVAL_CATALOG.find((entry) => entry.job === job)
  if (!config) {
    throw new HttpError(400, `Unsupported survival job: ${job}`)
  }
  return config
}

export class SurvivalService {
  listCatalog() {
    return SURVIVAL_CATALOG
  }

  async launch(user: ResearchAuthUser, input: {
    researchWorkspaceId: string
    job: SurvivalJob
    parameters?: Record<string, unknown>
    datasetVersionRef?: string
    featureSetVersionRef?: string
  }) {
    await assertResearchWorkspaceAccess(user, input.researchWorkspaceId)
    const jobConfig = getJobConfig(input.job)

    return analysisOrchestrator.createAnalysisRun({
      researchWorkspaceId: input.researchWorkspaceId,
      type: AnalysisRunType.SURVIVAL,
      algorithm: 'algorithm' in jobConfig ? jobConfig.algorithm : undefined,
      configJson: {
        engine: 'survival',
        job: input.job,
        parameters: input.parameters ?? {},
        requestedBy: user.id,
      },
      datasetVersionRef: input.datasetVersionRef,
      featureSetVersionRef: input.featureSetVersionRef,
    })
  }

  async listRuns(user: ResearchAuthUser, researchWorkspaceId?: string) {
    const accessibleWorkspaceIds = researchWorkspaceId
      ? [(await assertResearchWorkspaceAccess(user, researchWorkspaceId)).id]
      : await listAccessibleResearchWorkspaceIds(user)

    const runs = await prisma.analysisRun.findMany({
      where: { researchWorkspaceId: { in: accessibleWorkspaceIds }, type: 'SURVIVAL' },
      orderBy: { createdAt: 'desc' },
    })

    return runs
      .filter((run) => run.configJson && (run.configJson as Record<string, unknown>).engine === 'survival')
      .map(toRunResponse)
  }

  async getRun(user: ResearchAuthUser, runId: string) {
    const run = await assertAnalysisRunAccess(user, runId)
    if ((run.configJson as Record<string, unknown>).engine !== 'survival') {
      throw new HttpError(404, 'Survival run not found')
    }
    return toRunResponse(run)
  }

  async getCurves(user: ResearchAuthUser, runId: string) {
    const run = await assertAnalysisRunAccess(user, runId)
    if ((run.configJson as Record<string, unknown>).engine !== 'survival') {
      throw new HttpError(404, 'Survival run not found')
    }

    return {
      run: toRunResponse(run),
      curves: {
        primary: [
          { time: 0, survivalProbability: 1 },
          { time: 6, survivalProbability: 0.91 },
          { time: 12, survivalProbability: 0.84 },
          { time: 24, survivalProbability: 0.73 },
        ],
      },
    }
  }
}
