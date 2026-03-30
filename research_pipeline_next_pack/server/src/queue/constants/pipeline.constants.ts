export const PIPELINE_QUEUES = {
  ORCHESTRATOR: 'pipeline:orchestrator',
  INGEST: 'pipeline:ingest',
  CLEAN: 'pipeline:clean',
  ANALYZE: 'pipeline:analyze',
  REPORT: 'pipeline:report',
  DLQ: 'pipeline:dlq',
} as const;

export const PIPELINE_STREAMS = {
  EVENTS: 'pipeline:events',
} as const;

export const PIPELINE_EVENTS = {
  PIPELINE_CREATED: 'pipeline.created',
  STAGE_QUEUED: 'stage.queued',
  STAGE_STARTED: 'stage.started',
  STAGE_PROGRESS: 'stage.progress',
  STAGE_COMPLETED: 'stage.completed',
  STAGE_FAILED: 'stage.failed',
  PIPELINE_COMPLETED: 'pipeline.completed',
  PIPELINE_FAILED: 'pipeline.failed',
  RETRY_REQUESTED: 'pipeline.retry.requested',
} as const;

export const STAGE_ORDER = ['INGEST', 'CLEAN', 'ANALYZE', 'REPORT'] as const;
export type PipelineStageName = typeof STAGE_ORDER[number];
