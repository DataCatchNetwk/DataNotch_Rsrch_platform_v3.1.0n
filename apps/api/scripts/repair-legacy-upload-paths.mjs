import { PrismaClient } from '@prisma/client';
import fs from 'node:fs';
import path from 'node:path';

const prisma = new PrismaClient();

function parseArgs(argv) {
  const args = new Set(argv.slice(2));
  return {
    apply: args.has('--apply'),
    verbose: args.has('--verbose'),
  };
}

function normalizeSlashes(value) {
  return value.replace(/\\/g, '/');
}

function extractUploadedFileName(value) {
  if (!value || typeof value !== 'string') return null;

  try {
    const url = new URL(value);
    const parts = url.pathname.split('/').filter(Boolean);
    const uploadsIndex = parts.lastIndexOf('uploads');
    const fileName = uploadsIndex >= 0 ? parts[uploadsIndex + 1] : parts.at(-1);
    return fileName ? decodeURIComponent(fileName) : null;
  } catch {
    const normalized = normalizeSlashes(value);
    const parts = normalized.split('/').filter(Boolean);
    const uploadsIndex = parts.lastIndexOf('uploads');
    const fileName = uploadsIndex >= 0 ? parts[uploadsIndex + 1] : path.basename(value);
    return fileName ? decodeURIComponent(fileName) : null;
  }
}

function isLegacyReference(value, currentUploadDir) {
  if (!value || typeof value !== 'string') return false;

  const normalized = normalizeSlashes(value).toLowerCase();
  const normalizedCurrentDir = normalizeSlashes(currentUploadDir).toLowerCase();

  if (normalized.includes('/server/uploads/')) return true;
  if (normalized.includes('localhost:4000/uploads/')) return true;
  if (normalized.includes('/uploads/') && !normalized.startsWith(normalizedCurrentDir)) {
    return true;
  }

  return false;
}

function createPublicUrl(publicBaseUrl, fileName) {
  return `${publicBaseUrl}/${encodeURIComponent(fileName)}`;
}

async function run() {
  const { apply, verbose } = parseArgs(process.argv);

  const currentUploadDir = path.resolve(process.cwd(), 'uploads');
  const publicServerUrl = (process.env.SERVER_PUBLIC_URL ?? 'http://localhost:3001').replace(/\/+$/, '');
  const publicUploadsBaseUrl = `${publicServerUrl}/uploads`;

  const [datasets, fileAssets] = await Promise.all([
    prisma.dataset.findMany({
      where: { storagePath: { not: null } },
      select: { id: true, name: true, storagePath: true },
    }),
    prisma.fileAsset.findMany({
      select: { id: true, originalName: true, storagePath: true, publicUrl: true },
    }),
  ]);

  const datasetUpdates = [];
  for (const dataset of datasets) {
    const currentPath = dataset.storagePath;
    if (!currentPath || !isLegacyReference(currentPath, currentUploadDir)) continue;

    const fileName = extractUploadedFileName(currentPath);
    if (!fileName) continue;

    const candidatePath = path.join(currentUploadDir, fileName);
    if (!fs.existsSync(candidatePath)) continue;

    const nextStoragePath = createPublicUrl(publicUploadsBaseUrl, fileName);
    if (currentPath === nextStoragePath) continue;

    datasetUpdates.push({
      id: dataset.id,
      name: dataset.name,
      from: currentPath,
      to: nextStoragePath,
      fileName,
    });
  }

  const fileAssetUpdates = [];
  for (const asset of fileAssets) {
    const fileName = extractUploadedFileName(asset.publicUrl) || extractUploadedFileName(asset.storagePath);
    if (!fileName) continue;

    const candidatePath = path.join(currentUploadDir, fileName);
    if (!fs.existsSync(candidatePath)) continue;

    const nextStoragePath = candidatePath;
    const nextPublicUrl = createPublicUrl(publicUploadsBaseUrl, fileName);

    const shouldUpdateStoragePath = isLegacyReference(asset.storagePath, currentUploadDir) && asset.storagePath !== nextStoragePath;
    const shouldUpdatePublicUrl = Boolean(asset.publicUrl) && isLegacyReference(asset.publicUrl, currentUploadDir) && asset.publicUrl !== nextPublicUrl;

    if (!shouldUpdateStoragePath && !shouldUpdatePublicUrl) continue;

    fileAssetUpdates.push({
      id: asset.id,
      originalName: asset.originalName,
      fromStoragePath: asset.storagePath,
      toStoragePath: shouldUpdateStoragePath ? nextStoragePath : asset.storagePath,
      fromPublicUrl: asset.publicUrl,
      toPublicUrl: shouldUpdatePublicUrl ? nextPublicUrl : asset.publicUrl,
    });
  }

  console.log(`Current upload root: ${currentUploadDir}`);
  console.log(`Public uploads base: ${publicUploadsBaseUrl}`);
  console.log(`Dataset candidates: ${datasetUpdates.length}`);
  console.log(`FileAsset candidates: ${fileAssetUpdates.length}`);

  if (verbose) {
    for (const update of datasetUpdates) {
      console.log(`DATASET ${update.id} (${update.name})`);
      console.log(`  from: ${update.from}`);
      console.log(`  to:   ${update.to}`);
    }

    for (const update of fileAssetUpdates) {
      console.log(`FILE_ASSET ${update.id} (${update.originalName})`);
      if (update.fromStoragePath !== update.toStoragePath) {
        console.log(`  storagePath from: ${update.fromStoragePath}`);
        console.log(`  storagePath to:   ${update.toStoragePath}`);
      }
      if (update.fromPublicUrl !== update.toPublicUrl) {
        console.log(`  publicUrl from: ${update.fromPublicUrl}`);
        console.log(`  publicUrl to:   ${update.toPublicUrl}`);
      }
    }
  }

  if (!apply) {
    console.log('Dry run only. Re-run with --apply to persist changes.');
    return;
  }

  for (const update of datasetUpdates) {
    await prisma.dataset.update({
      where: { id: update.id },
      data: { storagePath: update.to },
    });
  }

  for (const update of fileAssetUpdates) {
    await prisma.fileAsset.update({
      where: { id: update.id },
      data: {
        storagePath: update.toStoragePath,
        publicUrl: update.toPublicUrl,
      },
    });
  }

  console.log(`Applied dataset updates: ${datasetUpdates.length}`);
  console.log(`Applied fileAsset updates: ${fileAssetUpdates.length}`);
}

run()
  .catch((error) => {
    console.error(error instanceof Error ? error.message : String(error));
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
