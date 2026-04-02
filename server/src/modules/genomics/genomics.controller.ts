import type { Request, Response } from 'express'
import { z } from 'zod'
import { requireResearchUser } from '../research-common.js'
import { GenomicsService } from './genomics.service.js'

const launchGenomicsSchema = z.object({
  researchWorkspaceId: z.string().min(1),
  job: z.enum(['VARIANT_INDEXING', 'EXPRESSION_NORMALIZATION', 'PATHWAY_ENRICHMENT', 'DIFFERENTIAL_ANALYSIS']),
  parameters: z.record(z.string(), z.unknown()).optional(),
  datasetVersionRef: z.string().optional(),
  featureSetVersionRef: z.string().optional(),
})

const runIdParamsSchema = z.object({ runId: z.string().min(1) })
const datasetIdParamsSchema = z.object({ datasetId: z.string().min(1) })

export class GenomicsController {
  constructor(private readonly service: GenomicsService) {}

  catalog = async (_req: Request, res: Response) => {
    res.json({ jobs: this.service.listCatalog() })
  }

  launch = async (req: Request, res: Response) => {
    const body = launchGenomicsSchema.parse(req.body)
    const result = await this.service.launch(requireResearchUser(req), body)
    res.status(201).json(result)
  }

  listRuns = async (req: Request, res: Response) => {
    const workspaceId = typeof req.query.researchWorkspaceId === 'string' ? req.query.researchWorkspaceId : undefined
    const result = await this.service.listRuns(requireResearchUser(req), workspaceId)
    res.json({ items: result })
  }

  getRun = async (req: Request, res: Response) => {
    const params = runIdParamsSchema.parse(req.params)
    const result = await this.service.getRun(requireResearchUser(req), params.runId)
    res.json(result)
  }

  datasetSummary = async (req: Request, res: Response) => {
    const params = datasetIdParamsSchema.parse(req.params)
    const result = await this.service.getDatasetSummary(requireResearchUser(req), params.datasetId)
    res.json(result)
  }
}
