import type { Request, Response } from 'express';
import { prisma } from '../db/prisma.js';
import { HttpError } from '../utils/errors.js';
import { authenticateStreamRequest } from '../pipelines/stream-auth.js';
import { PipelinesService } from '../pipelines/service.js';

const service = new PipelinesService(prisma);

function requireUser(req: Request) {
  if (!req.user) {
    throw new HttpError(401, 'Authentication required');
  }

  return { id: req.user.id, email: req.user.email };
}

export async function createPipelineRunRecord(req: Request, res: Response) {
  const run = await service.createWorkspaceRun(requireUser(req), req.body);
  res.status(201).json({ run });
}

export async function listWorkspacePipelineRuns(req: Request, res: Response) {
  const runs = await service.listWorkspaceRuns(requireUser(req), req.params.workspaceId);
  res.json({ runs });
}

export async function getPipelineRunRecord(req: Request, res: Response) {
  const run = await service.getRun(requireUser(req), req.params.runId);
  res.json({ run });
}

export async function cancelPipelineRunRecord(req: Request, res: Response) {
  const result = await service.cancelRun(requireUser(req), req.params.runId, req.body?.reason);
  res.json(result);
}

export async function resumePipelineRunRecord(req: Request, res: Response) {
  const run = await service.resumeRun(requireUser(req), req.params.runId, req.body?.reason);
  res.json({ run });
}

export async function retryPipelineRunFromFailedStageRecord(req: Request, res: Response) {
  const run = await service.retryFromFailedStage(requireUser(req), req.params.runId, {
    reason: req.body?.reason,
    stepOrder: req.body?.stepOrder,
  });
  res.json({ run });
}

export async function retryPipelineRunFromStageRecord(req: Request, res: Response) {
  const run = await service.retryFromStage(requireUser(req), req.params.runId, {
    reason: req.body?.reason,
    stepOrder: req.body?.stepOrder,
  });
  res.json({ run });
}

export async function listPipelineMonitoringRuns(req: Request, res: Response) {
  const limit = req.query.limit ? Number(req.query.limit) : undefined;
  const runs = await service.listMonitoringRuns(requireUser(req), Number.isFinite(limit) ? limit : undefined);
  res.json({ runs });
}

export async function getPipelineMonitoringMetrics(req: Request, res: Response) {
  const metrics = await service.getMonitoringMetrics(requireUser(req));
  res.json({ metrics });
}

export async function getPipelineAutoscalingRecommendation(req: Request, res: Response) {
  const recommendation = await service.getAutoscalingRecommendation(requireUser(req));
  res.json({ recommendation });
}

export async function tailPipelineRunLiveLog(req: Request, res: Response) {
  const count = req.query.count ? Number(req.query.count) : 80;
  const events = await service.tailLiveLog(requireUser(req), req.params.runId, Number.isFinite(count) ? count : 80);
  res.json({ events });
}

export async function streamPipelineRunEvents(req: Request, res: Response) {
  const user = authenticateStreamRequest(req);
  await service.getRun({ id: user.id, email: user.email }, req.params.runId);

  res.setHeader('Content-Type', 'text/event-stream');
  res.setHeader('Cache-Control', 'no-cache, no-transform');
  res.setHeader('Connection', 'keep-alive');
  res.flushHeaders?.();

  let active = true;
  const sendPayload = async () => {
    if (!active) {
      return;
    }

    const run = await service.getRun({ id: user.id, email: user.email }, req.params.runId);
    res.write(`event: pipeline\n`);
    res.write(`data: ${JSON.stringify(run)}\n\n`);
  };

  await sendPayload();
  const interval = setInterval(() => {
    void sendPayload();
  }, 1500);

  req.on('close', () => {
    active = false;
    clearInterval(interval);
    res.end();
  });
}