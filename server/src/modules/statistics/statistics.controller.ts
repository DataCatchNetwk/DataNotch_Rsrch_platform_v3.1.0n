import type { Request, Response } from 'express'
import { z } from 'zod'
import { requireResearchUser } from '../research-common.js'
import { StatisticsService } from './statistics.service.js'

const launchStatisticsSchema = z.object({
  researchWorkspaceId: z.string().min(1),
  job: z.enum([
    'DESCRIPTIVE_STATISTICS',
    'LINEAR_REGRESSION',
    'LOGISTIC_REGRESSION',
    'MULTINOMIAL_REGRESSION',
    'ANOVA',
    'CHI_SQUARE',
    'MIXED_EFFECTS',
    'IMPUTATION',
  ]),
  parameters: z.record(z.string(), z.unknown()).optional(),
  datasetVersionRef: z.string().optional(),
  featureSetVersionRef: z.string().optional(),
})

const runIdParamsSchema = z.object({ runId: z.string().min(1) })

export class StatisticsController {
  constructor(private readonly service: StatisticsService) {}

  catalog = async (_req: Request, res: Response) => {
    res.json({ jobs: this.service.listCatalog() })
  }

  launch = async (req: Request, res: Response) => {
    const body = launchStatisticsSchema.parse(req.body)
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

  summary = async (req: Request, res: Response) => {
    const params = runIdParamsSchema.parse(req.params)
    const result = await this.service.getSummary(requireResearchUser(req), params.runId)
    res.json(result)
  }
}
