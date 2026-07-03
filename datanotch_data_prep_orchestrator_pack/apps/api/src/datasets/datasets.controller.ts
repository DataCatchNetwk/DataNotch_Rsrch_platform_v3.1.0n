import express from 'express';
import multer from 'multer';
import { prisma } from '../database/prisma';
import { saveDatasetFile, readAssetFile, assetExists } from '../storage/storage.service';
import { enqueuePreparation } from '../workers/preparation.worker';

const upload = multer({ storage: multer.memoryStorage(), limits: { fileSize: 100 * 1024 * 1024 }});
export const datasetsRouter = express.Router();

datasetsRouter.post('/upload', upload.single('file'), async (req, res) => {
  try {
    if (!req.file) return res.status(400).json({ error: 'file is required' });
    const { workspaceId, name } = req.body;
    const dataset = await prisma.dataset.create({ data: { name: name || req.file.originalname, sourceType: 'UPLOAD', status: 'QUEUED', workspaceId }});
    const stored = await saveDatasetFile(dataset.id, req.file.originalname, req.file.buffer);
    await prisma.datasetAsset.create({ data: { datasetId: dataset.id, kind: 'RAW', filename: stored.filename, path: stored.path, checksum: stored.checksum, sizeBytes: stored.sizeBytes, mimeType: req.file.mimetype }});
    if (workspaceId) {
      await prisma.workspaceDataset.upsert({ where: { workspaceId_datasetId: { workspaceId, datasetId: dataset.id } as any }, create: { workspaceId, datasetId: dataset.id }, update: { visible: true }});
    }
    await prisma.preparationWorkflow.create({ data: { datasetId: dataset.id, status: 'PENDING', currentStage: 'QUEUED' }});
    await enqueuePreparation(dataset.id);
    res.status(201).json({ datasetId: dataset.id, status: 'QUEUED', message: 'Dataset uploaded and preparation queued' });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

datasetsRouter.post('/warehouse-query', async (req, res) => {
  try {
    const { workspaceId, name, csvPreview } = req.body;
    if (!csvPreview) return res.status(400).json({ error: 'csvPreview is required for this starter pack. Replace this with your real warehouse adapter.' });
    const dataset = await prisma.dataset.create({ data: { name: name || 'Warehouse Dataset', sourceType: 'WAREHOUSE_QUERY', status: 'QUEUED', workspaceId }});
    const stored = await saveDatasetFile(dataset.id, `${dataset.name}.csv`, Buffer.from(csvPreview));
    await prisma.datasetAsset.create({ data: { datasetId: dataset.id, kind: 'RAW', filename: stored.filename, path: stored.path, checksum: stored.checksum, sizeBytes: stored.sizeBytes, mimeType: 'text/csv' }});
    if (workspaceId) await prisma.workspaceDataset.create({ data: { workspaceId, datasetId: dataset.id }});
    await prisma.preparationWorkflow.create({ data: { datasetId: dataset.id, status: 'PENDING', currentStage: 'QUEUED' }});
    await enqueuePreparation(dataset.id);
    res.status(201).json({ datasetId: dataset.id, status: 'QUEUED' });
  } catch (err: any) { res.status(500).json({ error: err.message }); }
});

datasetsRouter.get('/', async (_req, res) => {
  const datasets = await prisma.dataset.findMany({ orderBy: { createdAt: 'desc' }, include: { assets: true, workflows: { include: { stages: true }}}});
  res.json(datasets);
});

datasetsRouter.get('/:id', async (req, res) => {
  const dataset = await prisma.dataset.findUnique({ where: { id: req.params.id }, include: { assets: true, workflows: { include: { stages: true }}}});
  if (!dataset) return res.status(404).json({ error: 'dataset not found' });
  res.json(dataset);
});

datasetsRouter.post('/:id/run-preparation', async (req, res) => {
  const dataset = await prisma.dataset.findUnique({ where: { id: req.params.id }});
  if (!dataset) return res.status(404).json({ error: 'dataset not found' });
  await prisma.preparationWorkflow.create({ data: { datasetId: dataset.id, status: 'PENDING', currentStage: 'QUEUED' }});
  await enqueuePreparation(dataset.id);
  res.json({ datasetId: dataset.id, status: 'QUEUED' });
});

datasetsRouter.get('/:id/download', async (req, res) => {
  const kind = String(req.query.kind || 'CLEANED');
  const asset = await prisma.datasetAsset.findFirst({ where: { datasetId: req.params.id, kind }, orderBy: { createdAt: 'desc' }});
  if (!asset) return res.status(404).json({ error: `asset ${kind} not found` });
  if (!(await assetExists(asset.path))) return res.status(404).json({ error: 'stored file missing; registry/storage out of sync' });
  const file = await readAssetFile(asset.path);
  res.setHeader('Content-Type', asset.mimeType || 'application/octet-stream');
  res.setHeader('Content-Disposition', `attachment; filename="${asset.filename}"`);
  res.send(file);
});
