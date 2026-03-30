export const RESEARCH_QUEUES = {
  INGEST: 'research.ingest',
  TRANSFORM: 'research.transform',
  TRAIN: 'research.train',
  EVALUATE: 'research.evaluate',
  REPORT: 'research.report',
  EXPORT: 'research.export',
  PUBLISH: 'research.publish',
  DLQ: 'research.dlq',
} as const;

export const WORKER_TYPES = {
  INGEST: 'INGEST_WORKER',
  PROFILE: 'PROFILE_WORKER',
  VALIDATE: 'VALIDATE_WORKER',
  CLEAN: 'CLEAN_WORKER',
  TRANSFORM: 'TRANSFORM_WORKER',
  FEATURE: 'FEATURE_WORKER',
  TRAIN: 'TRAIN_WORKER',
  EVALUATE: 'EVALUATE_WORKER',
  CHART: 'CHART_WORKER',
  REPORT: 'REPORT_WORKER',
  EXPORT: 'EXPORT_WORKER',
  PUBLISH: 'PUBLISH_WORKER',
} as const;

export const PIPELINE_STREAMS = {
  EVENTS: 'pipeline:events',
} as const;