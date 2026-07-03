import { Router } from 'express';
import { DataPreparationService, PrepStage } from '../modules/data-preparation/data-preparation.service';

const router = Router();
const service = new DataPreparationService();

router.get('/stages/:stage', (req, res) => {
  res.json(service.stage(req.params.stage as PrepStage, String(req.query.datasetId || 'sdoh-demo')));
});

router.post('/stages/:stage/run', (req, res) => {
  res.json(service.runStage(req.params.stage as PrepStage, req.body.datasetId || 'sdoh-demo'));
});

router.get('/stages/:stage/preview', (req, res) => {
  res.json(service.preview(req.params.stage as PrepStage, String(req.query.datasetId || 'sdoh-demo')));
});

router.post('/stages/:stage/save-version', (req, res) => {
  res.json(service.saveVersion(req.params.stage as PrepStage, req.body.datasetId || 'sdoh-demo'));
});

router.post('/handoff/database-studio', (req, res) => {
  res.json(service.handoffFromDatabaseStudio(req.body));
});

export default router;
