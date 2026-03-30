import {
  Body,
  Controller,
  Get,
  Param,
  ParseFilePipeBuilder,
  Post,
  Query,
  Res,
  StreamableFile,
} from "@nestjs/common";
import { Response } from "express";
import { AnalysisJobsMapper } from "./analysis-jobs.mapper";
import { AnalysisJobsService } from "./analysis-jobs.service";
import { BulkJobActionDto } from "./dto/bulk-job-action.dto";
import { AnalysisJobIdParamDto } from "./dto/analysis-job-id-param.dto";
import {
  BulkJobActionResponseDto,
  CancelJobResponseDto,
  PaginatedAnalysisJobsDto,
  RetryJobResponseDto,
  AnalysisJobDetailsDto,
} from "./dto/analysis-job-response.dto";
import { ListAnalysisJobsQueryDto } from "./dto/list-analysis-jobs-query.dto";

@Controller("analysis-jobs")
export class AnalysisJobsController {
  constructor(private readonly analysisJobsService: AnalysisJobsService) {}

  @Get()
  async list(
    @Query() query: ListAnalysisJobsQueryDto,
  ): Promise<PaginatedAnalysisJobsDto> {
    const result = await this.analysisJobsService.list(query);
    return AnalysisJobsMapper.toPaginatedDto(result);
  }

  @Get(":jobId")
  async getById(
    @Param() params: AnalysisJobIdParamDto,
  ): Promise<AnalysisJobDetailsDto> {
    const result = await this.analysisJobsService.getById(params.jobId);
    return AnalysisJobsMapper.toDetailsDto(result);
  }

  @Post(":jobId/retry")
  async retry(
    @Param() params: AnalysisJobIdParamDto,
  ): Promise<RetryJobResponseDto> {
    return this.analysisJobsService.retry(params.jobId);
  }

  @Post(":jobId/cancel")
  async cancel(
    @Param() params: AnalysisJobIdParamDto,
  ): Promise<CancelJobResponseDto> {
    return this.analysisJobsService.cancel(params.jobId);
  }

  @Post("bulk/retry")
  async retryBulk(
    @Body() body: BulkJobActionDto,
  ): Promise<BulkJobActionResponseDto> {
    return this.analysisJobsService.retryBulk(body);
  }

  @Post("bulk/cancel")
  async cancelBulk(
    @Body() body: BulkJobActionDto,
  ): Promise<BulkJobActionResponseDto> {
    return this.analysisJobsService.cancelBulk(body);
  }

  @Get(":jobId/download")
  async downloadOutput(
    @Param() params: AnalysisJobIdParamDto,
    @Res({ passthrough: true }) res: Response,
  ): Promise<StreamableFile> {
    await this.analysisJobsService.getById(params.jobId);
    const buffer = Buffer.from("mock analysis output package");
    res.set({
      "Content-Type": "application/zip",
      "Content-Disposition": `attachment; filename="${params.jobId}-output.zip"`,
    });
    return new StreamableFile(buffer);
  }

  @Get(":jobId/logs/download")
  async downloadLogs(
    @Param() params: AnalysisJobIdParamDto,
    @Res({ passthrough: true }) res: Response,
  ): Promise<StreamableFile> {
    const job = await this.analysisJobsService.getById(params.jobId);
    const buffer = Buffer.from((job.logs ?? []).join("\n"));
    res.set({
      "Content-Type": "text/plain; charset=utf-8",
      "Content-Disposition": `attachment; filename="${params.jobId}-logs.txt"`,
    });
    return new StreamableFile(buffer);
  }
}
