import { Router } from 'express';
import { z } from 'zod';
import { communicationService } from './communication.service';

export const communicationRouter = Router();

function sendError(res: any, error: unknown) {
  res.status(400).json({ error: error instanceof Error ? error.message : 'Request failed' });
}

communicationRouter.get('/metrics', (_req, res) => {
  res.json(communicationService.getMetrics());
});

communicationRouter.get('/rooms', (req, res) => {
  const mode = req.query.mode as any;
  res.json(communicationService.listRooms(mode));
});

communicationRouter.post('/rooms', (req, res) => {
  try {
    const input = z.object({
      name: z.string().min(2),
      mode: z.enum(['audio', 'video', 'messaging']),
      workspaceId: z.string().optional(),
    }).parse(req.body);
    res.json(communicationService.createRoom(input));
  } catch (error) {
    sendError(res, error);
  }
});

communicationRouter.get('/rooms/:roomId', (req, res) => {
  try {
    res.json(communicationService.getRoom(req.params.roomId));
  } catch (error) {
    sendError(res, error);
  }
});

communicationRouter.post('/rooms/:roomId/join', (req, res) => {
  try {
    const input = z.object({ displayName: z.string().default('Admin User') }).parse(req.body);
    res.json(communicationService.joinRoom(req.params.roomId, input.displayName));
  } catch (error) {
    sendError(res, error);
  }
});

communicationRouter.post('/rooms/:roomId/close', (req, res) => {
  try {
    res.json(communicationService.closeRoom(req.params.roomId));
  } catch (error) {
    sendError(res, error);
  }
});

communicationRouter.post('/rooms/:roomId/moderate', (req, res) => {
  try {
    const input = z.object({
      participantId: z.string(),
      action: z.enum(['MUTE', 'REMOVE', 'FLAG']),
    }).parse(req.body);
    res.json(communicationService.moderate(req.params.roomId, input.participantId, input.action));
  } catch (error) {
    sendError(res, error);
  }
});

communicationRouter.post('/messages', (req, res) => {
  try {
    const input = z.object({ roomId: z.string(), body: z.string().min(1) }).parse(req.body);
    res.json(communicationService.sendMessage(input.roomId, input.body));
  } catch (error) {
    sendError(res, error);
  }
});

communicationRouter.get('/activity', (_req, res) => {
  res.json(communicationService.listActivity());
});
