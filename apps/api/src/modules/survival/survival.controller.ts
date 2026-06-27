import type { Request, Response } from 'express'
import { z } from 'zod'
import { requireResearchUser } from '../research-common.js'
import { SurvivalService } from './survival.service.js'

const launchSurvivalSchema = z.object({
  researchWorkspaceId: z.string().min(1),
  job: z.enum(['KAPLAN_MEIER', 'LOG_RANK', 'COX_PH', 'HAZARD_SUMMARY']),
  parameters: z.record(z.string(), z.unknown()).optional(),
  datasetVersionRef: z.string().optional(),
  featureSetVersionRef: z.string().optional(),
})

const runIdParamsSchema = z.object({ runId: z.string().min(1) })

export class SurvivalController {
  constructor(private readonly service: SurvivalService) {}

  catalog = async (_req: Request, res: Response) => {
    res.json({ jobs: this.service.listCatalog() })
  }

  launch = async (req: Request, res: Response) => {
    const body = launchSurvivalSchema.parse(req.body)
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

  curves = async (req: Request, res: Response) => {
    const params = runIdParamsSchema.parse(req.params)
    const result = await this.service.getCurves(requireResearchUser(req), params.runId)
    res.json(result)
  }
}
