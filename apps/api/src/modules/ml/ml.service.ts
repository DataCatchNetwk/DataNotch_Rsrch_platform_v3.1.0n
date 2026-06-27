import { prisma } from '../../db/prisma.js'
import { AnalysisAlgorithmType, AnalysisOrchestratorModule, AnalysisRunType } from '../analysis-orchestrator/analysis-orchestrator.module.js'
import { assertAnalysisRunAccess, assertResearchWorkspaceAccess, listAccessibleResearchWorkspaceIds, ResearchAuthUser, toRunResponse } from '../research-common.js'
import { HttpError } from '../../utils/errors.js'

const analysisOrchestrator = new AnalysisOrchestratorModule()

const ML_CATALOG = [
  { job: 'CLASSIFICATION', label: 'Classification pipelines', runType: AnalysisRunType.CLASSIFICATION, algorithm: AnalysisAlgorithmType.RANDOM_FOREST },
  { job: 'REGRESSION', label: 'Regression pipelines', runType: AnalysisRunType.REGRESSION, algorithm: AnalysisAlgorithmType.LINEAR_REGRESSION },
  { job: 'CLUSTERING', label: 'Clustering', runType: AnalysisRunType.CLUSTERING, algorithm: AnalysisAlgorithmType.K_MEANS },
  { job: 'DIMENSIONALITY_REDUCTION', label: 'Dimensionality reduction', runType: AnalysisRunType.DIM_REDUCTION, algorithm: AnalysisAlgorithmType.PCA },
  { job: 'FEATURE_SELECTION', label: 'Feature selection', runType: AnalysisRunType.CUSTOM },
  { job: 'CROSS_VALIDATION', label: 'Cross-validation', runType: AnalysisRunType.CUSTOM },
  { job: 'TUNING', label: 'Hyperparameter tuning', runType: AnalysisRunType.CUSTOM },
  { job: 'EXPLAINABILITY', label: 'Explainability reports', runType: AnalysisRunType.CUSTOM },
] as const

type MlJob = (typeof ML_CATALOG)[number]['job']

function getJobConfig(job: MlJob) {
  const config = ML_CATALOG.find((entry) => entry.job === job)
  if (!config) {
    throw new HttpError(400, `Unsupported ML job: ${job}`)
  }
  return config
}

export class MlService {
  listCatalog() {
    return ML_CATALOG
  }

  async launch(user: ResearchAuthUser, input: {
    researchWorkspaceId: string
    job: MlJob
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
        engine: 'ml',
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
      .filter((run) => run.configJson && (run.configJson as Record<string, unknown>).engine === 'ml')
      .map(toRunResponse)
  }

  async getRun(user: ResearchAuthUser, runId: string) {
    const run = await assertAnalysisRunAccess(user, runId)
    if ((run.configJson as Record<string, unknown>).engine !== 'ml') {
      throw new HttpError(404, 'ML run not found')
    }
    return toRunResponse(run)
  }

  async getRecommendations(user: ResearchAuthUser, runId: string) {
    const run = await assertAnalysisRunAccess(user, runId)
    if ((run.configJson as Record<string, unknown>).engine !== 'ml') {
      throw new HttpError(404, 'ML run not found')
    }

    const config = run.configJson as Record<string, unknown>
    const metrics = (run.metricsJson as Record<string, unknown> | null) ?? {}

    return {
      run: toRunResponse(run),
      recommendations: [
        `Primary ML job: ${String(config.job ?? 'UNKNOWN')}`,
        run.status === 'SUCCEEDED' ? 'Promote the best-performing run into experiment tracking.' : 'Wait for run completion before promotion.',
        Object.keys(metrics).length ? 'Use metrics endpoint output to compare candidate runs.' : 'No metrics captured yet for this run.',
      ],
    }
  }
}
