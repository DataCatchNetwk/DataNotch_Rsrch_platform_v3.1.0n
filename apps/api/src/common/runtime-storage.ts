import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';

const isVercelRuntime = Boolean(process.env.VERCEL);

function runtimePath(...segments: string[]) {
  const baseDir = isVercelRuntime ? os.tmpdir() : process.cwd();
  return path.join(baseDir, ...segments);
}

function resolveConfiguredDirectory(value: string | undefined, ...fallbackSegments: string[]) {
  if (!value) return runtimePath(...fallbackSegments);
  if (path.isAbsolute(value)) return value;
  return isVercelRuntime ? runtimePath(value) : path.resolve(process.cwd(), value);
}

export function ensureDirectory(dirPath: string) {
  fs.mkdirSync(dirPath, { recursive: true });
  return dirPath;
}

export const uploadDir = ensureDirectory(resolveConfiguredDirectory(process.env.UPLOAD_DIR, 'uploads'));

export const workspaceStorageRoot = ensureDirectory(
  resolveConfiguredDirectory(process.env.WORKSPACE_STORAGE_ROOT, 'storage', 'workspaces'),
);

export const sdohExportDir = ensureDirectory(
  resolveConfiguredDirectory(process.env.SDOH_EXPORT_DIR, 'storage', 'sdoh-exports'),
);

export function resolveUploadPath(...segments: string[]) {
  return path.join(uploadDir, ...segments);
}
