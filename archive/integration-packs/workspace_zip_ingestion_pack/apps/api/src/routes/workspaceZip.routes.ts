import express from 'express';
import multer from 'multer';
import os from 'os';
import path from 'path';
import {
  getWorkspaceFileTree,
  ingestWorkspaceZip,
  listWorkspaceDatasets,
  registerWorkspaceFileAsDataset,
  sendDatasetToPreparation,
} from '../modules/workspace-zip/workspaceZip.service';

const router = express.Router();
const upload = multer({ dest: path.join(os.tmpdir(), 'workspace-zip-uploads') });

router.post('/workspaces/:workspaceId/uploads/zip', upload.single('file'), async (req, res) => {
  try {
    if (!req.file) return res.status(400).json({ error: 'ZIP file is required.' });
    const result = await ingestWorkspaceZip({
      workspaceId: req.params.workspaceId,
      uploadedById: (req as any).user?.id,
      filePath: req.file.path,
      originalName: req.file.originalname,
    });
    res.json(result);
  } catch (error: any) {
    res.status(400).json({ error: error.message });
  }
});

router.get('/workspaces/:workspaceId/files', async (req, res) => {
  try {
    res.json(await getWorkspaceFileTree(req.params.workspaceId));
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

router.post('/workspaces/:workspaceId/files/:fileId/register-dataset', async (req, res) => {
  try {
    res.json(await registerWorkspaceFileAsDataset({ workspaceId: req.params.workspaceId, fileId: req.params.fileId }));
  } catch (error: any) {
    res.status(400).json({ error: error.message });
  }
});

router.post('/workspaces/:workspaceId/files/:fileId/send-to-preparation', async (req, res) => {
  try {
    res.json(await sendDatasetToPreparation({
      workspaceId: req.params.workspaceId,
      fileId: req.params.fileId,
      stage: req.body?.stage,
    }));
  } catch (error: any) {
    res.status(400).json({ error: error.message });
  }
});

router.get('/dataset-registry/from-workspace/:workspaceId', async (req, res) => {
  try {
    res.json(await listWorkspaceDatasets(req.params.workspaceId));
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

export default router;
