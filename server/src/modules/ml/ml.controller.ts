import type { Request, Response } from 'express'
import { z } from 'zod'
import { requireResearchUser } from '../research-common.js'
import { MlService } from './ml.service.js'

const launchMlSchema = z.object({
  researchWorkspaceId: z.string().min(1),
  job: z.enum([
    'CLASSIFICATION',
    'REGRESSION',
    'CLUSTERING',
    'DIMENSIONALITY_REDUCTION',
    'FEATURE_SELECTION',
    'CROSS_VALIDATION',
    'TUNING',
    'EXPLAINABILITY',
  ]),
  parameters: z.record(z.string(), z.unknown()).optional(),
  datasetVersionRef: z.string().optional(),
  featureSetVersionRef: z.string().optional(),
})

const runIdParamsSchema = z.object({ runId: z.string().min(1) })

export class MlController {
  constructor(private readonly service: MlService) {}

  catalog = async (_req: Request, res: Response) => {
    res.json({ jobs: this.service.listCatalog() })
  }

  launch = async (req: Request, res: Response) => {
    const body = launchMlSchema.parse(req.body)
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

  recommendations = async (req: Request, res: Response) => {
    const params = runIdParamsSchema.parse(req.params)
    const result = await this.service.getRecommendations(requireResearchUser(req), params.runId)
    res.json(result)
  }
}
