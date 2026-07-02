import crypto from 'crypto';
import fs from 'fs';
import path from 'path';
import AdmZip from 'adm-zip';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

const DATASET_EXTENSIONS = new Set(['.csv', '.tsv', '.xlsx', '.xls', '.json', '.jsonl', '.parquet']);
const MAX_FILES = 2000;
const MAX_TOTAL_BYTES = 500 * 1024 * 1024; // 500 MB safety cap

function sha256(filePath: string): string {
  const hash = crypto.createHash('sha256');
  hash.update(fs.readFileSync(filePath));
  return hash.digest('hex');
}

function safeResolve(root: string, target: string): string {
  const resolved = path.resolve(root, target);
  if (!resolved.startsWith(path.resolve(root))) {
    throw new Error(`Unsafe ZIP path detected: ${target}`);
  }
  return resolved;
}

function ensureDir(dir: string) {
  fs.mkdirSync(dir, { recursive: true });
}

export async function ingestWorkspaceZip(params: {
  workspaceId: string;
  uploadedById?: string;
  filePath: string;
  originalName: string;
  storageRoot?: string;
}) {
  const storageRoot = params.storageRoot ?? process.env.WORKSPACE_STORAGE_ROOT ?? './storage/workspaces';
  const workspaceRoot = path.resolve(storageRoot, params.workspaceId);
  const archiveDir = path.join(workspaceRoot, 'archives');
  const extractRoot = path.join(workspaceRoot, 'files', path.parse(params.originalName).name);
  ensureDir(archiveDir);
  ensureDir(extractRoot);

  const storedArchivePath = path.join(archiveDir, `${Date.now()}-${params.originalName}`);
  fs.copyFileSync(params.filePath, storedArchivePath);
  const archiveChecksum = sha256(storedArchivePath);

  const archive = await prisma.workspaceArchive.create({
    data: {
      workspaceId: params.workspaceId,
      uploadedById: params.uploadedById,
      archiveName: params.originalName,
      archivePath: storedArchivePath,
      checksumSha256: archiveChecksum,
      status: 'SCANNED',
    },
  });

  const zip = new AdmZip(storedArchivePath);
  const entries = zip.getEntries();
  if (entries.length > MAX_FILES) throw new Error(`ZIP exceeds ${MAX_FILES} entries.`);

  let totalBytes = 0;
  for (const entry of entries) totalBytes += entry.header.size;
  if (totalBytes > MAX_TOTAL_BYTES) throw new Error('ZIP exceeds maximum extracted size.');

  const folderMap = new Map<string, string>();
  let fileCount = 0;
  let datasetCandidates = 0;

  async function ensureFolder(relativeFolder: string): Promise<string | null> {
    if (!relativeFolder || relativeFolder === '.') return null;
    if (folderMap.has(relativeFolder)) return folderMap.get(relativeFolder)!;

    const parentFolder = path.dirname(relativeFolder);
    const parentId = parentFolder === '.' ? null : await ensureFolder(parentFolder);
    const folderName = path.basename(relativeFolder);
    const folderStoragePath = safeResolve(extractRoot, relativeFolder);
    ensureDir(folderStoragePath);

    const rec = await prisma.workspaceFile.create({
      data: {
        workspaceId: params.workspaceId,
        archiveId: archive.id,
        parentId,
        kind: 'FOLDER',
        name: folderName,
        relativePath: relativeFolder,
        storagePath: folderStoragePath,
        sizeBytes: 0,
      },
    });
    folderMap.set(relativeFolder, rec.id);
    return rec.id;
  }

  for (const entry of entries) {
    const relativePath = entry.entryName.replace(/\\/g, '/');
    const outputPath = safeResolve(extractRoot, relativePath);

    if (entry.isDirectory) {
      await ensureFolder(relativePath.replace(/\/$/, ''));
      continue;
    }

    ensureDir(path.dirname(outputPath));
    fs.writeFileSync(outputPath, entry.getData());
    const parentId = await ensureFolder(path.dirname(relativePath));
    const ext = path.extname(relativePath).toLowerCase();
    const isDatasetCandidate = DATASET_EXTENSIONS.has(ext);
    if (isDatasetCandidate) datasetCandidates += 1;

    await prisma.workspaceFile.create({
      data: {
        workspaceId: params.workspaceId,
        archiveId: archive.id,
        parentId,
        kind: 'FILE',
        name: path.basename(relativePath),
        relativePath,
        storagePath: outputPath,
        extension: ext,
        sizeBytes: BigInt(fs.statSync(outputPath).size),
        checksumSha256: sha256(outputPath),
        isDatasetCandidate,
        metadataJson: {
          extractedFrom: params.originalName,
          datasetCandidateReason: isDatasetCandidate ? 'Supported tabular/data extension' : null,
        },
      },
    });
    fileCount += 1;
  }

  await prisma.workspaceArchive.update({
    where: { id: archive.id },
    data: {
      status: 'EXTRACTED',
      fileCount,
      extractedBytes: BigInt(totalBytes),
      extractedAt: new Date(),
    },
  });

  return { archiveId: archive.id, status: 'EXTRACTED', extractedFiles: fileCount, datasetCandidates };
}

export async function getWorkspaceFileTree(workspaceId: string) {
  const files = await prisma.workspaceFile.findMany({
    where: { workspaceId },
    orderBy: [{ kind: 'asc' }, { relativePath: 'asc' }],
  });

  const byId = new Map<string, any>();
  const roots: any[] = [];
  for (const file of files) byId.set(file.id, { ...file, sizeBytes: Number(file.sizeBytes), children: [] });
  for (const file of byId.values()) {
    if (file.parentId && byId.has(file.parentId)) byId.get(file.parentId).children.push(file);
    else roots.push(file);
  }
  return roots;
}

export async function registerWorkspaceFileAsDataset(params: { workspaceId: string; fileId: string }) {
  const file = await prisma.workspaceFile.findUnique({ where: { id: params.fileId } });
  if (!file || file.workspaceId !== params.workspaceId) throw new Error('Workspace file not found.');
  if (!file.isDatasetCandidate) throw new Error('Selected file is not a dataset candidate.');

  const dataset = await prisma.datasetRegistryRecord.create({
    data: {
      workspaceId: params.workspaceId,
      sourceWorkspaceFileId: file.id,
      name: path.parse(file.name).name,
      description: `Raw dataset registered from workspace ZIP extraction: ${file.relativePath}`,
      stage: 'RAW',
      status: 'RAW_REGISTERED',
      storagePath: file.storagePath,
      lineageJson: {
        source: 'workspace_zip_upload',
        workspaceFileId: file.id,
        archiveId: file.archiveId,
        path: file.relativePath,
        flow: ['Workspace Upload', 'Workspace File Tree', 'Dataset Registry / Raw Dataset'],
      },
    },
  });

  await prisma.workspaceFile.update({ where: { id: file.id }, data: { datasetId: dataset.id } });
  return dataset;
}

export async function sendDatasetToPreparation(params: { workspaceId: string; fileId: string; stage?: string }) {
  const file = await prisma.workspaceFile.findUnique({ where: { id: params.fileId } });
  if (!file?.datasetId) {
    throw new Error('Register this file as a dataset before sending to preparation.');
  }

  return prisma.dataPreparationJob.create({
    data: {
      workspaceId: params.workspaceId,
      datasetId: file.datasetId,
      stage: params.stage ?? 'DATA_PROFILING',
      status: 'QUEUED',
    },
  });
}

export async function listWorkspaceDatasets(workspaceId: string) {
  return prisma.datasetRegistryRecord.findMany({
    where: { workspaceId },
    orderBy: { createdAt: 'desc' },
  });
}
