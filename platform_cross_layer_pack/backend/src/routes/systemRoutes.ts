import { Router } from 'express';
export const systemRouter = Router();

systemRouter.get('/jobs', (_req, res) => res.json([
  { id: 'job_1', type: 'ZIP_EXTRACTION', status: 'SUCCEEDED', stage: 'WORKSPACE_INTAKE' },
  { id: 'job_2', type: 'DATA_PROFILING', status: 'RUNNING', stage: 'DATA_PREPARATION' },
  { id: 'job_3', type: 'PUBLICATION_EXPORT', status: 'QUEUED', stage: 'OUTPUTS' },
]));

systemRouter.get('/notifications', (_req, res) => res.json([
  { id: 'n1', title: 'Dataset ready for profiling', severity: 'info' },
  { id: 'n2', title: 'Approval required for publication pack', severity: 'warning' },
]));
