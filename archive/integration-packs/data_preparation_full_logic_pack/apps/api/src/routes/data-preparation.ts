import { Router } from 'express';
import { DataPreparationService } from '../modules/data-preparation/data-preparation.service';

const router = Router();
const service = new DataPreparationService();

router.get('/overview', (_req, res) => res.json(service.overview()));
router.get('/stage/:stage', (req, res) => res.json(service.stage(req.params.stage as any)));

router.post('/profiling/run', (req, res) => res.json(service.runProfiling(req.body?.datasetId)));
router.post('/cleaning/run', (req, res) => res.json(service.runCleaning(req.body?.datasetId)));
router.post('/harmonization/run', (req, res) => res.json(service.runHarmonization(req.body?.datasetId)));
router.post('/features/run', (req, res) => res.json(service.runFeatures(req.body?.datasetId)));
router.post('/quality/run', (req, res) => res.json(service.runQuality(req.body?.datasetId)));
router.post('/versioning/create', (req, res) => res.json(service.createVersion(req.body?.datasetId, req.body?.notes)));
router.post('/handoff/research-studio', (req, res) => res.json(service.handoffToResearchStudio(req.body?.datasetId || 'demo-raw')));

export default router;
