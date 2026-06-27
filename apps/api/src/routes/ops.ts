import { Router } from 'express';
import { Prisma } from '@prisma/client';
import { prisma } from '../db/prisma.js';
import { authenticate } from '../middleware/authenticate.js';
import { authorize } from '../middleware/authorize.js';
import { asyncHandler } from '../utils/async-handler.js';
import { HttpError } from '../utils/errors.js';
import { env } from '../config/env.js';
import { isRedisReachable } from '../workers/queue.factory.js';

const router = Router();

async function databaseHealth() {
  const started = Date.now();
  await prisma.$queryRaw`SELECT 1`;
  return { ok: true, latencyMs: Date.now() - started };
}

async function workerSummary() {
  const [queued, active, retrying, failed, completed, canceled] = await Promise.all([
    prisma.workerJob.count({ where: { status: 'QUEUED' } }),
    prisma.workerJob.count({ where: { status: 'ACTIVE' } }),
    prisma.workerJob.count({ where: { status: 'RETRYING' } }),
    prisma.workerJob.count({ where: { status: 'FAILED' } }),
    prisma.workerJob.count({ where: { status: 'COMPLETED' } }),
    prisma.workerJob.count({ where: { status: 'CANCELED' } }),
  ]);

  return { queued, active, retrying, failed, completed, canceled };
}

router.get('/health', asyncHandler(async (_req, res) => {
  let database = { ok: false, latencyMs: null as number | null, message: 'not checked' };
  try {
    const db = await databaseHealth();
    database = { ...db, message: 'PostgreSQL reachable' };
  } catch (error) {
    database = { ok: false, latencyMs: null, message: error instanceof Error ? error.message : 'PostgreSQL unavailable' };
  }

  const redisReachable = await isRedisReachable();
  const workers = await workerSummary().catch(() => ({ queued: 0, active: 0, retrying: 0, failed: 0, completed: 0, canceled: 0 }));
  const status = database.ok ? 'ready' : 'degraded';

  res.json({
    status,
    generatedAt: new Date().toISOString(),
    version: process.env.npm_package_version ?? '1.0.0',
    environment: env.NODE_ENV,
    checks: {
      database,
      queue: {
        backend: env.QUEUE_BACKEND,
        redisReachable,
        mode: redisReachable ? 'redis-bullmq' : 'postgres-local',
      },
      workers,
    },
    requestId: res.locals.requestId,
  });
}));

router.use('/admin', authenticate, authorize('ADMIN', 'SUPER_ADMIN'));

router.get('/admin/summary', asyncHandler(async (_req, res) => {
  const [users, workspaces, datasets, pipelineRuns, communicationRooms, workerStats, redisReachable] = await Promise.all([
    prisma.user.count(),
    prisma.researchWorkspace.count().catch(() => 0),
    prisma.dataset.count().catch(() => 0),
    prisma.pipelineRun.count().catch(() => 0),
    prisma.communicationRoom.count().catch(() => 0),
    workerSummary(),
    isRedisReachable(),
  ]);

  res.json({
    generatedAt: new Date().toISOString(),
    system: {
      environment: env.NODE_ENV,
      queueBackend: env.QUEUE_BACKEND,
      redisReachable,
      authNetworkBlockEnabled: env.AUTH_NETWORK_BLOCK_ENABLED,
      authNetworkFailClosed: env.AUTH_NETWORK_FAIL_CLOSED,
    },
    totals: { users, workspaces, datasets, pipelineRuns, communicationRooms },
    workers: workerStats,
    recommendations: [
      workerStats.failed > 0 ? 'Review failed worker jobs and retry safe failures.' : 'Worker queue has no failed jobs.',
      redisReachable ? 'Redis/BullMQ backend is online.' : 'PostgreSQL local worker mode is active.',
      env.NODE_ENV === 'production' ? 'Production mode is active.' : 'Use production environment variables before public deployment.',
    ],
    requestId: res.locals.requestId,
  });
}));

router.get('/admin/worker-jobs', asyncHandler(async (req, res) => {
  const status = typeof req.query.status === 'string' ? req.query.status : undefined;
  const take = Math.max(1, Math.min(100, Number(req.query.take ?? 50)));
  const jobs = await prisma.workerJob.findMany({
    where: status ? { status: status as never } : undefined,
    orderBy: { updatedAt: 'desc' },
    take,
    select: {
      id: true,
      pipelineRunId: true,
      pipelineStepId: true,
      queueName: true,
      jobName: true,
      workerType: true,
      status: true,
      attempt: true,
      progressPercent: true,
      startedAt: true,
      completedAt: true,
      updatedAt: true,
      errorJson: true,
    },
  });
  res.json({ items: jobs, requestId: res.locals.requestId });
}));

router.post('/admin/worker-jobs/:jobId/retry', asyncHandler(async (req, res) => {
  const job = await prisma.workerJob.findUnique({ where: { id: req.params.jobId } });
  if (!job) throw new HttpError(404, 'Worker job not found');
  if (!['FAILED', 'CANCELED'].includes(job.status)) {
    throw new HttpError(400, 'Only failed or canceled jobs can be retried');
  }

  const updated = await prisma.workerJob.update({
    where: { id: job.id },
    data: {
      status: 'QUEUED',
      completedAt: null,
      startedAt: null,
      progressPercent: 0,
      errorJson: Prisma.JsonNull,
      attempt: job.attempt + 1,
    },
  });

  res.json({ job: updated, requestId: res.locals.requestId });
}));

router.post('/admin/worker-jobs/:jobId/cancel', asyncHandler(async (req, res) => {
  const job = await prisma.workerJob.findUnique({ where: { id: req.params.jobId } });
  if (!job) throw new HttpError(404, 'Worker job not found');
  if (!['QUEUED', 'ACTIVE', 'RETRYING'].includes(job.status)) {
    throw new HttpError(400, 'Only queued, active, or retrying jobs can be canceled');
  }

  const updated = await prisma.workerJob.update({
    where: { id: job.id },
    data: { status: 'CANCELED', completedAt: new Date() },
  });

  res.json({ job: updated, requestId: res.locals.requestId });
}));

export default router;