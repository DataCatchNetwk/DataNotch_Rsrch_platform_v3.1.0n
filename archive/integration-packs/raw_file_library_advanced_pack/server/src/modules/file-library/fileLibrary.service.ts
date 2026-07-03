import crypto from 'crypto';
import fs from 'fs/promises';
import path from 'path';
import AdmZip from 'adm-zip';

export type RawFileAsset = {
  id: string;
  workspaceId: string;
  name: string;
  path: string;
  kind: 'file' | 'folder' | 'archive';
  mimeType?: string;
  sizeBytes: number;
  checksum?: string;
  status: 'uploaded' | 'indexed' | 'extracted' | 'registered' | 'failed';
  datasetCandidate: boolean;
  createdAt: string;
};

const STORAGE_ROOT = process.env.WORKSPACE_STORAGE_ROOT || path.join(process.cwd(), 'storage', 'workspaces');
const assets = new Map<string, RawFileAsset>();

function id() { return crypto.randomUUID(); }
function isDatasetCandidate(name: string) { return /\.(csv|xlsx|xls|json|parquet)$/i.test(name); }
function isArchive(name: string) { return /\.zip$/i.test(name); }
function checksum(buffer: Buffer) { return crypto.createHash('sha256').update(buffer).digest('hex'); }
function safeJoin(root: string, target: string) {
  const resolved = path.resolve(root, target);
  if (!resolved.startsWith(path.resolve(root))) throw new Error('Unsafe archive path detected');
  return resolved;
}

export async function listFileLibrary(workspaceId: string) {
  const workspaceAssets = [...assets.values()].filter(a => a.workspaceId === workspaceId);
  const today = new Date().toISOString().slice(0, 10);
  return {
    overview: {
      totalFiles: workspaceAssets.filter(a => a.kind !== 'folder').length,
      folders: workspaceAssets.filter(a => a.kind === 'folder').length,
      archives: workspaceAssets.filter(a => a.kind === 'archive').length,
      uploadedToday: workspaceAssets.filter(a => a.createdAt.startsWith(today)).length,
      datasetCandidates: workspaceAssets.filter(a => a.datasetCandidate).length,
      extractedAssets: workspaceAssets.filter(a => a.status === 'extracted' || a.path.includes('/extracted/')).length,
    },
    assets: workspaceAssets,
  };
}

export async function saveUploadedFiles(workspaceId: string, files: Express.Multer.File[]) {
  const root = path.join(STORAGE_ROOT, workspaceId, 'raw');
  await fs.mkdir(root, { recursive: true });
  const created: RawFileAsset[] = [];

  for (const file of files) {
    const assetId = id();
    const safeName = file.originalname.replace(/[^a-zA-Z0-9._-]/g, '_');
    const filePath = path.join(root, `${assetId}-${safeName}`);
    await fs.writeFile(filePath, file.buffer);
    const asset: RawFileAsset = {
      id: assetId,
      workspaceId,
      name: safeName,
      path: filePath,
      kind: isArchive(safeName) ? 'archive' : 'file',
      mimeType: file.mimetype,
      sizeBytes: file.size,
      checksum: checksum(file.buffer),
      status: 'indexed',
      datasetCandidate: isDatasetCandidate(safeName),
      createdAt: new Date().toISOString(),
    };
    assets.set(assetId, asset);
    created.push(asset);
  }
  return created;
}

export async function extractZipArchive(assetId: string) {
  const asset = assets.get(assetId);
  if (!asset || asset.kind !== 'archive') throw new Error('Archive not found');
  const extractRoot = path.join(STORAGE_ROOT, asset.workspaceId, 'extracted', asset.id);
  await fs.mkdir(extractRoot, { recursive: true });
  const zip = new AdmZip(asset.path);
  const created: RawFileAsset[] = [];

  for (const entry of zip.getEntries()) {
    const outputPath = safeJoin(extractRoot, entry.entryName);
    if (entry.isDirectory) {
      await fs.mkdir(outputPath, { recursive: true });
      const folder: RawFileAsset = { id: id(), workspaceId: asset.workspaceId, name: path.basename(entry.entryName), path: outputPath, kind: 'folder', sizeBytes: 0, status: 'extracted', datasetCandidate: false, createdAt: new Date().toISOString() };
      assets.set(folder.id, folder); created.push(folder);
    } else {
      await fs.mkdir(path.dirname(outputPath), { recursive: true });
      await fs.writeFile(outputPath, entry.getData());
      const extracted: RawFileAsset = { id: id(), workspaceId: asset.workspaceId, name: path.basename(entry.entryName), path: outputPath, kind: 'file', sizeBytes: entry.header.size, checksum: checksum(entry.getData()), status: 'extracted', datasetCandidate: isDatasetCandidate(entry.entryName), createdAt: new Date().toISOString() };
      assets.set(extracted.id, extracted); created.push(extracted);
    }
  }
  asset.status = 'extracted';
  assets.set(asset.id, asset);
  return created;
}

export async function registerDataset(assetId: string) {
  const asset = assets.get(assetId);
  if (!asset || !asset.datasetCandidate) throw new Error('Dataset candidate not found');
  asset.status = 'registered';
  assets.set(asset.id, asset);
  return {
    datasetId: crypto.randomUUID(),
    assetId,
    name: asset.name.replace(/\.(csv|xlsx|xls|json|parquet)$/i, ''),
    registryStage: 'raw',
    source: 'raw_file_library',
    next: '/dashboard/datasets?view=raw',
  };
}

export async function sendToProfiling(assetId: string) {
  const asset = assets.get(assetId);
  if (!asset) throw new Error('Asset not found');
  return { preparationJobId: crypto.randomUUID(), assetId, stage: 'profiling', next: '/dashboard/datasets?prep=profiling' };
}
