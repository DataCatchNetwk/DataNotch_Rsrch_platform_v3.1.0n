import { Body, Controller, Get, Param, Post } from '@nestjs/common';
import { PipelineOrchestratorService } from '../services/pipeline-orchestrator.service';
import type { CreatePipelineInput } from '../types/pipeline.types';
import type { PipelineStageName } from '../constants/pipeline.constants';

@Controller('api/pipelines')
export class PipelineController {
  constructor(private readonly orchestrator: PipelineOrchestratorService) {}

  @Get()
  list() {
    return {
      items: this.orchestrator.listPipelines(),
      metrics: this.orchestrator.getMetrics(),
    };
  }

  @Get('metrics')
  metrics() {
    return this.orchestrator.getMetrics();
  }

  @Get(':pipelineId')
  getOne(@Param('pipelineId') pipelineId: string) {
    return this.orchestrator.getPipeline(pipelineId);
  }

  @Post()
  async create(@Body() body: CreatePipelineInput) {
    return this.orchestrator.createPipeline(body);
  }

  @Post(':pipelineId/retry/:stage')
  async retry(
    @Param('pipelineId') pipelineId: string,
    @Param('stage') stage: PipelineStageName,
  ) {
    await this.orchestrator.retryFromStage(pipelineId, stage);
    return this.orchestrator.getPipeline(pipelineId);
  }
}
