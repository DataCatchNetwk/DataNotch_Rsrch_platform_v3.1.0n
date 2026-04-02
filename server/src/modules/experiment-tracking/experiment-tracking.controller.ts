import type { Request, Response } from 'express'
import { z } from 'zod'
import { requireResearchUser } from '../research-common.js'
import { ExperimentTrackingService } from './experiment-tracking.service.js'

const createExperimentSchema = z.object({
  researchWorkspaceId: z.string().min(1),
  name: z.string().min(1),
  description: z.string().optional(),
})

const attachRunSchema = z.object({
  analysisRunId: z.string().min(1),
})

const championSchema = z.object({
  analysisRunId: z.string().min(1),
})

const experimentIdParamsSchema = z.object({ experimentId: z.string().min(1) })

export class ExperimentTrackingController {
  constructor(private readonly service: ExperimentTrackingService) {}

  create = async (req: Request, res: Response) => {
    const body = createExperimentSchema.parse(req.body)
    const result = await this.service.create(requireResearchUser(req), body)
    res.status(201).json(result)
  }

  list = async (req: Request, res: Response) => {
    const workspaceId = typeof req.query.researchWorkspaceId === 'string' ? req.query.researchWorkspaceId : undefined
    const result = await this.service.list(requireResearchUser(req), workspaceId)
    res.json({ items: result })
  }

  getById = async (req: Request, res: Response) => {
    const params = experimentIdParamsSchema.parse(req.params)
    const result = await this.service.getById(requireResearchUser(req), params.experimentId)
    res.json(result)
  }

  attachRun = async (req: Request, res: Response) => {
    const params = experimentIdParamsSchema.parse(req.params)
    const body = attachRunSchema.parse(req.body)
    const result = await this.service.attachRun(requireResearchUser(req), params.experimentId, body.analysisRunId)
    res.json(result)
  }

  listRuns = async (req: Request, res: Response) => {
    const params = experimentIdParamsSchema.parse(req.params)
    const result = await this.service.listRuns(requireResearchUser(req), params.experimentId)
    res.json({ items: result })
  }

  setChampion = async (req: Request, res: Response) => {
    const params = experimentIdParamsSchema.parse(req.params)
    const body = championSchema.parse(req.body)
    const result = await this.service.setChampion(requireResearchUser(req), params.experimentId, body.analysisRunId)
    res.json(result)
  }

  compareRuns = async (req: Request, res: Response) => {
    const params = experimentIdParamsSchema.parse(req.params)
    const currentRunId = typeof req.query.currentRunId === 'string' ? req.query.currentRunId : ''
    const previousRunId = typeof req.query.previousRunId === 'string' ? req.query.previousRunId : ''
    const result = await this.service.compareRuns(requireResearchUser(req), params.experimentId, currentRunId, previousRunId)
    res.json(result)
  }
}
