import type { Request, Response } from 'express'
import { HttpError } from '../../utils/errors.js'
import { AnalysisJobsMapper } from './analysis-jobs.mapper.js'
import { AnalysisJobsService } from './analysis-jobs.service.js'
import { analysisJobIdParamSchema } from './dto/analysis-job-id-param.dto.js'
import { listAnalysisJobsQuerySchema } from './dto/list-analysis-jobs-query.dto.js'

function requireUser(req: Request) {
  if (!req.user) {
    throw new HttpError(401, 'Authentication required')
  }

  return {
    id: req.user.id,
    email: req.user.email,
  }
}

export class AnalysisJobsController {
  constructor(private readonly analysisJobsService: AnalysisJobsService) {}

  list = async (req: Request, res: Response) => {
    const query = listAnalysisJobsQuerySchema.parse(req.query)
    const result = await this.analysisJobsService.list(requireUser(req), query)
    res.json(AnalysisJobsMapper.toPaginatedDto(result))
  }

  getById = async (req: Request, res: Response) => {
    const params = analysisJobIdParamSchema.parse(req.params)
    const result = await this.analysisJobsService.getById(requireUser(req), params.jobId)
    res.json(AnalysisJobsMapper.toDetailsDto(result))
  }

  retry = async (req: Request, res: Response) => {
    const params = analysisJobIdParamSchema.parse(req.params)
    const result = await this.analysisJobsService.retry(requireUser(req), params.jobId)
    res.json(result)
  }

  cancel = async (req: Request, res: Response) => {
    const params = analysisJobIdParamSchema.parse(req.params)
    const result = await this.analysisJobsService.cancel(requireUser(req), params.jobId)
    res.json(result)
  }

  retryBulk = async (req: Request, res: Response) => {
    const result = await this.analysisJobsService.retryBulk(requireUser(req), req.body)
    res.json(result)
  }

  cancelBulk = async (req: Request, res: Response) => {
    const result = await this.analysisJobsService.cancelBulk(requireUser(req), req.body)
    res.json(result)
  }

  downloadOutput = async (req: Request, res: Response) => {
    const params = analysisJobIdParamSchema.parse(req.params)
    const file = await this.analysisJobsService.getOutputDownload(requireUser(req), params.jobId)
    res.setHeader('Content-Type', file.contentType)
    res.setHeader('Content-Disposition', `attachment; filename="${file.fileName}"`)
    res.send(file.content)
  }

  downloadLogs = async (req: Request, res: Response) => {
    const params = analysisJobIdParamSchema.parse(req.params)
    const file = await this.analysisJobsService.getLogsDownload(requireUser(req), params.jobId)
    res.setHeader('Content-Type', file.contentType)
    res.setHeader('Content-Disposition', `attachment; filename="${file.fileName}"`)
    res.send(file.content)
  }
}
