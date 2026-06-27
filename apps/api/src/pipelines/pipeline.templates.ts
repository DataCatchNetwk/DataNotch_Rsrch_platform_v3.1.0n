import { WORKER_TYPES } from './queue.constants.js';

export const DEFAULT_RESEARCH_PIPELINE = {
  code: 'research_default_v1',
  name: 'Default Research Pipeline',
  description: 'Automated end-to-end research automation template.',
  definitionJson: {
    steps: [
      { order: 1, name: 'Ingest Dataset', type: 'INGEST', workerType: WORKER_TYPES.INGEST },
      { order: 2, name: 'Profile Dataset', type: 'PROFILE', workerType: WORKER_TYPES.PROFILE },
      { order: 3, name: 'Validate Dataset', type: 'VALIDATE', workerType: WORKER_TYPES.VALIDATE },
      { order: 4, name: 'Clean Dataset', type: 'CLEAN', workerType: WORKER_TYPES.CLEAN },
      { order: 5, name: 'Transform Dataset', type: 'TRANSFORM', workerType: WORKER_TYPES.TRANSFORM },
      { order: 6, name: 'Generate Features', type: 'FEATURE_ENGINEERING', workerType: WORKER_TYPES.FEATURE },
      { order: 7, name: 'Train Model', type: 'TRAIN', workerType: WORKER_TYPES.TRAIN },
      { order: 8, name: 'Evaluate Model', type: 'EVALUATE', workerType: WORKER_TYPES.EVALUATE },
      { order: 9, name: 'Generate Charts', type: 'CHART', workerType: WORKER_TYPES.CHART },
      { order: 10, name: 'Generate Report', type: 'REPORT', workerType: WORKER_TYPES.REPORT },
      { order: 11, name: 'Export Bundle', type: 'EXPORT', workerType: WORKER_TYPES.EXPORT },
      { order: 12, name: 'Publish Artifacts', type: 'PUBLISH', workerType: WORKER_TYPES.PUBLISH },
    ],
  },
} as const;