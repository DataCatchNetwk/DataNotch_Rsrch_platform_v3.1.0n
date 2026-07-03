import { Router } from 'express';
import { createEvent, deleteEvent, listEvents, respondToEvent, updateEventStatus } from '../services/scheduling.service';
const router = Router();

router.get('/events', async (req, res) => res.json(await listEvents(String(req.query.userId || ''), String(req.query.role || 'USER'))));
router.post('/events', async (req, res) => {
  const event = await createEvent(req.body);
  req.app.get('io').emit('rzooma.event.created', event);
  res.status(201).json(event);
});
router.post('/events/:id/respond', async (req, res) => {
  const result = await respondToEvent(req.params.id, req.body.userId, req.body.response);
  req.app.get('io').emit('rzooma.event.response', { eventId: req.params.id, ...result });
  res.json(result);
});
router.patch('/events/:id/status', async (req, res) => {
  const event = await updateEventStatus(req.params.id, req.body.status);
  req.app.get('io').emit('rzooma.event.status', event);
  res.json(event);
});
router.delete('/events/:id', async (req, res) => {
  await deleteEvent(req.params.id);
  req.app.get('io').emit('rzooma.event.deleted', { id: req.params.id });
  res.status(204).end();
});
export default router;
