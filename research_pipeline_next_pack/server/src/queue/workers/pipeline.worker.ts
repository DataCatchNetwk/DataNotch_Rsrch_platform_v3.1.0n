import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { Job, Worker } from 'bullmq';
import { RedisService } from '../../redis/redis.service';
import { PIPELINE_QUEUES, type PipelineStageName } from '../constants/pipeline.constants';
import { PipelineOrchestratorService } from '../services/pipeline-orchestrator.service';
import type { StageWorkerPayload } from '../types/pipeline.types';

@Injectable()
export class PipelineWorker implements OnModuleInit {
  private readonly logger = new Logger(PipelineWorker.name);

  constructor(
    private readonly redisService: RedisService,
    private readonly orchestrator: PipelineOrchestratorService,
  ) {}

  onModuleInit() {
    const connection = this.redisService.getClient();
    const stageQueues = [
      PIPELINE_QUEUES.INGEST,
      PIPELINE_QUEUES.CLEAN,
      PIPELINE_QUEUES.ANALYZE,
      PIPELINE_QUEUES.REPORT,
    ];

    for (const queueName of stageQueues) {
      new Worker(
        queueName,
        async (job: Job<StageWorkerPayload>) => this.processJob(job),
        { connection, concurrency: 4 },
      );
    }

    this.logger.log('Pipeline workers initialized.');
  }

  private async processJob(job: Job<StageWorkerPayload>) {
    const { pipelineId, stage } = job.data;
    await this.orchestrator.handleStageStarted(pipelineId, stage);

    try {
      await this.runStageSimulation(job, stage);
      await this.orchestrator.handleStageCompleted(pipelineId, stage);
      return { ok: true };
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Unknown stage failure';
      await this.orchestrator.handleStageFailed(pipelineId, stage, message);
      throw error;
    }
  }

  private async runStageSimulation(job: Job<StageWorkerPayload>, stage: PipelineStageName) {
    const messages: Record<PipelineStageName, string[]> = {
      INGEST: [
        'Scanning dataset manifest',
        'Reading source files',
        'Chunking source records',
        'Normalizing ingestion payload',
      ],
      CLEAN: [
        'Profiling missing values',
        'Applying cleaning rules',
        'Standardizing schema',
        'Persisting cleaned artifacts',
      ],
      ANALYZE: [
        'Building feature matrix',
        'Running research analysis',
        'Generating summary statistics',
        'Preparing interpretability outputs',
      ],
      REPORT: [
        'Rendering charts',
        'Compiling report artifacts',
        'Publishing downloadable outputs',
        'Finalizing report package',
      ],
    };

    const steps = messages[stage];
    for (let index = 0; index < steps.length; index += 1) {
      const progress = Math.round(((index + 1) / steps.length) * 100);
      await new Promise((resolve) => setTimeout(resolve, 700));
      await job.updateProgress(progress);
      await this.orchestrator.handleStageProgress(
        job.data.pipelineId,
        stage,
        progress,
        steps[index],
      );
    }
  }
}
