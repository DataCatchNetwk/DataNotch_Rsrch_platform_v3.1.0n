import type { PipelineStageName } from '../constants/pipeline.constants';

export type PipelinePriority = 'LOW' | 'NORMAL' | 'HIGH' | 'URGENT';

export type PipelineStatus =
  | 'QUEUED'
  | 'RUNNING'
  | 'COMPLETED'
  | 'FAILED'
  | 'PARTIAL'
  | 'CANCELLED';

export type PipelineStageStatus =
  | 'WAITING'
  | 'QUEUED'
  | 'RUNNING'
  | 'COMPLETED'
  | 'FAILED'
  | 'SKIPPED';

export interface PipelineStageState {
  name: PipelineStageName;
  status: PipelineStageStatus;
  progress: number;
  attempts: number;
  startedAt?: string;
  completedAt?: string;
  error?: string | null;
  queueName: string;
  dependencies: PipelineStageName[];
}

export interface PipelineState {
  id: string;
  name: string;
  datasetId: string;
  priority: PipelinePriority;
  status: PipelineStatus;
  currentStage?: PipelineStageName;
  createdAt: string;
  updatedAt: string;
  stages: PipelineStageState[];
  logs: PipelineLogEvent[];
  metadata?: Record<string, unknown>;
}

export interface PipelineLogEvent {
  id: string;
  pipelineId: string;
  type: string;
  stage?: PipelineStageName;
  message: string;
  timestamp: string;
  payload?: Record<string, unknown>;
}

export interface CreatePipelineInput {
  name: string;
  datasetId: string;
  priority?: PipelinePriority;
  metadata?: Record<string, unknown>;
}

export interface StageWorkerPayload {
  pipelineId: string;
  stage: PipelineStageName;
  datasetId: string;
  metadata?: Record<string, unknown>;
}

export interface PipelineMetrics {
  total: number;
  queued: number;
  running: number;
  completed: number;
  failed: number;
  byPriority: Record<PipelinePriority, number>;
}
