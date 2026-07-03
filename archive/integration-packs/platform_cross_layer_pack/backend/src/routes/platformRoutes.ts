import { Router } from 'express';
import { platformService } from '../services/platformService';

export const platformRouter = Router();

platformRouter.get('/overview', async (_req, res) => {
  res.json(await platformService.overview());
});

platformRouter.get('/stages/:stage', async (req, res) => {
  res.json(await platformService.stage(req.params.stage));
});

platformRouter.post('/handoff', async (req, res) => {
  res.json(await platformService.handoff(req.body));
});
