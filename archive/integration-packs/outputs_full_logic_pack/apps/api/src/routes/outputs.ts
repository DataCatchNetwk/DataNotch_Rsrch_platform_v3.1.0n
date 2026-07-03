import { Router } from 'express';
import { outputsService } from '../modules/outputs/outputs.service';

export const outputsRouter = Router();

outputsRouter.get('/', (req, res) => {
  res.json({ data: outputsService.list(req.query.workspaceId as string | undefined) });
});

outputsRouter.post('/', (req, res) => {
  res.status(201).json({ data: outputsService.create(req.body) });
});

outputsRouter.post('/generate-all', (req, res) => {
  const { workspaceId, analysisJobId } = req.body;
  res.status(201).json({ data: outputsService.generateAll(workspaceId, analysisJobId) });
});

outputsRouter.post('/:id/export', (req, res) => {
  try {
    res.json({ data: outputsService.export(req.params.id, req.body.format || 'PDF') });
  } catch (e: any) {
    res.status(404).json({ error: e.message });
  }
});
