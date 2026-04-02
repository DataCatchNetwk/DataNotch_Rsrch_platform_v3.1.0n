import { prisma } from '../../db/prisma.js'
import { AnalysisAlgorithmType, AnalysisOrchestratorModule, AnalysisRunType } from '../analysis-orchestrator/analysis-orchestrator.module.js'
import { assertAnalysisRunAccess, assertResearchWorkspaceAccess, listAccessibleResearchWorkspaceIds, ResearchAuthUser, toRunResponse } from '../research-common.js'
import { HttpError } from '../../utils/errors.js'

const analysisOrchestrator = new AnalysisOrchestratorModule()

const STATISTICS_CATALOG = [
  { job: 'DESCRIPTIVE_STATISTICS', label: 'Descriptive statistics', runType: AnalysisRunType.DESCRIPTIVE },
  { job: 'LINEAR_REGRESSION', label: 'Linear regression', runType: AnalysisRunType.REGRESSION, algorithm: AnalysisAlgorithmType.LINEAR_REGRESSION },
  { job: 'LOGISTIC_REGRESSION', label: 'Logistic regression', runType: AnalysisRunType.CLASSIFICATION, algorithm: AnalysisAlgorithmType.LOGISTIC_REGRESSION },
  { job: 'MULTINOMIAL_REGRESSION', label: 'Multinomial regression', runType: AnalysisRunType.CLASSIFICATION, algorithm: AnalysisAlgorithmType.LOGISTIC_REGRESSION },
  { job: 'ANOVA', label: 'ANOVA', runType: AnalysisRunType.REGRESSION, algorithm: AnalysisAlgorithmType.ANOVA },
  { job: 'CHI_SQUARE', label: 'Chi-square', runType: AnalysisRunType.CUSTOM },
  { job: 'MIXED_EFFECTS', label: 'Mixed-effects models', runType: AnalysisRunType.REGRESSION, algorithm: AnalysisAlgorithmType.LINEAR_MIXED_MODELS },
  { job: 'IMPUTATION', label: 'Imputation routines', runType: AnalysisRunType.CUSTOM },
] as const

type StatisticsJob = (typeof STATISTICS_CATALOG)[number]['job']

function getJobConfig(job: StatisticsJob) {
  const config = STATISTICS_CATALOG.find((entry) => entry.job === job)
  if (!config) {
    throw new HttpError(400, `Unsupported statistics job: ${job}`)
  }
  return config
}

export class StatisticsService {
  listCatalog() {
    return STATISTICS_CATALOG
  }

  async launch(user: ResearchAuthUser, input: {
    researchWorkspaceId: string
    job: StatisticsJob
    parameters?: Record<string, unknown>
    datasetVersionRef?: string
    featureSetVersionRef?: string
  }) {
    await assertResearchWorkspaceAccess(user, input.researchWorkspaceId)
    const jobConfig = getJobConfig(input.job)

    return analysisOrchestrator.createAnalysisRun({
      researchWorkspaceId: input.researchWorkspaceId,
      type: jobConfig.runType,
      algorithm: 'algorithm' in jobConfig ? jobConfig.algorithm : undefined,
      configJson: {
        engine: 'statistics',
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
      where: { researchWorkspaceId: { in: accessibleWorkspaceIds } },
      orderBy: { createdAt: 'desc' },
    })

    return runs
      .filter((run) => run.configJson && (run.configJson as Record<string, unknown>).engine === 'statistics')
      .map(toRunResponse)
  }

  async getRun(user: ResearchAuthUser, runId: string) {
    const run = await assertAnalysisRunAccess(user, runId)
    if ((run.configJson as Record<string, unknown>).engine !== 'statistics') {
      throw new HttpError(404, 'Statistics run not found')
    }
    return toRunResponse(run)
  }

  async getSummary(user: ResearchAuthUser, runId: string) {
    const run = await assertAnalysisRunAccess(user, runId)
    if ((run.configJson as Record<string, unknown>).engine !== 'statistics') {
      throw new HttpError(404, 'Statistics run not found')
    }

    const config = run.configJson as Record<string, unknown>
    const metrics = (run.metricsJson as Record<string, unknown> | null) ?? {}

    return {
      run: toRunResponse(run),
      statisticalJob: config.job ?? null,
      parameterSummary: (config.parameters as Record<string, unknown> | undefined) ?? {},
      metrics,
      narrative: `Statistics engine job ${String(config.job ?? 'UNKNOWN')} is currently ${run.status}.`,
    }
  }
}
