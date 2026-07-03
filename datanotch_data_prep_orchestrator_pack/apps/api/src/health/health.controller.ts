import express from 'express';
import { prisma } from '../database/prisma';
import { preparationQueue } from '../workers/preparation.worker';
export const healthRouter = express.Router();

healthRouter.get('/deep', async (_req, res) => {
  const db = await prisma.$queryRaw`select 1 as ok`.then(() => true).catch(() => false);
  const counts = await preparationQueue.getJobCounts('waiting','active','completed','failed').catch(() => null);
  const queueOk = Boolean(counts);
  res.json({
    api: true,
    postgres: db,
    workerQueue: queueOk,
    queueCounts: counts,
    checks: ['api','postgres','workerQueue','uploadEndpoint','downloadEndpoint','workspaceDatasetVisibility','preparationWorkflow'],
  });
});
