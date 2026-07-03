import { Router } from 'express';
import { communicationService } from './communication.service';

export const communicationRouter = Router();

function requireAdmin(req: any, res: any, next: any) {
  // Replace with your JWT/RBAC middleware.
  // Example: if (!req.user?.roles?.includes('ADMIN')) return res.status(403).send('Forbidden')
  next();
}

communicationRouter.use(requireAdmin);

communicationRouter.get('/users', async (req, res) => {
  try {
    res.json(await communicationService.listUsers(String(req.query.q ?? '')));
  } catch (err: any) {
    res.status(500).send(err.message);
  }
});

communicationRouter.get('/rooms', async (_req, res) => {
  try {
    res.json(await communicationService.listRooms());
  } catch (err: any) {
    res.status(500).send(err.message);
  }
});

communicationRouter.get('/stats', async (_req, res) => {
  try {
    res.json(await communicationService.stats());
  } catch (err: any) {
    res.status(500).send(err.message);
  }
});

communicationRouter.post('/audio/start', async (req, res) => {
  try {
    const { userId, contactMethod } = req.body;
    res.json(await communicationService.startAudio(userId, contactMethod));
  } catch (err: any) {
    res.status(400).send(err.message);
  }
});

communicationRouter.post('/video/invite', async (req, res) => {
  try {
    const { userId, topic } = req.body;
    res.json(await communicationService.inviteVideo(userId, topic));
  } catch (err: any) {
    res.status(400).send(err.message);
  }
});

communicationRouter.post('/messages/email', async (req, res) => {
  try {
    const { userId, subject, body } = req.body;
    res.json(await communicationService.sendEmailMessage(userId, subject, body));
  } catch (err: any) {
    res.status(400).send(err.message);
  }
});

communicationRouter.post('/rooms/:roomId/end', async (req, res) => {
  try {
    res.json(await communicationService.endRoom(req.params.roomId));
  } catch (err: any) {
    res.status(400).send(err.message);
  }
});
