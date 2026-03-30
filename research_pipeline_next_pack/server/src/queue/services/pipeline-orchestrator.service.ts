import { Injectable } from '@nestjs/common';
import { Queue } from 'bullmq';
import { RedisService } from '../../redis/redis.service';
import { PIPELINE_EVENTS, PIPELINE_QUEUES, STAGE_ORDER, type PipelineStageName } from '../constants/pipeline.constants';
import { PipelineStateService } from './pipeline-state.service';
import { PipelineEventBusService } from './pipeline-event-bus.service';
import { PipelineSocketService } from './pipeline-socket.service';
import type { CreatePipelineInput, PipelinePriority, StageWorkerPayload } from '../types/pipeline.types';

@Injectable()
export class PipelineOrchestratorService {
  private readonly queues: Record<string, Queue>;

  constructor(
    private readonly redisService: RedisService,
    private readonly pipelineState: PipelineStateService,
    private readonly eventBus: PipelineEventBusService,
    private readonly socketService: PipelineSocketService,
  ) {
    const connection = this.redisService.getClient();
    this.queues = {
      [PIPELINE_QUEUES.INGEST]: new Queue(PIPELINE_QUEUES.INGEST, { connection }),
      [PIPELINE_QUEUES.CLEAN]: new Queue(PIPELINE_QUEUES.CLEAN, { connection }),
      [PIPELINE_QUEUES.ANALYZE]: new Queue(PIPELINE_QUEUES.ANALYZE, { connection }),
      [PIPELINE_QUEUES.REPORT]: new Queue(PIPELINE_QUEUES.REPORT, { connection }),
      [PIPELINE_QUEUES.DLQ]: new Queue(PIPELINE_QUEUES.DLQ, { connection }),
    };
  }

  private mapPriority(priority: PipelinePriority) {
    switch (priority) {
      case 'URGENT':
        return 1;
      case 'HIGH':
        return 2;
      case 'NORMAL':
        return 3;
      case 'LOW':
      default:
        return 4;
    }
  }

  async createPipeline(input: CreatePipelineInput) {
    const pipeline = this.pipelineState.createPipeline(input);
    const createdEvent = this.pipelineState.addLog(
      pipeline.id,
      PIPELINE_EVENTS.PIPELINE_CREATED,
      `Pipeline ${pipeline.name} queued for orchestration.`,
    );
    await this.eventBus.publish(createdEvent);
    await this.queueStage(pipeline.id, 'INGEST');
    return this.pipelineState.getPipeline(pipeline.id);
  }

  async queueStage(pipelineId: string, stage: PipelineStageName) {
    const pipeline = this.pipelineState.getPipeline(pipelineId);
    const stateStage = pipeline.stages.find((s) => s.name === stage);
    if (!stateStage) return;

    this.pipelineState.markStageQueued(pipelineId, stage);
    const queuedEvent = this.pipelineState.addLog(
      pipelineId,
      PIPELINE_EVENTS.STAGE_QUEUED,
      `${stage} stage queued.`,
      stage,
    );
    await this.eventBus.publish(queuedEvent);

    const payload: StageWorkerPayload = {
      pipelineId,
      stage,
      datasetId: pipeline.datasetId,
      metadata: pipeline.metadata,
    };

    await this.queues[stateStage.queueName].add(
      `stage:${stage.toLowerCase()}`,
      payload,
      {
        attempts: 3,
        removeOnComplete: 100,
        removeOnFail: 100,
        priority: this.mapPriority(pipeline.priority),
        backoff: { type: 'exponential', delay: 2000 },
      },
    );

    const snapshot = this.pipelineState.getPipeline(pipelineId);
    this.socketService.emitPipelineSnapshot(snapshot);
    this.socketService.emitGlobalMetrics(this.pipelineState.getMetrics());
  }

  async handleStageStarted(pipelineId: string, stage: PipelineStageName) {
    this.pipelineState.markStageStarted(pipelineId, stage);
    const event = this.pipelineState.addLog(
      pipelineId,
      PIPELINE_EVENTS.STAGE_STARTED,
      `${stage} stage started.`,
      stage,
    );
    await this.eventBus.publish(event);
    this.emitState(pipelineId);
  }

  async handleStageProgress(pipelineId: string, stage: PipelineStageName, progress: number, message?: string) {
    this.pipelineState.setStageProgress(pipelineId, stage, progress);
    const event = this.pipelineState.addLog(
      pipelineId,
      PIPELINE_EVENTS.STAGE_PROGRESS,
      message ?? `${stage} progress ${progress}%`,
      stage,
      { progress },
    );
    await this.eventBus.publish(event);
    this.emitState(pipelineId);
  }

  async handleStageCompleted(pipelineId: string, stage: PipelineStageName) {
    this.pipelineState.markStageCompleted(pipelineId, stage);
    const event = this.pipelineState.addLog(
      pipelineId,
      PIPELINE_EVENTS.STAGE_COMPLETED,
      `${stage} stage completed.`,
      stage,
    );
    await this.eventBus.publish(event);

    const pipeline = this.pipelineState.getPipeline(pipelineId);
    if (pipeline.status === 'COMPLETED') {
      const pipelineEvent = this.pipelineState.addLog(
        pipelineId,
        PIPELINE_EVENTS.PIPELINE_COMPLETED,
        `Pipeline ${pipeline.name} completed successfully.`,
      );
      await this.eventBus.publish(pipelineEvent);
      this.emitState(pipelineId);
      return;
    }

    const currentIndex = STAGE_ORDER.findIndex((s) => s === stage);
    const next = STAGE_ORDER[currentIndex + 1];
    if (next) {
      await this.queueStage(pipelineId, next);
    } else {
      this.emitState(pipelineId);
    }
  }

  async handleStageFailed(pipelineId: string, stage: PipelineStageName, error: string) {
    this.pipelineState.markStageFailed(pipelineId, stage, error);
    const failedEvent = this.pipelineState.addLog(
      pipelineId,
      PIPELINE_EVENTS.STAGE_FAILED,
      `${stage} stage failed: ${error}`,
      stage,
      { error },
    );
    await this.eventBus.publish(failedEvent);

    const pipelineEvent = this.pipelineState.addLog(
      pipelineId,
      PIPELINE_EVENTS.PIPELINE_FAILED,
      `Pipeline failed at ${stage}.`,
      stage,
      { error },
    );
    await this.eventBus.publish(pipelineEvent);

    const pipeline = this.pipelineState.getPipeline(pipelineId);
    await this.queues[PIPELINE_QUEUES.DLQ].add(
      'pipeline:failed',
      { pipelineId, stage, error },
      { removeOnComplete: 100, removeOnFail: 100 },
    );

    this.socketService.emitPipelineSnapshot(pipeline);
    this.socketService.emitGlobalMetrics(this.pipelineState.getMetrics());
  }

  async retryFromStage(pipelineId: string, stage: PipelineStageName) {
    this.pipelineState.resetForRetry(pipelineId, stage);
    const event = this.pipelineState.addLog(
      pipelineId,
      PIPELINE_EVENTS.RETRY_REQUESTED,
      `Retry requested from ${stage}.`,
      stage,
    );
    await this.eventBus.publish(event);
    await this.queueStage(pipelineId, stage);
  }

  getMetrics() {
    return this.pipelineState.getMetrics();
  }

  listPipelines() {
    return this.pipelineState.listPipelines();
  }

  getPipeline(id: string) {
    return this.pipelineState.getPipeline(id);
  }

  private emitState(pipelineId: string) {
    const snapshot = this.pipelineState.getPipeline(pipelineId);
    this.socketService.emitPipelineSnapshot(snapshot);
    this.socketService.emitGlobalMetrics(this.pipelineState.getMetrics());
  }
}
