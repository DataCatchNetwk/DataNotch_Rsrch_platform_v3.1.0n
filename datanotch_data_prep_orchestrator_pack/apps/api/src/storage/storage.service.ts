import fs from 'node:fs/promises';
import path from 'node:path';
import crypto from 'node:crypto';

const ROOT = process.env.DATASET_STORAGE_ROOT || path.join(process.cwd(), 'storage', 'datasets');

export async function ensureStorageRoot() {
  await fs.mkdir(ROOT, { recursive: true });
}

export async function saveDatasetFile(datasetId: string, filename: string, buffer: Buffer) {
  await ensureStorageRoot();
  const dir = path.join(ROOT, datasetId);
  await fs.mkdir(dir, { recursive: true });
  const safeName = filename.replace(/[^a-zA-Z0-9._-]/g, '_');
  const filePath = path.join(dir, safeName);
  await fs.writeFile(filePath, buffer);
  const checksum = crypto.createHash('sha256').update(buffer).digest('hex');
  return { path: filePath, checksum, sizeBytes: buffer.length, filename: safeName };
}

export async function readAssetFile(filePath: string) {
  return fs.readFile(filePath);
}

export async function assetExists(filePath: string) {
  try { await fs.access(filePath); return true; } catch { return false; }
}
