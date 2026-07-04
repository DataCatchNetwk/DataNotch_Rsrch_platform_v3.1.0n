import { prisma } from '../db/prisma.js';
import { Prisma } from '@prisma/client';
import { mkdir, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { env } from '../config/env.js';
import { HttpError } from '../utils/errors.js';
import { assertWorkspaceAction } from './workspace-access.service.js';
import { WorkspaceAction } from './workspace-permissions.js';
import { notifyWorkspaceMembers } from './notifications.service.js';
import { PipelinesService } from '../pipelines/service.js';
import { AutomationService } from './automation.service.js';
import { UniversalDataParser, type ParsedDataProfile } from './universal-data-parser.service.js';
import { DataPreparationEngine } from './data-preparation-engine.service.js';
import { ingestWorkspaceZip, registerWorkspaceFileAsDataset } from '../modules/workspace-zip/workspaceZip.service.js';
import { DataPreparationService } from '../modules/data-preparation/data-preparation.service.js';
import { uploadDir } from '../common/runtime-storage.js';

type AuthUser = {
  id: string;
  email: string;
};

type UploadedFile = {
  filename: string;
  originalname: string;
  mimetype: string;
  size: number;
  path: string;
};

type UploadedFolderFile = UploadedFile & {
  relativePath?: string;
};

type CreateDatasetInput = {
  name: string;
  description?: string;
  visibility?: 'PRIVATE' | 'WORKSPACE' | 'PUBLIC' | 'RESTRICTED';
  recordCount?: number;
  tags?: string[];
  uploadKind?: 'files' | 'folder' | 'zip' | 'cloud' | 'repository';
  sourceProvider?: string;
  sourceLocator?: string;
};

type UploadDatasetInput = Partial<CreateDatasetInput>;
type UploadDatasetAutomationInput = UploadDatasetInput & {
  autoRunPipeline?: boolean;
  uploadKind?: 'files' | 'folder' | 'zip' | 'cloud' | 'repository';
};

type UploadDatasetBundleInput = UploadDatasetAutomationInput & {
  relativePaths?: string[];
};

function mapUserName(user: { firstname: string; surname: string }) {
  return `${user.firstname} ${user.surname}`.trim();
}

function toSafeNumber(value: bigint | number | null | undefined) {
  if (value === null || value === undefined) return value;
  return Number(value);
}

function serializeDataset<T extends { sizeBytes?: bigint | number | null }>(dataset: T) {
  return {
    ...dataset,
    sizeBytes: toSafeNumber(dataset.sizeBytes),
  };
}

function mapAccessLevel(visibility?: CreateDatasetInput['visibility']) {
  if (visibility === 'PUBLIC') return 'OPEN';
  if (visibility === 'RESTRICTED') return 'RESTRICTED';
  return 'INTERNAL';
}

function getFileExtension(fileName: string) {
  const lower = fileName.toLowerCase();
  if (lower.endsWith('.nii.gz')) return '.nii.gz';
  const lastDot = lower.lastIndexOf('.');
  return lastDot >= 0 ? lower.slice(lastDot) : 'unknown';
}

function asJsonObject(value: Prisma.JsonValue | null | undefined): Record<string, unknown> {
  if (!value || typeof value !== 'object' || Array.isArray(value)) {
    return {};
  }

  return value as Record<string, unknown>;
}

function isZipUpload(file: UploadedFile, uploadKind?: UploadDatasetAutomationInput['uploadKind']) {
  return uploadKind === 'zip' || file.originalname.toLowerCase().endsWith('.zip');
}

async function extractAndRegisterWorkspaceZip(params: {
  user: AuthUser;
  workspaceId: string;
  file: UploadedFile;
}) {
  const ingest = await ingestWorkspaceZip({
    workspaceId: params.workspaceId,
    uploadedById: params.user.id,
    filePath: params.file.path,
    originalName: params.file.originalname,
  });

  const candidates = await prisma.workspaceFile.findMany({
    where: {
      workspaceId: params.workspaceId,
      archiveId: ingest.archiveId,
      isDatasetCandidate: true,
      datasetId: null,
    },
    orderBy: { relativePath: 'asc' },
    take: 100,
  });

  const registeredDatasetIds: string[] = [];
  const failedRegistrations: Array<{ fileId: string; relativePath: string; error: string }> = [];

  for (const candidate of candidates) {
    try {
      const registered = await registerWorkspaceFileAsDataset({
        workspaceId: params.workspaceId,
        fileId: candidate.id,
        actorId: params.user.id,
      });
      registeredDatasetIds.push(registered.dataset.id);
    } catch (error) {
      failedRegistrations.push({
        fileId: candidate.id,
        relativePath: candidate.relativePath,
        error: error instanceof Error ? error.message : 'Unknown registration error',
      });
    }
  }

  return {
    zipExtraction: {
      archiveId: ingest.archiveId,
      status: ingest.status,
      extractedFiles: ingest.extractedFiles,
      datasetCandidates: ingest.datasetCandidates,
      autoRegisteredDatasets: registeredDatasetIds.length,
      registeredDatasetIds,
      failedRegistrations,
      extractedAt: new Date().toISOString(),
    },
  };
}

function detectResearchModality(fileName: string, relativePath?: string) {
  const value = `${relativePath ?? ''}/${fileName}`.toLowerCase();

  if (value.endsWith('.nii') || value.endsWith('.nii.gz')) {
    if (value.includes('dti')) return 'DTI Neuroimaging';
    if (value.includes('fmri') || value.includes('bold')) return 'fMRI Neuroimaging';
    return 'MRI Neuroimaging';
  }

  if (value.endsWith('.vcf') || value.endsWith('.bcf')) return 'Genomics';
  if (value.endsWith('.csv') || value.endsWith('.tsv') || value.endsWith('.xlsx')) {
    if (value.includes('clinical') || value.includes('diagnosis') || value.includes('demographic')) {
      return 'Clinical Tabular';
    }
    return 'Tabular Data';
  }
  if (value.endsWith('.json')) return value.includes('metadata') ? 'Study Metadata' : 'JSON Metadata';
  if (value.endsWith('.pdf')) return 'Documents / PDFs';
  if (value.includes('wearable') || value.includes('sensor')) return 'Wearables / Sensors';
  if (value.endsWith('.zip')) return 'Compressed Archive';

  return 'Other Research File';
}

function summarizeDatasetBundle(files: UploadedFolderFile[], uploadKind?: string) {
  const extensionCounts = new Map<string, number>();
  const modalityCounts = new Map<string, number>();
  const rootFolders = new Set<string>();

  const inventory = files.map((file) => {
    const relativePath = file.relativePath || file.originalname;
    const extension = getFileExtension(relativePath || file.originalname);
    const modality = detectResearchModality(file.originalname, relativePath);
    const rootFolder = relativePath.includes('/') ? relativePath.split('/')[0] : null;

    extensionCounts.set(extension, (extensionCounts.get(extension) ?? 0) + 1);
    modalityCounts.set(modality, (modalityCounts.get(modality) ?? 0) + 1);
    if (rootFolder) rootFolders.add(rootFolder);

    return {
      originalName: file.originalname,
      relativePath,
      mimeType: file.mimetype || 'application/octet-stream',
      sizeBytes: file.size,
      extension,
      modality,
    };
  });

  return {
    uploadKind: uploadKind ?? 'files',
    fileCount: files.length,
    totalSizeBytes: files.reduce((sum, file) => sum + file.size, 0),
    rootFolders: Array.from(rootFolders).slice(0, 30),
    fileTypes: Array.from(extensionCounts.entries()).map(([extension, count]) => ({ extension, count })),
    modalities: Array.from(modalityCounts.entries()).map(([name, count]) => ({ name, count })),
    validation: {
      status: 'QUEUED',
      qualityScore: null,
      schemaDetected: false,
      nextStep: 'Scan files, validate schema, create dataset profile, then route to analytics.',
    },
    inventory: inventory.slice(0, 500),
  };
}

async function buildTabularProfile(file: UploadedFile): Promise<ParsedDataProfile> {
  try {
    const parser = new UniversalDataParser();
    return await parser.parse(file.path, file.originalname, file.mimetype);
  } catch (error) {
    return {
      connectorType: 'MANUAL_REQUIRED',
      format: getFileExtension(file.originalname).replace(/^\./, ''),
      metadataJson: {
        parser: 'universal-data-parser',
        parserStatus: 'FAILED',
        parserError: error instanceof Error ? error.message : 'Unknown parser error',
      },
    };
  }
}

function buildDataPreparationMetadata(profile: ParsedDataProfile) {
  const preparation = new DataPreparationEngine().prepare(profile);
  const profileSummary = preparation.profile;

  return {
    dataPreparation: preparation,
    dataQualityScore: profileSummary.qualityScore,
    missingnessRate: profileSummary.missingRate,
    duplicateRows: profileSummary.duplicateRows,
    invalidRows: profileSummary.outlierCount,
    cleaningStatus: preparation.status,
    cleanedPreviewRows: preparation.cleanedPreviewRows,
    variableMapping: preparation.variableMapping,
    researchQuestionBuilder: preparation.recommendations.researchQuestionBuilder,
    hypothesisSelector: preparation.recommendations.hypothesisSelector,
    visualizationSelector: preparation.recommendations.visualizations,
    publicationCharts: preparation.recommendations.publicationCharts,
  };
}

async function registerPreparationWorkflowForDataset(
  datasetId: string,
  sourceConnectionId: string,
  message = 'Dataset parsed, cleaned, profiled, and registered for analysis.',
) {
  try {
    await new DataPreparationService().registerDatasetWorkflow(datasetId, {
      sourceConnectionId,
      status: 'ready-for-analysis',
      message,
    });
  } catch (error) {
    console.warn(
      `Unable to register data-preparation workflow for dataset ${datasetId}`,
      error instanceof Error ? error.message : error,
    );
  }
}
function sanitizeFileName(value: string) {
  const cleaned = value.replace(/[^a-zA-Z0-9._-]+/g, '-').replace(/^-+|-+$/g, '');
  return cleaned || 'external-dataset';
}

function extensionFromContentType(contentType: string | null) {
  const normalized = String(contentType ?? '').toLowerCase();
  if (normalized.includes('json')) return '.json';
  if (normalized.includes('csv')) return '.csv';
  if (normalized.includes('tab-separated')) return '.tsv';
  if (normalized.includes('xml')) return '.xml';
  if (normalized.includes('zip')) return '.zip';
  if (normalized.includes('pdf')) return '.pdf';
  if (normalized.includes('spreadsheet') || normalized.includes('excel')) return '.xlsx';
  return '.dat';
}

function fileNameFromLocator(locator: string, contentType: string | null, fallbackName: string) {
  try {
    const url = new URL(locator);
    const fromPath = path.basename(url.pathname);
    if (fromPath && fromPath.includes('.')) return sanitizeFileName(fromPath);
  } catch {
    const fromPath = path.basename(locator.replace(/\\/g, '/'));
    if (fromPath && fromPath.includes('.')) return sanitizeFileName(fromPath);
  }

  return `${sanitizeFileName(fallbackName)}${extensionFromContentType(contentType)}`;
}

function isHttpLocator(locator?: string | null) {
  return /^https?:\/\//i.test(String(locator ?? '').trim());
}

function extractContentDispositionFileName(value: string | null) {
  if (!value) return null;
  const utf8Match = value.match(/filename\*=UTF-8''([^;]+)/i);
  if (utf8Match?.[1]) return decodeURIComponent(utf8Match[1]);
  const plainMatch = value.match(/filename="?([^";]+)"?/i);
  return plainMatch?.[1] ?? null;
}

async function saveExternalBuffer(params: {
  buffer: Buffer;
  fileName: string;
  contentType: string;
}): Promise<UploadedFile> {
  await mkdir(uploadDir, { recursive: true });

  const extension = path.extname(params.fileName);
  const storedFileName = `${Date.now()}-${Math.round(Math.random() * 1e9)}${extension || '.dat'}`;
  const storagePath = path.join(uploadDir, storedFileName);
  await writeFile(storagePath, params.buffer);

  return {
    filename: storedFileName,
    originalname: params.fileName,
    mimetype: params.contentType || 'application/octet-stream',
    size: params.buffer.length,
    path: storagePath,
  };
}

async function downloadExternalImport(input: CreateDatasetInput): Promise<UploadedFile | null> {
  const locator = input.sourceLocator?.trim();
  if (!locator || !isHttpLocator(locator)) return null;

  const response = await fetch(locator, {
    headers: {
      accept: 'text/csv,application/json,application/zip,application/xml,text/xml,application/octet-stream,*/*',
    },
  });

  if (!response.ok) {
    throw new HttpError(response.status, `External import source returned ${response.status}`);
  }

  const contentLength = Number(response.headers.get('content-length') ?? 0);
  const maxBytes = Number(process.env.EXTERNAL_IMPORT_MAX_BYTES ?? 512 * 1024 * 1024);
  if (contentLength && contentLength > maxBytes) {
    throw new HttpError(413, `External import is larger than the configured ${Math.round(maxBytes / 1024 / 1024)} MB limit`);
  }

  const buffer = Buffer.from(await response.arrayBuffer());
  if (buffer.length > maxBytes) {
    throw new HttpError(413, `External import is larger than the configured ${Math.round(maxBytes / 1024 / 1024)} MB limit`);
  }

  const contentType = response.headers.get('content-type')?.split(';')[0] || 'application/octet-stream';
  const contentDispositionName = extractContentDispositionFileName(response.headers.get('content-disposition'));
  const originalName = sanitizeFileName(
    contentDispositionName || fileNameFromLocator(locator, contentType, input.name),
  );

  return saveExternalBuffer({
    buffer,
    fileName: originalName,
    contentType,
  });
}

async function createExternalImportManifest(input: CreateDatasetInput): Promise<UploadedFile> {
  const manifest = {
    importMode: 'EXTERNAL_CONNECTOR_SYNC',
    uploadKind: input.uploadKind,
    provider: input.sourceProvider ?? null,
    locator: input.sourceLocator ?? null,
    status: 'SYNC_PENDING',
    message:
      'This source requires a provider connector, repository API token, OAuth grant, or signed URL before the platform can download raw data.',
    supportedDirectImport:
      'Use a direct HTTPS URL to CSV, XLSX, JSON, JSONL, XML, TSV, TXT, ZIP, PDF, GeoJSON, FHIR JSON, Parquet, or imaging metadata for immediate import.',
    createdAt: new Date().toISOString(),
  };
  const buffer = Buffer.from(JSON.stringify(manifest, null, 2), 'utf8');
  return saveExternalBuffer({
    buffer,
    fileName: `${sanitizeFileName(input.name)}-connector-manifest.json`,
    contentType: 'application/json',
  });
}

async function createExternalDatasetImport(user: AuthUser, workspaceId: string, input: CreateDatasetInput) {
  const downloadedFile = await downloadExternalImport(input);
  const file = downloadedFile ?? (await createExternalImportManifest(input));
  const profile = await buildTabularProfile(file);
  const preparationMetadata = buildDataPreparationMetadata(profile);
  const downloaded = Boolean(downloadedFile);
  const sourceType = input.uploadKind === 'repository' ? 'Repository Import' : 'Cloud Import';
  const fileUrl = `${env.SERVER_PUBLIC_URL}/uploads/${file.filename}`;

  const dataset = await prisma.dataset.create({
    data: {
      name: input.name.trim(),
      description: input.description,
      visibility: input.visibility ?? 'WORKSPACE',
      recordCount: input.recordCount ?? profile.recordCount,
      columnCount: profile.columnCount,
      tags: [
        ...(input.tags ?? []),
        input.uploadKind === 'repository' ? 'repository-import' : 'cloud-import',
        input.sourceProvider?.toLowerCase().replace(/[^a-z0-9]+/g, '-'),
        profile.format,
      ].filter((tag, index, all): tag is string => Boolean(tag) && all.indexOf(tag) === index),
      workspaceId,
      createdById: user.id,
      storagePath: fileUrl,
      mimeType: file.mimetype,
      sizeBytes: file.size,
      isDepositListed: true,
      depositStatus: 'AVAILABLE',
      accessLevel: mapAccessLevel(input.visibility),
      sourceName: sourceType,
      sourceUrl: input.sourceLocator?.slice(0, 255),
      schemaJson: profile.schemaJson as Prisma.InputJsonValue | undefined,
      previewRowsJson: profile.previewRowsJson as Prisma.InputJsonValue | undefined,
      publishedAt: new Date(),
      metadataJson: {
        ...((profile.metadataJson && typeof profile.metadataJson === 'object' && !Array.isArray(profile.metadataJson))
          ? profile.metadataJson
          : {}),
        ...preparationMetadata,
        importMode: downloaded ? 'EXTERNAL_DIRECT_DOWNLOAD' : 'EXTERNAL_CONNECTOR_SYNC',
        uploadKind: input.uploadKind,
        sourceProvider: input.sourceProvider,
        sourceLocator: input.sourceLocator,
        connectorType: profile.connectorType ?? (downloaded ? 'WEB_DOWNLOAD' : 'CONNECTOR_PENDING'),
        detectedFormat: profile.format,
        uploadStatus: downloaded ? 'READY' : 'SYNC_PENDING',
        ingestionState: downloaded ? 'downloaded_and_stored' : 'connector_manifest_stored',
        storedOnServer: true,
        fileAssetStored: false,
        directDownload: downloaded,
        importStatusLabels: downloaded
          ? ['URL Found', 'Download Ready', 'Downloaded', 'Validated', 'Loaded']
          : ['Connector Registered', 'Authorization Required', 'Sync Pending'],
        datasetProfile: {
          source: sourceType,
          uploadDate: new Date().toISOString(),
          provider: input.sourceProvider ?? null,
          locator: input.sourceLocator ?? null,
          numberOfFiles: 1,
          totalSizeBytes: file.size,
          validationStatus: downloaded ? 'READY' : 'SYNC_PENDING',
          qualityScore: preparationMetadata.dataQualityScore,
          cleaningStatus: preparationMetadata.cleaningStatus,
          parser: 'UniversalDataParser',
          connectorType: profile.connectorType ?? (downloaded ? 'WEB_DOWNLOAD' : 'CONNECTOR_PENDING'),
          detectedFormat: profile.format,
        },
      } as Prisma.InputJsonValue,
    },
    include: {
      createdBy: {
        select: { id: true, firstname: true, surname: true, email: true },
      },
    },
  });

  await prisma.fileAsset.create({
    data: {
      fileName: file.filename,
      originalName: file.originalname,
      mimeType: file.mimetype,
      sizeBytes: file.size,
      storagePath: file.path,
      publicUrl: fileUrl,
      datasetId: dataset.id,
      uploadedById: user.id,
    },
  });

  let readyDataset = await prisma.dataset.update({
    where: { id: dataset.id },
    data: {
      metadataJson: {
        ...((dataset.metadataJson && typeof dataset.metadataJson === 'object' && !Array.isArray(dataset.metadataJson)) ? dataset.metadataJson : {}),
        fileAssetStored: true,
      },
    },
    include: {
      createdBy: {
        select: { id: true, firstname: true, surname: true, email: true },
      },
    },
  });

  if (isZipUpload(file, input.uploadKind)) {
    const zipMetadata = await extractAndRegisterWorkspaceZip({ user, workspaceId, file });
    readyDataset = await prisma.dataset.update({
      where: { id: readyDataset.id },
      data: {
        metadataJson: {
          ...asJsonObject(readyDataset.metadataJson),
          ...zipMetadata,
        },
      },
      include: {
        createdBy: {
          select: { id: true, firstname: true, surname: true, email: true },
        },
      },
    });
  }

  await registerPreparationWorkflowForDataset(
    readyDataset.id,
    downloaded ? 'external-direct-import' : 'external-connector-sync',
    downloaded
      ? 'External dataset downloaded, parsed, cleaned, and registered for analysis.'
      : 'External connector manifest registered; preparation workflow is waiting for connector sync.',
  );

  await notifyWorkspaceMembers(workspaceId, {
    type: 'DATASET_ADDED',
    title: downloaded ? 'External dataset imported' : 'External connector registered',
    description: downloaded
      ? `${readyDataset.name} was downloaded, stored, and parsed for workspace use.`
      : `${readyDataset.name} was registered. Add connector credentials or a signed URL to complete sync.`,
    severity: downloaded ? 'INFO' : 'WARNING',
    link: `/dashboard/workspaces/${workspaceId}`,
  });

  return {
    ...serializeDataset(readyDataset),
    createdBy: {
      id: readyDataset.createdBy.id,
      name: mapUserName(readyDataset.createdBy),
      email: readyDataset.createdBy.email,
    },
  };
}

export async function listDatasetsByWorkspace(user: AuthUser, workspaceId: string) {
  await assertWorkspaceAction(workspaceId, user, WorkspaceAction.VIEW_DATASETS);

  const datasets = await prisma.dataset.findMany({
    where: { workspaceId },
    orderBy: { updatedAt: 'desc' },
    include: {
      createdBy: {
        select: { id: true, firstname: true, surname: true, email: true },
      },
    },
  });

  return datasets.map((dataset) => ({
    ...serializeDataset(dataset),
    createdBy: {
      id: dataset.createdBy.id,
      name: mapUserName(dataset.createdBy),
      email: dataset.createdBy.email,
    },
  }));
}

export async function createDataset(user: AuthUser, workspaceId: string, input: CreateDatasetInput) {
  await assertWorkspaceAction(workspaceId, user, WorkspaceAction.UPLOAD_DATASET);

  if (input.uploadKind === 'cloud' || input.uploadKind === 'repository') {
    if (!input.sourceLocator?.trim()) {
      throw new HttpError(400, 'sourceLocator is required for cloud and repository imports');
    }
    return createExternalDatasetImport(user, workspaceId, input);
  }

  const dataset = await prisma.dataset.create({
    data: {
      name: input.name,
      description: input.description,
      visibility: input.visibility ?? 'WORKSPACE',
      recordCount: input.recordCount,
      tags: input.tags ?? [],
      workspaceId,
      createdById: user.id,
    },
    include: {
      createdBy: {
        select: { id: true, firstname: true, surname: true, email: true },
      },
    },
  });

  await notifyWorkspaceMembers(workspaceId, {
    type: 'DATASET_ADDED',
    title: 'Dataset created',
    description: `${dataset.name} was created in this workspace.`,
    severity: 'INFO',
    link: `/dashboard/workspaces/${workspaceId}`,
  });

  return {
    ...serializeDataset(dataset),
    createdBy: {
      id: dataset.createdBy.id,
      name: mapUserName(dataset.createdBy),
      email: dataset.createdBy.email,
    },
  };
}

export async function uploadDatasetFile(
  user: AuthUser,
  workspaceId: string,
  file: UploadedFile,
  input: UploadDatasetAutomationInput = {},
) {
  await assertWorkspaceAction(workspaceId, user, WorkspaceAction.UPLOAD_DATASET);

  const tabularProfile = await buildTabularProfile(file);
  const preparationMetadata = buildDataPreparationMetadata(tabularProfile);
  const fileUrl = `${env.SERVER_PUBLIC_URL}/uploads/${file.filename}`;
  const dataset = await prisma.dataset.create({
    data: {
      name: input.name?.trim() || file.originalname,
      description: input.description,
      visibility: input.visibility ?? 'WORKSPACE',
      recordCount: input.recordCount ?? tabularProfile.recordCount,
      columnCount: tabularProfile.columnCount,
      tags: input.tags ?? [],
      workspaceId,
      createdById: user.id,
      storagePath: fileUrl,
      mimeType: file.mimetype,
      sizeBytes: file.size,
      isDepositListed: true,
      depositStatus: 'AVAILABLE',
      accessLevel: mapAccessLevel(input.visibility),
      sourceName: 'Workspace Upload',
      schemaJson: tabularProfile.schemaJson as Prisma.InputJsonValue | undefined,
      previewRowsJson: tabularProfile.previewRowsJson as Prisma.InputJsonValue | undefined,
      publishedAt: new Date(),
      metadataJson: {
        ...((tabularProfile.metadataJson && typeof tabularProfile.metadataJson === 'object' && !Array.isArray(tabularProfile.metadataJson))
          ? tabularProfile.metadataJson
          : {}),
        ...preparationMetadata,
        uploadedFileName: file.originalname,
        uploadKind: input.uploadKind ?? (file.originalname.toLowerCase().endsWith('.zip') ? 'zip' : 'files'),
        importMode: 'METADATA_DRIVEN_DATA_IMPORT',
        connectorType: tabularProfile.connectorType ?? 'MANUAL_REQUIRED',
        detectedFormat: tabularProfile.format ?? getFileExtension(file.originalname),
        uploadStatus: 'READY',
        ingestionState: 'stored',
        storedOnServer: true,
        fileAssetStored: false,
        importStatusLabels: [
          'URL Found',
          'Download Ready',
          'Downloaded',
          'Validated',
          'Loaded',
        ],
        datasetProfile: {
          source: 'Browser file upload',
          uploadDate: new Date().toISOString(),
          numberOfFiles: 1,
          totalSizeBytes: file.size,
          validationStatus: 'READY',
          qualityScore: preparationMetadata.dataQualityScore,
          cleaningStatus: preparationMetadata.cleaningStatus,
          parser: 'UniversalDataParser',
          connectorType: tabularProfile.connectorType ?? 'MANUAL_REQUIRED',
          detectedFormat: tabularProfile.format ?? getFileExtension(file.originalname),
        },
      } as Prisma.InputJsonValue,
    },
    include: {
      createdBy: {
        select: { id: true, firstname: true, surname: true, email: true },
      },
    },
  });

  await prisma.fileAsset.create({
    data: {
      fileName: file.filename,
      originalName: file.originalname,
      mimeType: file.mimetype,
      sizeBytes: file.size,
      storagePath: file.path,
      publicUrl: fileUrl,
      datasetId: dataset.id,
      uploadedById: user.id,
    },
  });

  let readyDataset = await prisma.dataset.update({
    where: { id: dataset.id },
    data: {
      metadataJson: {
        ...((dataset.metadataJson && typeof dataset.metadataJson === 'object' && !Array.isArray(dataset.metadataJson)) ? dataset.metadataJson : {}),
        fileAssetStored: true,
      },
    },
    include: {
      createdBy: {
        select: { id: true, firstname: true, surname: true, email: true },
      },
    },
  });

  if (isZipUpload(file, input.uploadKind)) {
    const zipMetadata = await extractAndRegisterWorkspaceZip({ user, workspaceId, file });
    readyDataset = await prisma.dataset.update({
      where: { id: readyDataset.id },
      data: {
        metadataJson: {
          ...asJsonObject(readyDataset.metadataJson),
          ...zipMetadata,
        },
      },
      include: {
        createdBy: {
          select: { id: true, firstname: true, surname: true, email: true },
        },
      },
    });
  }

  await registerPreparationWorkflowForDataset(
    readyDataset.id,
    isZipUpload(file, input.uploadKind) ? 'zip-upload' : 'workspace-upload',
    'Uploaded dataset parsed, cleaned, profiled, and registered for analysis.',
  );

  await notifyWorkspaceMembers(workspaceId, {
    type: 'DATASET_ADDED',
    title: 'Dataset uploaded',
    description: `${readyDataset.name} was stored and is ready for workspace use.`,
    severity: 'INFO',
    link: `/dashboard/workspaces/${workspaceId}`,
  });

  if (input.autoRunPipeline !== false) {
    const pipelines = new PipelinesService(prisma);
    const automation = new AutomationService(pipelines);

    await automation.triggerDatasetAutomation({
      userId: user.id,
      workspaceId,
      datasetId: readyDataset.id,
      analysisType: 'classification',
    });
  }

  return {
    ...serializeDataset(readyDataset),
    createdBy: {
      id: readyDataset.createdBy.id,
      name: mapUserName(readyDataset.createdBy),
      email: readyDataset.createdBy.email,
    },
  };
}

export async function uploadDatasetBundleFiles(
  user: AuthUser,
  workspaceId: string,
  files: UploadedFolderFile[],
  input: UploadDatasetBundleInput = {},
) {
  await assertWorkspaceAction(workspaceId, user, WorkspaceAction.UPLOAD_DATASET);

  if (!files.length) {
    throw new HttpError(400, 'At least one file is required');
  }

  const relativePaths = Array.isArray(input.relativePaths) ? input.relativePaths : [];
  const enrichedFiles = files.map((file, index) => ({
    ...file,
    relativePath: relativePaths[index] || file.relativePath || file.originalname,
  }));
  const bundle = summarizeDatasetBundle(enrichedFiles, input.uploadKind);
  const primaryFile = enrichedFiles[0];
  const primaryProfile = await buildTabularProfile(primaryFile);
  const preparationMetadata = buildDataPreparationMetadata(primaryProfile);
  const detectedFormat = primaryProfile.format ?? getFileExtension(primaryFile.originalname);
  const connectorType =
    primaryProfile.connectorType ?? (input.uploadKind === 'zip' || primaryFile.originalname.toLowerCase().endsWith('.zip') ? 'ZIP_ARCHIVE' : 'MANUAL_REQUIRED');
  const fileUrl = `${env.SERVER_PUBLIC_URL}/uploads/${primaryFile.filename}`;

  const dataset = await prisma.dataset.create({
    data: {
      name: input.name?.trim() || bundle.rootFolders[0] || primaryFile.originalname,
      description: input.description,
      visibility: input.visibility ?? 'WORKSPACE',
      recordCount: primaryProfile.recordCount ?? bundle.fileCount,
      columnCount: primaryProfile.columnCount ?? bundle.fileTypes.length,
      tags: [
        ...(input.tags ?? []),
        'folder-upload',
        detectedFormat,
        ...bundle.modalities.map((modality) => modality.name.toLowerCase().replace(/[^a-z0-9]+/g, '-')),
      ].filter((tag, index, all) => tag && all.indexOf(tag) === index),
      workspaceId,
      createdById: user.id,
      storagePath: fileUrl,
      mimeType: input.uploadKind === 'folder' ? 'application/vnd.datanotch.folder+json' : 'application/vnd.datanotch.bundle+json',
      sizeBytes: bundle.totalSizeBytes,
      isDepositListed: true,
      depositStatus: 'AVAILABLE',
      accessLevel: mapAccessLevel(input.visibility),
      sourceName: input.uploadKind === 'folder' ? 'Folder Upload' : 'Multi-file Upload',
      schemaJson: primaryProfile.schemaJson as Prisma.InputJsonValue | undefined,
      previewRowsJson: primaryProfile.previewRowsJson as Prisma.InputJsonValue | undefined,
      publishedAt: new Date(),
      metadataJson: {
        ...bundle,
        ...preparationMetadata,
        importMode: 'METADATA_DRIVEN_DATA_IMPORT',
        connectorType,
        detectedFormat,
        parserProfile:
          primaryProfile.metadataJson && typeof primaryProfile.metadataJson === 'object' && !Array.isArray(primaryProfile.metadataJson)
            ? primaryProfile.metadataJson
            : null,
        uploadStatus: 'READY',
        ingestionState: 'stored',
        storedOnServer: true,
        fileAssetStored: false,
        importStatusLabels: [
          'URL Found',
          'Download Ready',
          'Downloaded',
          'Validated',
          'Loaded',
        ],
        datasetProfile: {
          source: input.uploadKind === 'folder' ? 'Browser folder upload' : 'Browser multi-file upload',
          uploadDate: new Date().toISOString(),
          numberOfSubjects: null,
          numberOfFiles: bundle.fileCount,
          fileTypes: bundle.fileTypes,
          totalSizeBytes: bundle.totalSizeBytes,
          qualityScore: preparationMetadata.dataQualityScore,
          cleaningStatus: preparationMetadata.cleaningStatus,
          validationStatus: 'READY',
          parser: 'UniversalDataParser',
          connectorType,
          detectedFormat,
        },
      } as Prisma.InputJsonValue,
    },
    include: {
      createdBy: {
        select: { id: true, firstname: true, surname: true, email: true },
      },
    },
  });

  await prisma.fileAsset.createMany({
    data: enrichedFiles.map((file) => ({
      fileName: file.filename,
      originalName: file.relativePath || file.originalname,
      mimeType: file.mimetype || 'application/octet-stream',
      sizeBytes: file.size,
      storagePath: file.path,
      publicUrl: `${env.SERVER_PUBLIC_URL}/uploads/${file.filename}`,
      datasetId: dataset.id,
      uploadedById: user.id,
    })),
  });

  let readyDataset = await prisma.dataset.update({
    where: { id: dataset.id },
    data: {
      metadataJson: {
        ...((dataset.metadataJson && typeof dataset.metadataJson === 'object' && !Array.isArray(dataset.metadataJson)) ? dataset.metadataJson : {}),
        fileAssetStored: true,
      },
    },
    include: {
      createdBy: {
        select: { id: true, firstname: true, surname: true, email: true },
      },
    },
  });

  if (isZipUpload(primaryFile, input.uploadKind)) {
    const zipMetadata = await extractAndRegisterWorkspaceZip({ user, workspaceId, file: primaryFile });
    readyDataset = await prisma.dataset.update({
      where: { id: readyDataset.id },
      data: {
        metadataJson: {
          ...asJsonObject(readyDataset.metadataJson),
          ...zipMetadata,
        },
      },
      include: {
        createdBy: {
          select: { id: true, firstname: true, surname: true, email: true },
        },
      },
    });
  }

  await registerPreparationWorkflowForDataset(
    readyDataset.id,
    input.uploadKind === 'folder' ? 'folder-upload' : 'bundle-upload',
    'Dataset bundle parsed, cleaned, profiled, and registered for analysis.',
  );

  await notifyWorkspaceMembers(workspaceId, {
    type: 'DATASET_ADDED',
    title: 'Dataset bundle uploaded',
    description: `${readyDataset.name} was stored with ${bundle.fileCount} files and is ready for workspace use.`,
    severity: 'INFO',
    link: `/dashboard/workspaces/${workspaceId}`,
  });

  if (input.autoRunPipeline !== false) {
    const pipelines = new PipelinesService(prisma);
    const automation = new AutomationService(pipelines);

    await automation.triggerDatasetAutomation({
      userId: user.id,
      workspaceId,
      datasetId: readyDataset.id,
      analysisType: 'classification',
    });
  }

  return {
    ...serializeDataset(readyDataset),
    createdBy: {
      id: readyDataset.createdBy.id,
      name: mapUserName(readyDataset.createdBy),
      email: readyDataset.createdBy.email,
    },
  };
}

export async function getDatasetById(user: AuthUser, workspaceId: string, datasetId: string) {
  await assertWorkspaceAction(workspaceId, user, WorkspaceAction.VIEW_DATASETS);

  const dataset = await prisma.dataset.findFirst({
    where: {
      id: datasetId,
      workspaceId,
    },
    include: {
      createdBy: {
        select: { id: true, firstname: true, surname: true, email: true },
      },
    },
  });

  if (!dataset) {
    throw new HttpError(404, 'Dataset not found');
  }

  return {
    ...serializeDataset(dataset),
    createdBy: {
      id: dataset.createdBy.id,
      name: mapUserName(dataset.createdBy),
      email: dataset.createdBy.email,
    },
  };
}

export async function deleteDataset(user: AuthUser, workspaceId: string, datasetId: string) {
  await assertWorkspaceAction(workspaceId, user, WorkspaceAction.DELETE_DATASET);

  const dataset = await prisma.dataset.findFirst({
    where: {
      id: datasetId,
      workspaceId,
    },
  });

  if (!dataset) {
    throw new HttpError(404, 'Dataset not found');
  }

  return prisma.dataset.delete({
    where: { id: datasetId },
  });
}

