'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import Link from 'next/link';
import {
  Archive,
  CheckCircle2,
  Database,
  File,
  FileSpreadsheet,
  Folder,
  HardDrive,
  Loader2,
  RefreshCcw,
  Search,
  Upload,
  Wand2,
  XCircle,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { getMyWorkspaces, type Workspace, uploadDataset, uploadDatasetBundle } from '@/src/lib/api/workspaces';
import {
  fetchWorkspaceFiles,
  registerWorkspaceFileDataset,
  sendWorkspaceFileToPreparation,
  uploadWorkspaceZip,
  type WorkspaceFileNode,
} from '@/src/lib/api/workspaceZip';

type FlatNode = {
  id: string;
  name: string;
  kind: WorkspaceFileNode['kind'];
  extension: string | null;
  relativePath: string;
  sizeBytes: number;
  isDatasetCandidate: boolean;
  datasetId: string | null;
  depth: number;
  createdAt: string;
};

type UploadResult = {
  fileName: string;
  status: 'uploaded' | 'skipped' | 'failed';
  details: string;
};

type IntakeMode = 'single' | 'bundle';

type StagedUploadFile = {
  file: File;
  relativePath: string;
};

const datasetExtensions = new Set(['.csv', '.xlsx', '.json', '.parquet']);

function formatBytes(value: number): string {
  if (!Number.isFinite(value) || value <= 0) return '0 B';
  const units = ['B', 'KB', 'MB', 'GB'];
  const index = Math.min(Math.floor(Math.log(value) / Math.log(1024)), units.length - 1);
  const size = value / 1024 ** index;
  return `${size.toFixed(size < 10 && index > 0 ? 1 : 0)} ${units[index]}`;
}

function flattenTree(nodes: WorkspaceFileNode[], depth = 0): FlatNode[] {
  return nodes.flatMap((node) => {
    const current: FlatNode = {
      id: node.id,
      name: node.name,
      kind: node.kind,
      extension: node.extension,
      relativePath: node.relativePath,
      sizeBytes: node.sizeBytes,
      isDatasetCandidate: node.isDatasetCandidate,
      datasetId: node.datasetId,
      depth,
      createdAt: node.createdAt,
    };
    return [current, ...flattenTree(node.children, depth + 1)];
  });
}

function iconForNode(node: FlatNode) {
  if (node.kind === 'FOLDER') return <Folder className="h-4 w-4 text-blue-600" />;
  if (node.kind === 'ARCHIVE') return <Archive className="h-4 w-4 text-fuchsia-600" />;
  if (node.isDatasetCandidate) return <FileSpreadsheet className="h-4 w-4 text-emerald-600" />;
  return <File className="h-4 w-4 text-slate-600" />;
}

function indentClass(depth: number): string {
  if (depth <= 0) return 'pl-0';
  if (depth === 1) return 'pl-3';
  if (depth === 2) return 'pl-6';
  if (depth === 3) return 'pl-9';
  if (depth === 4) return 'pl-12';
  return 'pl-14';
}

function uploadResultIcon(status: UploadResult['status']) {
  if (status === 'uploaded') return <CheckCircle2 className="h-4 w-4 text-emerald-600" />;
  if (status === 'failed') return <XCircle className="h-4 w-4 text-rose-600" />;
  return <Archive className="h-4 w-4 text-amber-600" />;
}

function topLevelGroup(path: string): string {
  const normalized = normalizeRelativePath(path);
  if (!normalized.includes('/')) {
    return 'Ungrouped Files';
  }

  return normalized.split('/')[0] || 'Ungrouped Files';
}

function normalizeRelativePath(path: string): string {
  const cleaned = path.replaceAll('\\', '/').replace(/^\/+/, '');
  return cleaned || 'unnamed';
}

function extensionOf(name: string): string {
  if (!name.includes('.')) return '';
  return `.${name.split('.').pop()?.toLowerCase()}`;
}

function topFolderName(relativePaths: string[]): string {
  const first = relativePaths.find((path) => path.includes('/'));
  if (!first) {
    return 'workspace-folder-bundle';
  }

  const folder = first.split('/')[0]?.trim();
  return folder || 'workspace-folder-bundle';
}

type FileSystemEntryLike = {
  name: string;
  isFile: boolean;
  isDirectory: boolean;
  file: (success: (f: File) => void, error: (e: unknown) => void) => void;
  createReader: () => FileSystemDirectoryReaderLike;
};

type FileSystemDirectoryReaderLike = {
  readEntries: (success: (entries: FileSystemEntryLike[]) => void, error: (e: unknown) => void) => void;
};

type DataTransferItemWithEntry = Omit<DataTransferItem, 'webkitGetAsEntry'> & {
  webkitGetAsEntry?: () => FileSystemEntryLike | null;
};

type DirectoryHandleLike = {
  name: string;
  kind: 'file' | 'directory';
  getFile: () => Promise<File>;
  values: () => AsyncIterable<DirectoryHandleLike>;
};

async function entryFile(entry: FileSystemEntryLike): Promise<File> {
  return new Promise((resolve, reject) => {
    entry.file((file: File) => resolve(file), (error: unknown) => reject(error));
  });
}

async function readDirectoryEntries(reader: FileSystemDirectoryReaderLike): Promise<FileSystemEntryLike[]> {
  const all: FileSystemEntryLike[] = [];
  while (true) {
    const batch = await new Promise<FileSystemEntryLike[]>((resolve, reject) => {
      reader.readEntries((entries: FileSystemEntryLike[]) => resolve(entries), (error: unknown) => reject(error));
    });
    if (!batch.length) {
      break;
    }
    all.push(...batch);
  }
  return all;
}

async function collectFromEntry(entry: FileSystemEntryLike, basePath = ''): Promise<StagedUploadFile[]> {
  const currentPath = basePath ? `${basePath}/${entry.name}` : entry.name;

  if (entry.isFile) {
    const file = await entryFile(entry);
    return [
      {
        file,
        relativePath: normalizeRelativePath(currentPath),
      },
    ];
  }

  if (!entry.isDirectory) {
    return [];
  }

  const reader = entry.createReader();
  const children = await readDirectoryEntries(reader);
  const nested = await Promise.all(children.map((child) => collectFromEntry(child, currentPath)));
  return nested.flat();
}

async function collectDropFiles(dataTransfer: DataTransfer): Promise<StagedUploadFile[]> {
  const items = Array.from(dataTransfer.items || []);
  const canTraverse = items.some((item) => typeof (item as DataTransferItemWithEntry).webkitGetAsEntry === 'function');

  if (canTraverse) {
    const entries = items
      .map((item): FileSystemEntryLike | null => (item as DataTransferItemWithEntry).webkitGetAsEntry?.() ?? null)
      .filter((entry): entry is FileSystemEntryLike => !!entry);
    const nested = await Promise.all(entries.map((entry) => collectFromEntry(entry)));
    return nested.flat();
  }

  return Array.from(dataTransfer.files).map((file) => ({
    file,
    relativePath: normalizeRelativePath((file as File & { webkitRelativePath?: string }).webkitRelativePath || file.name),
  }));
}

async function collectDirectoryHandleFiles(handle: DirectoryHandleLike, prefix = ''): Promise<StagedUploadFile[]> {
  const collected: StagedUploadFile[] = [];
  for await (const child of handle.values()) {
    if (child.kind === 'file') {
      const file = await child.getFile();
      const relativePath = normalizeRelativePath(prefix ? `${prefix}/${file.name}` : file.name);
      collected.push({ file, relativePath });
      continue;
    }

    if (child.kind === 'directory') {
      const nestedPrefix = prefix ? `${prefix}/${child.name}` : child.name;
      const nested = await collectDirectoryHandleFiles(child, nestedPrefix);
      collected.push(...nested);
    }
  }

  return collected;
}

export default function FilesPage() {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const folderInputRef = useRef<HTMLInputElement>(null);

  const [workspaces, setWorkspaces] = useState<Workspace[]>([]);
  const [selectedWorkspaceId, setSelectedWorkspaceId] = useState<string>('');
  const [nodes, setNodes] = useState<WorkspaceFileNode[]>([]);
  const [query, setQuery] = useState('');
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [uploadResults, setUploadResults] = useState<UploadResult[]>([]);
  const [intakeMode, setIntakeMode] = useState<IntakeMode>('single');

  const flatNodes = useMemo(() => flattenTree(nodes), [nodes]);

  const filteredNodes = useMemo(() => {
    if (!query.trim()) return flatNodes;
    const needle = query.trim().toLowerCase();
    return flatNodes.filter((node) => node.name.toLowerCase().includes(needle) || node.relativePath.toLowerCase().includes(needle));
  }, [flatNodes, query]);

  const stats = useMemo(() => {
    const totalFiles = flatNodes.filter((node) => node.kind !== 'FOLDER').length;
    const folders = flatNodes.filter((node) => node.kind === 'FOLDER').length;
    const archives = flatNodes.filter((node) => node.kind === 'ARCHIVE').length;
    const datasetCandidates = flatNodes.filter((node) => node.isDatasetCandidate).length;
    const registeredDatasets = flatNodes.filter((node) => !!node.datasetId).length;
    return { totalFiles, folders, archives, datasetCandidates, registeredDatasets };
  }, [flatNodes]);

  const groupedUploadResults = useMemo(() => {
    const groups = new Map<string, UploadResult[]>();
    for (const result of uploadResults) {
      const group = topLevelGroup(result.fileName);
      if (!groups.has(group)) {
        groups.set(group, []);
      }
      groups.get(group)?.push(result);
    }

    return Array.from(groups.entries()).map(([group, results]) => ({ group, results }));
  }, [uploadResults]);

  async function loadWorkspaces() {
    const list = await getMyWorkspaces();
    setWorkspaces(list);

    if (!list.length) {
      setSelectedWorkspaceId('');
      return;
    }

    setSelectedWorkspaceId((current) => (current && list.some((item) => item.id === current) ? current : list[0].id));
  }

  async function refreshFiles(workspaceId: string) {
    if (!workspaceId) return;
    setLoading(true);
    setError(null);
    try {
      const tree = await fetchWorkspaceFiles(workspaceId);
      setNodes(tree);
    } catch (err) {
      setNodes([]);
      setError(err instanceof Error ? err.message : 'Failed to load workspace file library');
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    void loadWorkspaces().catch((err) => {
      setError(err instanceof Error ? err.message : 'Failed to load workspaces');
      setLoading(false);
    });
  }, []);

  useEffect(() => {
    if (!selectedWorkspaceId) {
      setNodes([]);
      setLoading(false);
      return;
    }

    void refreshFiles(selectedWorkspaceId);
  }, [selectedWorkspaceId]);

  async function handleStagedUpload(stagedFiles: StagedUploadFile[]) {
    if (!stagedFiles.length || !selectedWorkspaceId) return;

    setBusy(true);
    setError(null);

    const results: UploadResult[] = [];
    const zipFiles: StagedUploadFile[] = [];
    const datasetFiles: StagedUploadFile[] = [];

    for (const staged of stagedFiles) {
      const extension = extensionOf(staged.file.name);
      if (extension === '.zip') {
        zipFiles.push(staged);
      } else if (datasetExtensions.has(extension)) {
        datasetFiles.push(staged);
      } else {
        results.push({
          fileName: staged.relativePath,
          status: 'skipped',
          details: 'Not ingested. Supported in this flow: ZIP, CSV, XLSX, JSON, Parquet.',
        });
      }
    }

    for (const staged of zipFiles) {
      try {
        const outcome = await uploadWorkspaceZip(selectedWorkspaceId, staged.file);
        results.push({
          fileName: staged.relativePath,
          status: 'uploaded',
          details: `ZIP extracted (${outcome.extractedFiles} files, ${outcome.datasetCandidates} candidates).`,
        });
      } catch (err) {
        results.push({
          fileName: staged.relativePath,
          status: 'failed',
          details: err instanceof Error ? err.message : 'ZIP upload failed',
        });
      }
    }

    const hasRelativeFolders = datasetFiles.some((item) => item.relativePath.includes('/'));
    const shouldBundle = intakeMode === 'bundle' && datasetFiles.length > 0 && hasRelativeFolders;

    if (shouldBundle) {
      try {
        const relativePaths = datasetFiles.map((item) => item.relativePath);
        await uploadDatasetBundle(selectedWorkspaceId, {
          files: datasetFiles.map((item) => item.file),
          relativePaths,
          name: `${topFolderName(relativePaths)} Bundle`,
          visibility: 'WORKSPACE',
          autoRunPipeline: false,
        });

        const groupedByTopFolder = relativePaths.reduce<Record<string, number>>((acc, path) => {
          const key = topLevelGroup(path);
          acc[key] = (acc[key] ?? 0) + 1;
          return acc;
        }, {});

        Object.entries(groupedByTopFolder).forEach(([folder, count]) => {
          results.push({
            fileName: `${folder}/`,
            status: 'uploaded',
            details: `Folder bundle uploaded (${count} dataset file${count === 1 ? '' : 's'}).`,
          });
        });
      } catch (err) {
        results.push({
          fileName: 'Folder bundle',
          status: 'failed',
          details: err instanceof Error ? err.message : 'Folder upload failed',
        });
      }
    } else {
      for (const staged of datasetFiles) {
        try {
          await uploadDataset(selectedWorkspaceId, {
            file: staged.file,
            name: staged.file.name.replace(/\.[^.]+$/, ''),
            visibility: 'WORKSPACE',
            autoRunPipeline: false,
          });
          results.push({
            fileName: staged.relativePath,
            status: 'uploaded',
            details: 'Registered as raw dataset via workspace upload.',
          });
        } catch (err) {
          results.push({
            fileName: staged.relativePath,
            status: 'failed',
            details: err instanceof Error ? err.message : 'Upload failed',
          });
        }
      }
    }

    setUploadResults(results);
    await refreshFiles(selectedWorkspaceId);
    setBusy(false);
  }

  async function handleUpload(files: FileList | null) {
    if (!files?.length) return;
    const staged = Array.from(files).map((file) => ({ file, relativePath: normalizeRelativePath(file.name) }));
    await handleStagedUpload(staged);
  }

  async function handleFolderUpload(files: FileList | null) {
    if (!files?.length) return;
    const staged = Array.from(files).map((file) => {
      const withRelativePath = file as File & { webkitRelativePath?: string };
      return {
        file,
        relativePath: normalizeRelativePath(withRelativePath.webkitRelativePath || file.name),
      };
    });
    await handleStagedUpload(staged);
  }

  async function openDirectoryPicker() {
    const picker = (window as Window & { showDirectoryPicker?: () => Promise<DirectoryHandleLike> }).showDirectoryPicker;
    if (!picker) {
      folderInputRef.current?.click();
      return;
    }

    try {
      const handle = await picker();
      const staged = await collectDirectoryHandleFiles(handle, handle.name || 'folder');
      await handleStagedUpload(staged);
    } catch (err) {
      if (err instanceof Error && err.name === 'AbortError') {
        return;
      }
      setError(err instanceof Error ? err.message : 'Failed to read selected folder');
    }
  }

  async function handleDrop(event: React.DragEvent<HTMLDivElement>) {
    event.preventDefault();
    if (busy || !selectedWorkspaceId) return;

    try {
      const staged = await collectDropFiles(event.dataTransfer);
      await handleStagedUpload(staged);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to process dropped files/folders');
      setBusy(false);
    }
  }

  async function handleRegister(node: FlatNode) {
    if (!selectedWorkspaceId) return;
    setBusy(true);
    setError(null);
    try {
      await registerWorkspaceFileDataset(selectedWorkspaceId, node.id);
      await refreshFiles(selectedWorkspaceId);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to register dataset');
    } finally {
      setBusy(false);
    }
  }

  async function handleProfiling(node: FlatNode) {
    if (!selectedWorkspaceId) return;
    setBusy(true);
    setError(null);
    try {
      await sendWorkspaceFileToPreparation(selectedWorkspaceId, node.id, 'profiling');
      await refreshFiles(selectedWorkspaceId);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to send file to profiling');
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="space-y-6 p-6">
      <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <p className="inline-flex rounded-full bg-indigo-50 px-3 py-1 text-xs font-medium text-indigo-700">
              Workspace Intake Layer
            </p>
            <h1 className="mt-3 text-2xl font-bold text-slate-900">Raw File Library</h1>
            <p className="mt-1 max-w-3xl text-sm text-slate-600">
              Upload ZIP archives and dataset candidates (CSV, XLSX, JSON, Parquet), inspect workspace files, register
              datasets, and hand off to Data Profiling.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <select
              value={selectedWorkspaceId}
              onChange={(event) => setSelectedWorkspaceId(event.target.value)}
              className="h-10 rounded-xl border border-slate-300 bg-white px-3 text-sm"
              disabled={!workspaces.length || busy}
              aria-label="Select workspace"
              title="Select workspace"
            >
              {workspaces.length === 0 ? <option value="">No workspaces</option> : null}
              {workspaces.map((workspace) => (
                <option key={workspace.id} value={workspace.id}>
                  {workspace.name}
                </option>
              ))}
            </select>

            <Button
              variant="outline"
              onClick={() => selectedWorkspaceId && void refreshFiles(selectedWorkspaceId)}
              disabled={busy || !selectedWorkspaceId}
              className="rounded-xl"
            >
              <RefreshCcw className="mr-2 h-4 w-4" />
              Refresh
            </Button>

            <Button
              onClick={() => fileInputRef.current?.click()}
              disabled={busy || !selectedWorkspaceId}
              className="rounded-xl bg-slate-900 text-white hover:bg-slate-800"
            >
              {busy ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Upload className="mr-2 h-4 w-4" />}
              Upload Files
            </Button>

            <Button
              variant="outline"
              onClick={() => void openDirectoryPicker()}
              disabled={busy || !selectedWorkspaceId}
              className="rounded-xl"
            >
              <Folder className="mr-2 h-4 w-4" />
              Upload Folder
            </Button>

            <input
              ref={fileInputRef}
              type="file"
              multiple
              className="hidden"
              accept=".zip,.csv,.xlsx,.json,.parquet"
              aria-label="Upload workspace files"
              title="Upload workspace files"
              onChange={(event) => {
                void handleUpload(event.target.files);
                event.target.value = '';
              }}
            />

            <input
              ref={folderInputRef}
              type="file"
              multiple
              className="hidden"
              aria-label="Upload workspace folder"
              title="Upload workspace folder"
              onChange={(event) => {
                void handleFolderUpload(event.target.files);
                event.target.value = '';
              }}
              {...({ webkitdirectory: 'true', directory: 'true' } as Record<string, string>)}
            />
          </div>
        </div>

        {!workspaces.length ? (
          <div className="mt-4 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800">
            No workspaces available for your account. Create one in{' '}
            <Link href="/dashboard/workspaces" className="font-semibold underline">
              Workspaces
            </Link>
            .
          </div>
        ) : null}

        {error ? (
          <div className="mt-4 rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">{error}</div>
        ) : null}

        {uploadResults.length ? (
          <div className="mt-4 rounded-xl border border-slate-200 bg-slate-50 px-4 py-3">
            <div className="mb-2 flex items-center justify-between gap-3">
              <p className="text-sm font-semibold text-slate-800">Latest intake results</p>
              <p className="text-xs text-slate-500">Grouped by top-level folder for auditability</p>
            </div>

            <div className="space-y-3">
              {groupedUploadResults.map(({ group, results }) => (
                <div key={group} className="rounded-lg border border-slate-200 bg-white p-3">
                  <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">{group}</p>
                  <ul className="mt-2 space-y-1 text-sm text-slate-700">
                    {results.map((item, index) => (
                      <li key={`${group}-${item.fileName}-${index}`} className="flex items-start gap-2">
                        {uploadResultIcon(item.status)}
                        <span>
                          <span className="font-medium">{item.fileName}</span>: {item.details}
                        </span>
                      </li>
                    ))}
                  </ul>
                </div>
              ))}
            </div>
          </div>
        ) : null}
      </section>

      <section className="grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
        {[
          { icon: HardDrive, label: 'Total Files', value: stats.totalFiles, tone: 'text-indigo-600 bg-indigo-50' },
          { icon: Folder, label: 'Folders', value: stats.folders, tone: 'text-blue-600 bg-blue-50' },
          { icon: Archive, label: 'Archives', value: stats.archives, tone: 'text-fuchsia-600 bg-fuchsia-50' },
          { icon: Database, label: 'Dataset Candidates', value: stats.datasetCandidates, tone: 'text-emerald-600 bg-emerald-50' },
          { icon: CheckCircle2, label: 'Registered Datasets', value: stats.registeredDatasets, tone: 'text-violet-600 bg-violet-50' },
        ].map(({ icon: Icon, label, value, tone }) => (
          <div key={label} className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
            <div className={`inline-flex h-10 w-10 items-center justify-center rounded-xl ${tone}`}>
              <Icon className="h-5 w-5" />
            </div>
            <p className="mt-3 text-xs font-medium uppercase tracking-wide text-slate-500">{label}</p>
            <p className="mt-1 text-xl font-semibold text-slate-900">{value}</p>
          </div>
        ))}
      </section>

      <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
        <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
          <h2 className="text-lg font-semibold text-slate-900">Workspace File Explorer</h2>
          <label className="relative block w-full max-w-md">
            <Search className="pointer-events-none absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
            <input
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder="Search file name or path"
              className="h-10 w-full rounded-xl border border-slate-300 pl-9 pr-3 text-sm"
            />
          </label>

          <div className="inline-flex rounded-xl border border-slate-300 bg-white p-1 text-xs">
            <button
              type="button"
              onClick={() => setIntakeMode('single')}
              className={`rounded-lg px-3 py-1.5 transition ${
                intakeMode === 'single' ? 'bg-slate-900 text-white' : 'text-slate-600 hover:bg-slate-100'
              }`}
            >
              Single Files
            </button>
            <button
              type="button"
              onClick={() => setIntakeMode('bundle')}
              className={`rounded-lg px-3 py-1.5 transition ${
                intakeMode === 'bundle' ? 'bg-slate-900 text-white' : 'text-slate-600 hover:bg-slate-100'
              }`}
            >
              Folder Bundle
            </button>
          </div>
        </div>

        <div className="overflow-hidden rounded-xl border border-slate-200">
          <div
            onDragOver={(event) => event.preventDefault()}
            onDrop={(event) => void handleDrop(event)}
            className="border-b border-slate-200 bg-slate-50 px-3 py-3 text-xs text-slate-600"
          >
            Drop files or folders here. Intake mode: <span className="font-semibold">{intakeMode === 'single' ? 'Single Files' : 'Folder Bundle'}</span>.
          </div>
          <table className="w-full text-left text-sm">
            <thead className="bg-slate-50 text-slate-500">
              <tr>
                <th className="px-3 py-2">Asset</th>
                <th className="px-3 py-2">Type</th>
                <th className="px-3 py-2">Size</th>
                <th className="px-3 py-2">Dataset</th>
                <th className="px-3 py-2 text-right">Actions</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={5} className="px-3 py-8 text-center text-slate-500">
                    Loading workspace files...
                  </td>
                </tr>
              ) : filteredNodes.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-3 py-8 text-center text-slate-500">
                    No files found in this workspace.
                  </td>
                </tr>
              ) : (
                filteredNodes.map((node) => (
                  <tr key={node.id} className="border-t border-slate-100">
                    <td className="px-3 py-2">
                      <div className={`flex items-center gap-2 ${indentClass(node.depth)}`}>
                        {iconForNode(node)}
                        <div className="min-w-0">
                          <p className="truncate font-medium text-slate-900">{node.name}</p>
                          <p className="truncate text-xs text-slate-500">{node.relativePath}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-3 py-2 text-xs uppercase text-slate-600">{node.kind}</td>
                    <td className="px-3 py-2 text-slate-600">{formatBytes(node.sizeBytes)}</td>
                    <td className="px-3 py-2 text-slate-600">
                      {node.datasetId ? 'Registered' : node.isDatasetCandidate ? 'Candidate' : 'Not eligible'}
                    </td>
                    <td className="px-3 py-2">
                      <div className="flex justify-end gap-2">
                        {node.isDatasetCandidate && !node.datasetId ? (
                          <Button
                            variant="outline"
                            size="sm"
                            disabled={busy}
                            onClick={() => void handleRegister(node)}
                            className="h-8 rounded-lg"
                          >
                            <Database className="mr-1 h-3.5 w-3.5" />
                            Register
                          </Button>
                        ) : null}

                        {node.datasetId ? (
                          <Button
                            size="sm"
                            disabled={busy}
                            onClick={() => void handleProfiling(node)}
                            className="h-8 rounded-lg bg-slate-900 text-white hover:bg-slate-800"
                          >
                            <Wand2 className="mr-1 h-3.5 w-3.5" />
                            To Profiling
                          </Button>
                        ) : null}
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        <p className="mt-3 text-xs text-slate-500">
          ZIP uploads are extracted into this explorer. Folder uploads and dropped folders preserve relative paths via
          bundle upload. CSV/XLSX/JSON/Parquet files uploaded here are directly registered as raw datasets and available in{' '}
          <Link href="/dashboard/datasets?view=raw" className="font-medium text-indigo-700 hover:text-indigo-600">
            Dataset Registry
          </Link>
          .
        </p>
      </section>
    </div>
  );
}
