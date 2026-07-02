import { Router } from 'express';
import { datasetRegistryService, type DatasetRegistryStage } from '../modules/datasets/dataset-registry.service.js';
import { asyncHandler } from '../utils/async-handler.js';

const router = Router();

const stages = new Set<DatasetRegistryStage>(['raw', 'clean', 'harmonized', 'features']);

router.get(
  '/summary',
  asyncHandler(async (_req, res) => {
    res.json(await datasetRegistryService.summary());
  }),
);

router.get(
  '/catalog',
  asyncHandler(async (_req, res) => {
    res.json({ items: await datasetRegistryService.catalog() });
  }),
);

router.get(
  '/lineage',
  asyncHandler(async (_req, res) => {
    res.json(await datasetRegistryService.lineage());
  }),
);

router.get(
  '/:stage',
  asyncHandler(async (req, res) => {
    const stage = req.params.stage as DatasetRegistryStage;

    if (!stages.has(stage)) {
      res.status(404).json({ message: `Unknown dataset registry stage: ${req.params.stage}` });
      return;
    }

    res.json({ items: await datasetRegistryService.byStage(stage) });
  }),
);

router.post(
  '/:id/profile',
  asyncHandler(async (req, res) => {
    res.json(await datasetRegistryService.profile(req.params.id));
  }),
);

router.post(
  '/:id/handoff',
  asyncHandler(async (req, res) => {
    res.json(await datasetRegistryService.handoff(req.params.id, String(req.body?.target ?? 'next-stage')));
  }),
);

router.post(
  '/:id/request-access',
  asyncHandler(async (req, res) => {
    res.json(await datasetRegistryService.requestAccess(req.params.id, req.body?.justification));
  }),
);

export default router;
