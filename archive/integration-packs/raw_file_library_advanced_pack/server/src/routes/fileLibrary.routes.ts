import { Router } from 'express';
import multer from 'multer';
import { listFileLibrary, saveUploadedFiles, extractZipArchive, registerDataset, sendToProfiling } from '../modules/file-library/fileLibrary.service';

export const fileLibraryRouter = Router();
const upload = multer({ storage: multer.memoryStorage(), limits: { fileSize: 1024 * 1024 * 500 } });

fileLibraryRouter.get('/', async (req, res, next) => {
  try { res.json(await listFileLibrary(String(req.query.workspaceId || 'default'))); } catch (e) { next(e); }
});

fileLibraryRouter.post('/upload', upload.array('files'), async (req, res, next) => {
  try { res.json({ assets: await saveUploadedFiles(String(req.body.workspaceId || 'default'), req.files as Express.Multer.File[]) }); } catch (e) { next(e); }
});

fileLibraryRouter.post('/:assetId/extract', async (req, res, next) => {
  try { res.json({ assets: await extractZipArchive(req.params.assetId) }); } catch (e) { next(e); }
});

fileLibraryRouter.post('/:assetId/register-dataset', async (req, res, next) => {
  try { res.json(await registerDataset(req.params.assetId)); } catch (e) { next(e); }
});

fileLibraryRouter.post('/:assetId/send-to-profiling', async (req, res, next) => {
  try { res.json(await sendToProfiling(req.params.assetId)); } catch (e) { next(e); }
});
