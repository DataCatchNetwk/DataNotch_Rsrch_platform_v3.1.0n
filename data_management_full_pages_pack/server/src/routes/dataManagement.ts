import { Router } from 'express';
import { DataManagementService } from '../modules/data-management/data-management.service';

const router = Router();
const service = new DataManagementService();

router.get('/summary', (_req, res) => res.json(service.getSummary()));
router.get('/files', (_req, res) => res.json(service.getFiles()));
router.get('/sources', (_req, res) => res.json(service.getSources()));
router.get('/datasets', (req, res) => res.json(service.getDatasets(req.query.stage as string | undefined)));
router.get('/lineage', (_req, res) => res.json(service.getLineage()));
router.get('/catalog', (_req, res) => res.json(service.getCatalog()));

router.post('/files/:fileId/register-dataset', (req, res) => {
  try { res.json(service.registerFileAsDataset(req.params.fileId)); }
  catch (error: any) { res.status(404).json({ error: error.message }); }
});

router.post('/datasets/:datasetId/send-to-preparation', (req, res) => {
  try { res.json(service.sendDatasetToPreparation(req.params.datasetId)); }
  catch (error: any) { res.status(404).json({ error: error.message }); }
});

router.post('/workspace-handoff', (req, res) => res.json(service.workspaceHandoff(req.body)));

export default router;
