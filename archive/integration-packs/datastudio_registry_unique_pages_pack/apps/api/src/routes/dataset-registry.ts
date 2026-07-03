import { Router } from 'express';
import { datasetRegistryService } from '../modules/datasets/dataset-registry.service';

const router = Router();

router.get('/summary', (_req, res) => res.json(datasetRegistryService.summary()));
router.get('/raw', (_req, res) => res.json(datasetRegistryService.byStage('raw')));
router.get('/clean', (_req, res) => res.json(datasetRegistryService.byStage('clean')));
router.get('/harmonized', (_req, res) => res.json(datasetRegistryService.byStage('harmonized')));
router.get('/features', (_req, res) => res.json(datasetRegistryService.byStage('features')));
router.get('/lineage', (_req, res) => res.json(datasetRegistryService.lineage()));
router.get('/catalog', (_req, res) => res.json(datasetRegistryService.catalog()));

router.post('/:id/handoff', (req, res) => {
  res.json(datasetRegistryService.handoff(req.params.id, req.body.target ?? 'next-stage'));
});

router.post('/:id/profile', (req, res) => {
  res.json(datasetRegistryService.profile(req.params.id));
});

router.post('/:id/request-access', (req, res) => {
  res.json(datasetRegistryService.requestAccess(req.params.id));
});

export default router;
