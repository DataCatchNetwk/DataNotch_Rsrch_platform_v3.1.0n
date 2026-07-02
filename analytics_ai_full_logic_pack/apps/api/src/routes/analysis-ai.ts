import { Router } from 'express';
import { AnalysisAIService } from '../modules/analysis-ai/analysis-ai.service';

const router = Router();
const service = new AnalysisAIService();

router.get('/overview', async (req, res) => {
  res.json(await service.overview(String(req.query.workspaceId ?? 'demo-workspace')));
});

router.get('/modules', async (_req, res) => {
  res.json(service.modules());
});

router.post('/recommend', async (req, res) => {
  res.json(await service.recommend(req.body));
});

router.post('/run', async (req, res) => {
  res.json(await service.run(req.body));
});

router.get('/jobs/:jobId', async (req, res) => {
  res.json(await service.getJob(req.params.jobId));
});

router.get('/jobs/:jobId/results', async (req, res) => {
  res.json(await service.getResults(req.params.jobId));
});

router.post('/jobs/:jobId/handoff', async (req, res) => {
  res.json(await service.handoff(req.params.jobId, req.body.target));
});

export default router;
