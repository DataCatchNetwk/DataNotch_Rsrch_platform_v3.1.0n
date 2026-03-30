import { Injectable, NotFoundException } from '@nestjs/common';
import { randomUUID } from 'crypto';
import { PIPELINE_QUEUES, STAGE_ORDER, type PipelineStageName } from '../constants/pipeline.constants';
import type {
  CreatePipelineInput,
  PipelineLogEvent,
  PipelineMetrics,
  PipelineStageState,
  PipelineState,
  PipelineStatus,
} from '../types/pipeline.types';

@Injectable()
export class PipelineStateService {
  private readonly pipelines = new Map<string, PipelineState>();

  createPipeline(input: CreatePipelineInput): PipelineState {
    const now = new Date().toISOString();

    const queueMap: Record<PipelineStageName, string> = {
      INGEST: PIPELINE_QUEUES.INGEST,
      CLEAN: PIPELINE_QUEUES.CLEAN,
      ANALYZE: PIPELINE_QUEUES.ANALYZE,
      REPORT: PIPELINE_QUEUES.REPORT,
    };

    const dependencyMap: Record<PipelineStageName, PipelineStageName[]> = {
      INGEST: [],
      CLEAN: ['INGEST'],
      ANALYZE: ['CLEAN'],
      REPORT: ['ANALYZE'],
    };

    const stages: PipelineStageState[] = STAGE_ORDER.map((name) => ({
      name,
      status: name === 'INGEST' ? 'QUEUED' : 'WAITING',
      progress: 0,
      attempts: 0,
      queueName: queueMap[name],
      dependencies: dependencyMap[name],
    }));

    const pipeline: PipelineState = {
      id: randomUUID(),
      name: input.name,
      datasetId: input.datasetId,
      priority: input.priority ?? 'NORMAL',
      status: 'QUEUED',
      createdAt: now,
      updatedAt: now,
      currentStage: 'INGEST',
      stages,
      logs: [],
      metadata: input.metadata ?? {},
    };

    this.pipelines.set(pipeline.id, pipeline);
    this.addLog(pipeline.id, 'pipeline.created', `Pipeline ${pipeline.name} created.`);
    return this.getPipeline(pipeline.id);
  }

  listPipelines(): PipelineState[] {
    return [...this.pipelines.values()].sort((a, b) => b.createdAt.localeCompare(a.createdAt));
  }

  getPipeline(id: string): PipelineState {
    const pipeline = this.pipelines.get(id);
    if (!pipeline) throw new NotFoundException(`Pipeline ${id} not found`);
    return JSON.parse(JSON.stringify(pipeline));
  }

  getMetrics(): PipelineMetrics {
    const all = this.listPipelines();
    return {
      total: all.length,
      queued: all.filter((p) => p.status === 'QUEUED').length,
      running: all.filter((p) => p.status === 'RUNNING').length,
      completed: all.filter((p) => p.status === 'COMPLETED').length,
      failed: all.filter((p) => p.status === 'FAILED').length,
      byPriority: {
        LOW: all.filter((p) => p.priority === 'LOW').length,
        NORMAL: all.filter((p) => p.priority === 'NORMAL').length,
        HIGH: all.filter((p) => p.priority === 'HIGH').length,
        URGENT: all.filter((p) => p.priority === 'URGENT').length,
      },
    };
  }

  updatePipelineStatus(id: string, status: PipelineStatus, currentStage?: PipelineStageName) {
    const pipeline = this.pipelines.get(id);
    if (!pipeline) throw new NotFoundException(`Pipeline ${id} not found`);
    pipeline.status = status;
    pipeline.currentStage = currentStage ?? pipeline.currentStage;
    pipeline.updatedAt = new Date().toISOString();
  }

  markStageQueued(id: string, stage: PipelineStageName) {
    const pipeline = this.pipelines.get(id);
    if (!pipeline) throw new NotFoundException(`Pipeline ${id} not found`);
    const target = pipeline.stages.find((s) => s.name === stage)!;
    target.status = 'QUEUED';
    target.error = null;
    pipeline.currentStage = stage;
    pipeline.updatedAt = new Date().toISOString();
  }

  markStageStarted(id: string, stage: PipelineStageName) {
    const pipeline = this.pipelines.get(id);
    if (!pipeline) throw new NotFoundException(`Pipeline ${id} not found`);
    const target = pipeline.stages.find((s) => s.name === stage)!;
    target.status = 'RUNNING';
    target.startedAt = new Date().toISOString();
    target.attempts += 1;
    pipeline.status = 'RUNNING';
    pipeline.currentStage = stage;
    pipeline.updatedAt = new Date().toISOString();
  }

  setStageProgress(id: string, stage: PipelineStageName, progress: number) {
    const pipeline = this.pipelines.get(id);
    if (!pipeline) throw new NotFoundException(`Pipeline ${id} not found`);
    const target = pipeline.stages.find((s) => s.name === stage)!;
    target.progress = Math.max(0, Math.min(100, progress));
    pipeline.updatedAt = new Date().toISOString();
  }

  markStageCompleted(id: string, stage: PipelineStageName) {
    const pipeline = this.pipelines.get(id);
    if (!pipeline) throw new NotFoundException(`Pipeline ${id} not found`);
    const index = pipeline.stages.findIndex((s) => s.name === stage);
    const target = pipeline.stages[index];
    target.status = 'COMPLETED';
    target.completedAt = new Date().toISOString();
    target.progress = 100;
    pipeline.updatedAt = new Date().toISOString();

    const next = pipeline.stages[index + 1];
    if (next) {
      next.status = 'QUEUED';
      pipeline.currentStage = next.name;
      pipeline.status = 'RUNNING';
    } else {
      pipeline.status = 'COMPLETED';
      pipeline.currentStage = undefined;
    }
  }

  markStageFailed(id: string, stage: PipelineStageName, error: string) {
    const pipeline = this.pipelines.get(id);
    if (!pipeline) throw new NotFoundException(`Pipeline ${id} not found`);
    const target = pipeline.stages.find((s) => s.name === stage)!;
    target.status = 'FAILED';
    target.error = error;
    target.completedAt = new Date().toISOString();
    pipeline.status = 'FAILED';
    pipeline.currentStage = stage;
    pipeline.updatedAt = new Date().toISOString();
  }

  addLog(
    pipelineId: string,
    type: string,
    message: string,
    stage?: PipelineStageName,
    payload?: Record<string, unknown>,
  ): PipelineLogEvent {
    const pipeline = this.pipelines.get(pipelineId);
    if (!pipeline) throw new NotFoundException(`Pipeline ${pipelineId} not found`);

    const log: PipelineLogEvent = {
      id: randomUUID(),
      pipelineId,
      type,
      stage,
      message,
      timestamp: new Date().toISOString(),
      payload,
    };

    pipeline.logs.unshift(log);
    pipeline.updatedAt = new Date().toISOString();
    return log;
  }

  resetForRetry(id: string, stage: PipelineStageName) {
    const pipeline = this.pipelines.get(id);
    if (!pipeline) throw new NotFoundException(`Pipeline ${id} not found`);

    let reset = false;
    for (const s of pipeline.stages) {
      if (s.name === stage) reset = true;
      if (reset) {
        s.status = s.name === stage ? 'QUEUED' : 'WAITING';
        s.progress = 0;
        s.error = null;
        s.startedAt = undefined;
        s.completedAt = undefined;
      }
    }

    pipeline.status = 'QUEUED';
    pipeline.currentStage = stage;
    pipeline.updatedAt = new Date().toISOString();
  }
}
