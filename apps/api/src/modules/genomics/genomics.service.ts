import { prisma } from '../../db/prisma.js'
import { AnalysisOrchestratorModule, AnalysisRunType } from '../analysis-orchestrator/analysis-orchestrator.module.js'
import { assertAnalysisRunAccess, assertDatasetAccess, assertResearchWorkspaceAccess, asObject, listAccessibleResearchWorkspaceIds, ResearchAuthUser, toRunResponse } from '../research-common.js'
import { HttpError } from '../../utils/errors.js'

const analysisOrchestrator = new AnalysisOrchestratorModule()

const GENOMICS_CATALOG = [
  { job: 'VARIANT_INDEXING', label: 'Variant metadata indexing' },
  { job: 'EXPRESSION_NORMALIZATION', label: 'Expression matrix normalization' },
  { job: 'PATHWAY_ENRICHMENT', label: 'Pathway enrichment' },
  { job: 'DIFFERENTIAL_ANALYSIS', label: 'Differential analysis scaffolds' },
] as const

type GenomicsJob = (typeof GENOMICS_CATALOG)[number]['job']

function getJobConfig(job: GenomicsJob) {
  const config = GENOMICS_CATALOG.find((entry) => entry.job === job)
  if (!config) {
    throw new HttpError(400, `Unsupported genomics job: ${job}`)
  }
  return config
}

export class GenomicsService {
  listCatalog() {
    return GENOMICS_CATALOG
  }

  async launch(user: ResearchAuthUser, input: {
    researchWorkspaceId: string
    job: GenomicsJob
    parameters?: Record<string, unknown>
    datasetVersionRef?: string
    featureSetVersionRef?: string
  }) {
    await assertResearchWorkspaceAccess(user, input.researchWorkspaceId)
    const jobConfig = getJobConfig(input.job)

    return analysisOrchestrator.createAnalysisRun({
      researchWorkspaceId: input.researchWorkspaceId,
      type: AnalysisRunType.GENOMICS,
      configJson: {
        engine: 'genomics',
        job: jobConfig.job,
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
      where: { researchWorkspaceId: { in: accessibleWorkspaceIds }, type: 'GENOMICS' },
      orderBy: { createdAt: 'desc' },
    })

    return runs
      .filter((run) => run.configJson && (run.configJson as Record<string, unknown>).engine === 'genomics')
      .map(toRunResponse)
  }

  async getRun(user: ResearchAuthUser, runId: string) {
    const run = await assertAnalysisRunAccess(user, runId)
    if ((run.configJson as Record<string, unknown>).engine !== 'genomics') {
      throw new HttpError(404, 'Genomics run not found')
    }
    return toRunResponse(run)
  }

  async getDatasetSummary(user: ResearchAuthUser, datasetId: string) {
    const dataset = await assertDatasetAccess(user, datasetId)
    const metadata = asObject(dataset.metadataJson)

    return {
      datasetId: dataset.id,
      name: dataset.name,
      domain: dataset.domain,
      tags: dataset.tags,
      summary: {
        recordCount: dataset.recordCount ?? 0,
        columnCount: dataset.columnCount ?? 0,
        variantIndexed: Boolean(metadata.variantIndexed),
        normalizedExpression: Boolean(metadata.normalizedExpression),
        pathwayAnnotations: Array.isArray(metadata.pathwayAnnotations) ? metadata.pathwayAnnotations : [],
      },
    }
  }
}
