import express from 'express';
import { z } from 'zod';
import { meetingService } from '../services/meeting.service';

export const meetingRouter = express.Router();

function actor(req: any) {
  return {
    id: req.header('x-user-id') || 'demo-admin',
    role: req.header('x-user-role') || 'ADMIN'
  } as any;
}

const createSchema = z.object({
  title: z.string().min(3),
  description: z.string().optional(),
  agenda: z.string().optional(),
  type: z.string().default('R_ZOOMA_VIDEO'),
  startsAt: z.string(),
  endsAt: z.string(),
  inviteeIds: z.array(z.string()).default([]),
  assetType: z.string().optional(),
  assetId: z.string().optional(),
  assetTitle: z.string().optional(),
  roomUrl: z.string().optional(),
  autoOpenWindow: z.boolean().optional()
});

meetingRouter.post('/', async (req, res) => {
  try { res.json(await meetingService.createMeeting(createSchema.parse(req.body), actor(req))); }
  catch (e: any) { res.status(400).json({ error: e.message }); }
});

meetingRouter.get('/', async (req, res) => res.json(await meetingService.listMeetings(actor(req))));

meetingRouter.post('/:id/invitations/:invitationId/respond', async (req, res) => {
  try { res.json(await meetingService.respond(req.params.id, req.params.invitationId, req.body.response, actor(req))); }
  catch (e: any) { res.status(403).json({ error: e.message }); }
});

meetingRouter.post('/:id/start', async (req, res) => {
  try { res.json(await meetingService.start(req.params.id, actor(req))); }
  catch (e: any) { res.status(403).json({ error: e.message }); }
});
meetingRouter.post('/:id/cancel', async (req, res) => {
  try { res.json(await meetingService.cancel(req.params.id, actor(req))); }
  catch (e: any) { res.status(403).json({ error: e.message }); }
});
meetingRouter.post('/:id/pause', async (req, res) => {
  try { res.json(await meetingService.pause(req.params.id, actor(req))); }
  catch (e: any) { res.status(403).json({ error: e.message }); }
});
meetingRouter.delete('/:id/logs/:logId', async (req, res) => {
  try { res.json(await meetingService.deleteLog(req.params.logId, actor(req))); }
  catch (e: any) { res.status(403).json({ error: e.message }); }
});
meetingRouter.get('/:id/calendar.ics', async (req, res) => {
  const body = await meetingService.ics(req.params.id);
  res.setHeader('Content-Type', 'text/calendar');
  res.setHeader('Content-Disposition', 'attachment; filename="rzooma-meeting.ics"');
  res.send(body);
});
