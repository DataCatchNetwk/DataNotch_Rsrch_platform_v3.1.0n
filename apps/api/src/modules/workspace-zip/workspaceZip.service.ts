import crypto from "node:crypto";
import fs from "node:fs";
import path from "node:path";
import AdmZip from "adm-zip";
import { DatasetVisibility, Prisma } from "@prisma/client";
import { prisma } from "../../db/prisma.js";
import type { WorkspaceFileNode, WorkspaceZipIngestResult } from "./workspaceZip.types.js";

const DATASET_EXTENSIONS = new Set([".csv", ".tsv", ".xlsx", ".xls", ".json", ".jsonl", ".parquet"]);
const MAX_FILES = 2000;
const MAX_TOTAL_BYTES = 500 * 1024 * 1024;

function toSha256(filePath: string): string {
  const hash = crypto.createHash("sha256");
  hash.update(fs.readFileSync(filePath));
  return hash.digest("hex");
}

function safeResolve(root: string, target: string): string {
  const resolved = path.resolve(root, target);
  const normalizedRoot = path.resolve(root);
  if (!resolved.startsWith(normalizedRoot)) {
    throw new Error(`Unsafe ZIP path detected: ${target}`);
  }
  return resolved;
}

function ensureDir(dirPath: string) {
  fs.mkdirSync(dirPath, { recursive: true });
}

function normalizeRelativePath(value: string): string {
  return value.replace(/\\/g, "/").replace(/^\//, "");
}

export async function ingestWorkspaceZip(params: {
  workspaceId: string;
  uploadedById?: string;
  filePath: string;
  originalName: string;
  storageRoot?: string;
}): Promise<WorkspaceZipIngestResult> {
  const workspace = await prisma.workspace.findUnique({
    where: { id: params.workspaceId },
    select: { id: true },
  });
  if (!workspace) {
    throw new Error("Workspace not found");
  }

  const storageRoot = params.storageRoot ?? process.env.WORKSPACE_STORAGE_ROOT ?? "./storage/workspaces";
  const workspaceRoot = path.resolve(storageRoot, params.workspaceId);
  const archiveDir = path.join(workspaceRoot, "archives");
  const extractRoot = path.join(workspaceRoot, "files", path.parse(params.originalName).name);

  ensureDir(archiveDir);
  ensureDir(extractRoot);

  const storedArchivePath = path.join(archiveDir, `${Date.now()}-${params.originalName}`);
  fs.copyFileSync(params.filePath, storedArchivePath);

  const archive = await prisma.workspaceArchive.create({
    data: {
      workspaceId: params.workspaceId,
      uploadedById: params.uploadedById ?? null,
      archiveName: params.originalName,
      archivePath: storedArchivePath,
      checksumSha256: toSha256(storedArchivePath),
      status: "SCANNED",
    },
  });

  const zip = new AdmZip(storedArchivePath);
  const entries = zip.getEntries();

  if (entries.length > MAX_FILES) {
    throw new Error(`ZIP exceeds ${MAX_FILES} entries.`);
  }

  const totalBytes = entries.reduce((sum, entry) => sum + entry.header.size, 0);
  if (totalBytes > MAX_TOTAL_BYTES) {
    throw new Error("ZIP exceeds maximum extracted size.");
  }

  const folderMap = new Map<string, string>();
  let fileCount = 0;
  let datasetCandidates = 0;

  async function ensureFolder(relativeFolder: string): Promise<string | null> {
    const normalized = normalizeRelativePath(relativeFolder).replace(/\/$/, "");
    if (!normalized || normalized === ".") return null;
    if (folderMap.has(normalized)) return folderMap.get(normalized)!;

    const parentPath = path.dirname(normalized);
    const parentId = parentPath === "." ? null : await ensureFolder(parentPath);
    const folderStoragePath = safeResolve(extractRoot, normalized);
    ensureDir(folderStoragePath);

    const folder = await prisma.workspaceFile.upsert({
      where: {
        workspaceId_relativePath: {
          workspaceId: params.workspaceId,
          relativePath: normalized,
        },
      },
      update: {
        archiveId: archive.id,
        parentId,
        kind: "FOLDER",
        name: path.basename(normalized),
        storagePath: folderStoragePath,
      },
      create: {
        workspaceId: params.workspaceId,
        archiveId: archive.id,
        parentId,
        kind: "FOLDER",
        name: path.basename(normalized),
        relativePath: normalized,
        storagePath: folderStoragePath,
        sizeBytes: BigInt(0),
      },
    });

    folderMap.set(normalized, folder.id);
    return folder.id;
  }

  for (const entry of entries) {
    const relativePath = normalizeRelativePath(entry.entryName);
    if (!relativePath) continue;

    if (entry.isDirectory) {
      await ensureFolder(relativePath);
      continue;
    }

    const outputPath = safeResolve(extractRoot, relativePath);
    ensureDir(path.dirname(outputPath));
    fs.writeFileSync(outputPath, entry.getData());

    const parentId = await ensureFolder(path.dirname(relativePath));
    const extension = path.extname(relativePath).toLowerCase();
    const isDatasetCandidate = DATASET_EXTENSIONS.has(extension);

    await prisma.workspaceFile.upsert({
      where: {
        workspaceId_relativePath: {
          workspaceId: params.workspaceId,
          relativePath,
        },
      },
      update: {
        archiveId: archive.id,
        parentId,
        kind: "FILE",
        name: path.basename(relativePath),
        storagePath: outputPath,
        extension,
        sizeBytes: BigInt(fs.statSync(outputPath).size),
        checksumSha256: toSha256(outputPath),
        isDatasetCandidate,
        metadataJson: {
          extractedFrom: params.originalName,
          datasetCandidateReason: isDatasetCandidate ? "Supported data extension" : null,
        } as Prisma.InputJsonValue,
      },
      create: {
        workspaceId: params.workspaceId,
        archiveId: archive.id,
        parentId,
        kind: "FILE",
        name: path.basename(relativePath),
        relativePath,
        storagePath: outputPath,
        extension,
        sizeBytes: BigInt(fs.statSync(outputPath).size),
        checksumSha256: toSha256(outputPath),
        isDatasetCandidate,
        metadataJson: {
          extractedFrom: params.originalName,
          datasetCandidateReason: isDatasetCandidate ? "Supported data extension" : null,
        } as Prisma.InputJsonValue,
      },
    });

    fileCount += 1;
    if (isDatasetCandidate) datasetCandidates += 1;
  }

  await prisma.workspaceArchive.update({
    where: { id: archive.id },
    data: {
      status: "EXTRACTED",
      fileCount,
      extractedBytes: BigInt(totalBytes),
      extractedAt: new Date(),
    },
  });

  return {
    archiveId: archive.id,
    status: "EXTRACTED",
    extractedFiles: fileCount,
    datasetCandidates,
  };
}

export async function getWorkspaceFileTree(workspaceId: string): Promise<WorkspaceFileNode[]> {
  const files = await prisma.workspaceFile.findMany({
    where: { workspaceId },
    orderBy: [{ kind: "asc" }, { relativePath: "asc" }],
  });

  const byId = new Map<string, WorkspaceFileNode>();
  const roots: WorkspaceFileNode[] = [];

  for (const file of files) {
    byId.set(file.id, {
      id: file.id,
      workspaceId: file.workspaceId,
      archiveId: file.archiveId,
      parentId: file.parentId,
      kind: file.kind,
      name: file.name,
      relativePath: file.relativePath,
      storagePath: file.storagePath,
      extension: file.extension,
      sizeBytes: Number(file.sizeBytes),
      isDatasetCandidate: file.isDatasetCandidate,
      datasetId: file.datasetId,
      createdAt: file.createdAt.toISOString(),
      children: [],
    });
  }

  for (const node of byId.values()) {
    if (node.parentId && byId.has(node.parentId)) {
      byId.get(node.parentId)!.children.push(node);
    } else {
      roots.push(node);
    }
  }

  return roots;
}

export async function registerWorkspaceFileAsDataset(params: {
  workspaceId: string;
  fileId: string;
  actorId?: string;
}) {
  const file = await prisma.workspaceFile.findUnique({ where: { id: params.fileId } });
  if (!file || file.workspaceId !== params.workspaceId) {
    throw new Error("Workspace file not found.");
  }
  if (!file.isDatasetCandidate) {
    throw new Error("Selected file is not a dataset candidate.");
  }

  const workspace = await prisma.workspace.findUnique({
    where: { id: params.workspaceId },
    select: { id: true, ownerId: true },
  });
  if (!workspace) {
    throw new Error("Workspace not found.");
  }

  const createdById = params.actorId ?? workspace.ownerId;

  const dataset = await prisma.dataset.create({
    data: {
      workspaceId: workspace.id,
      createdById,
      name: path.parse(file.name).name,
      description: `Registered from workspace ZIP extraction: ${file.relativePath}`,
      visibility: DatasetVisibility.WORKSPACE,
      storagePath: file.storagePath,
      mimeType: file.extension ?? null,
      sizeBytes: file.sizeBytes,
      recordCount: 0,
      tags: ["workspace-zip", "raw"],
      metadataJson: {
        source: "workspace_zip_upload",
        workspaceFileId: file.id,
        archiveId: file.archiveId,
        relativePath: file.relativePath,
      } as Prisma.InputJsonValue,
    },
  });

  const registryRecord = await prisma.datasetRegistryRecord.create({
    data: {
      workspaceId: params.workspaceId,
      sourceWorkspaceFileId: file.id,
      registeredDatasetId: dataset.id,
      name: dataset.name,
      description: dataset.description,
      stage: "RAW",
      status: "RAW_REGISTERED",
      version: `v${dataset.version}.0`,
      records: dataset.recordCount ?? 0,
      variables: dataset.columnCount ?? 0,
      storagePath: dataset.storagePath,
      lineageJson: {
        source: "workspace_zip_upload",
        workspaceFileId: file.id,
        archiveId: file.archiveId,
        flow: ["Workspace Upload", "Workspace File Tree", "Dataset Registry", "Data Preparation"],
      } as Prisma.InputJsonValue,
    },
  });

  await prisma.workspaceFile.update({
    where: { id: file.id },
    data: { datasetId: dataset.id },
  });

  return {
    dataset,
    registryRecord,
  };
}

export async function sendDatasetToPreparation(params: {
  workspaceId: string;
  fileId: string;
  stage?: string;
}) {
  const file = await prisma.workspaceFile.findUnique({ where: { id: params.fileId } });
  if (!file || file.workspaceId !== params.workspaceId || !file.datasetId) {
    throw new Error("Register this file as a dataset before sending to preparation.");
  }

  const dataset = await prisma.dataset.findUnique({ where: { id: file.datasetId } });
  if (!dataset) {
    throw new Error("Registered dataset not found.");
  }

  const workflow = await prisma.dataPreparationWorkflow.create({
    data: {
      sourceConnectionId: `workspace:${params.workspaceId}`,
      datasetName: dataset.name,
      queryId: null,
      sqlText: `FILE://${file.relativePath}`,
      currentStage: "profiling",
      nextStage: "cleaning",
      status: "registered-for-profiling",
      lastMessage: `Handoff created from workspace ZIP file ${file.name}`,
    },
  });

  await prisma.dataPreparationStageRun.create({
    data: {
      workflowId: workflow.id,
      stage: params.stage ?? "profiling",
      status: "ready",
      changedRows: 0,
      changedColumns: 0,
    },
  });

  return {
    workflowId: workflow.id,
    datasetId: dataset.id,
    next: "/dashboard/data-preparation/profiling",
    currentStage: workflow.currentStage,
    nextStage: workflow.nextStage,
    status: workflow.status,
  };
}

export async function listWorkspaceDatasets(workspaceId: string) {
  return prisma.datasetRegistryRecord.findMany({
    where: { workspaceId },
    orderBy: { createdAt: "desc" },
  });
}
