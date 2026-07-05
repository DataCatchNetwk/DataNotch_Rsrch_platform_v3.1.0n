"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useEffect, useMemo, useRef, useState } from "react";
import {
  Archive,
  FolderKanban,
  Folder,
  File,
  FileSpreadsheet,
  Plus,
  RefreshCcw,
  Search,
  Users,
  Database,
  BarChart3,
  FileText,
  ArrowRight,
  Loader2,
  Upload,
  Wand2,
} from "lucide-react";

import { createWorkspace, getMyWorkspaces, type Workspace, uploadDataset, uploadDatasetBundle } from "@/src/lib/api/workspaces";
import {
  fetchWorkspaceFiles,
  registerWorkspaceFileDataset,
  sendWorkspaceFileToPreparation,
  uploadWorkspaceZip,
  type WorkspaceFileNode,
} from "@/src/lib/api/workspaceZip";
import { WorkspaceRoleBadge } from "@/components/workspaces/workspace-badges";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { CreateWorkspaceDialog } from "@/components/workspaces/create-workspace-dialog";
import { ResearchLifecycleStagePage } from "@/components/research/research-lifecycle-stage-page";
import { getLifecyclePageFromSearch } from "@/src/config/research-lifecycle-pages";

type IntakeMode = "single" | "bundle";

type IntakeUploadResult = {
  fileName: string;
  status: "uploaded" | "skipped" | "failed";
  details: string;
};

type StagedUploadFile = {
  file: File;
  relativePath: string;
};

const datasetExtensions = new Set([".csv", ".xlsx", ".json", ".parquet"]);

function normalizeRelativePath(path: string): string {
  const cleaned = path.replaceAll("\\", "/").replace(/^\/+/, "");
  return cleaned || "unnamed";
}

function extensionOf(name: string): string {
  if (!name.includes(".")) return "";
  return `.${name.split(".").pop()?.toLowerCase()}`;
}

function topFolderName(relativePaths: string[]): string {
  const first = relativePaths.find((path) => path.includes("/"));
  if (!first) return "workspace-folder-bundle";
  return first.split("/")[0] || "workspace-folder-bundle";
}

function topLevelGroup(path: string): string {
  const normalized = normalizeRelativePath(path);
  if (!normalized.includes("/")) {
    return "Ungrouped Files";
  }

  return normalized.split("/")[0] || "Ungrouped Files";
}

function flattenNodes(nodes: WorkspaceFileNode[], depth = 0): Array<WorkspaceFileNode & { depth: number }> {
  return nodes.flatMap((node) => [{ ...node, depth }, ...flattenNodes(node.children, depth + 1)]);
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

function entryFile(entry: FileSystemEntryLike): Promise<File> {
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
    if (!batch.length) break;
    all.push(...batch);
  }
  return all;
}

async function collectFromEntry(entry: FileSystemEntryLike, basePath = ""): Promise<StagedUploadFile[]> {
  const currentPath = basePath ? `${basePath}/${entry.name}` : entry.name;
  if (entry.isFile) {
    const file = await entryFile(entry);
    return [{ file, relativePath: normalizeRelativePath(currentPath) }];
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
  const canTraverse = items.some((item) => typeof (item as DataTransferItem & { webkitGetAsEntry?: () => FileSystemEntryLike | null }).webkitGetAsEntry === "function");
  if (canTraverse) {
    const entries = items
      .map((item) => (item as DataTransferItem & { webkitGetAsEntry?: () => FileSystemEntryLike | null }).webkitGetAsEntry())
      .filter((entry): entry is FileSystemEntryLike => !!entry);
    const nested = await Promise.all(entries.map((entry) => collectFromEntry(entry)));
    return nested.flat();
  }
  return Array.from(dataTransfer.files).map((file) => ({
    file,
    relativePath: normalizeRelativePath((file as File & { webkitRelativePath?: string }).webkitRelativePath || file.name),
  }));
}

export default function WorkspacesPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [items, setItems] = useState<Workspace[]>([]);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [query, setQuery] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [intakeMode, setIntakeMode] = useState<IntakeMode>("single");
  const [intakeBusy, setIntakeBusy] = useState(false);
  const [intakeEvent, setIntakeEvent] = useState("Ready for workspace intake.");
  const [intakeFiles, setIntakeFiles] = useState<WorkspaceFileNode[]>([]);
  const [intakeResults, setIntakeResults] = useState<IntakeUploadResult[]>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const folderInputRef = useRef<HTMLInputElement>(null);
  const [openCreate, setOpenCreate] = useState(false);
  const [selectedWorkspaceId, setSelectedWorkspaceId] = useState("");
  const lifecyclePage = getLifecyclePageFromSearch(searchParams);

  async function load() {
    setLoading(true);
    setError(null);
    try {
      const data = await getMyWorkspaces();
      setItems(data);
      if (!selectedWorkspaceId && data.length) {
        setSelectedWorkspaceId(data[0].id);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load workspaces");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    void load();
  }, []);

  async function handleCreateWorkspace(payload: { name: string; description?: string }) {
    setBusy(true);
    setError(null);
    try {
      const created = await createWorkspace(payload);
      setItems((prev) => [created, ...prev]);
      setSelectedWorkspaceId(created.id);
      setOpenCreate(false);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to create workspace");
      throw err;
    } finally {
      setBusy(false);
    }
  }

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return items;

    return items.filter((workspace) => {
      return (
        workspace.name.toLowerCase().includes(q) ||
        (workspace.description ?? "").toLowerCase().includes(q) ||
        workspace.owner.email.toLowerCase().includes(q) ||
        (workspace.owner.name ?? "").toLowerCase().includes(q) ||
        workspace.currentUserRole.toLowerCase().includes(q)
      );
    });
  }, [items, query]);

  const selectedWorkspace = useMemo(() => {
    if (!filtered.length) return null;
    return filtered.find((workspace) => workspace.id === selectedWorkspaceId) ?? filtered[0];
  }, [filtered, selectedWorkspaceId]);

  useEffect(() => {
    if (!filtered.length) return;
    const exists = filtered.some((workspace) => workspace.id === selectedWorkspaceId);
    if (!exists) {
      setSelectedWorkspaceId(filtered[0].id);
    }
  }, [filtered, selectedWorkspaceId]);

  const handoffTargets = [
    { id: "projects", label: "Projects", href: "/dashboard/projects" },
    { id: "tasks", label: "Tasks", href: "/dashboard/tasks" },
    { id: "runtime", label: "Runtime Monitoring", href: "/dashboard/monitoring/pipelines" },
    { id: "data-management", label: "Data Management", href: "/dashboard/data-sources" },
    { id: "data-preparation", label: "Data Preparation", href: "/dashboard/data-preparation/profiling" },
    { id: "research-studio", label: "Research Studio", href: "/dashboard/requests" },
    { id: "analytics-ai", label: "Analytics & AI", href: "/dashboard/analysis/jobs" },
    { id: "outputs", label: "Outputs", href: "/dashboard/results" },
    { id: "governance", label: "Governance", href: "/dashboard/access" },
    { id: "system", label: "System", href: "/dashboard/settings" },
  ] as const;

  function handoffWorkspace(href: string) {
    if (!selectedWorkspace) return;
    const separator = href.includes("?") ? "&" : "?";
    router.push(`${href}${separator}workspaceId=${encodeURIComponent(selectedWorkspace.id)}`);
  }

  const flattenedIntakeFiles = useMemo(() => flattenNodes(intakeFiles), [intakeFiles]);
  const datasetCandidates = useMemo(
    () => flattenedIntakeFiles.filter((node) => node.isDatasetCandidate),
    [flattenedIntakeFiles],
  );

  const groupedIntakeResults = useMemo(() => {
    const groups = new Map<string, IntakeUploadResult[]>();
    for (const result of intakeResults) {
      const key = topLevelGroup(result.fileName);
      if (!groups.has(key)) {
        groups.set(key, []);
      }
      groups.get(key)?.push(result);
    }

    return Array.from(groups.entries()).map(([group, results]) => ({ group, results }));
  }, [intakeResults]);

  async function refreshIntakeFiles(workspaceId?: string) {
    const target = workspaceId || selectedWorkspace?.id;
    if (!target) return;
    try {
      const tree = await fetchWorkspaceFiles(target);
      setIntakeFiles(tree);
    } catch {
      setIntakeFiles([]);
    }
  }

  useEffect(() => {
    if (selectedWorkspace?.id) {
      void refreshIntakeFiles(selectedWorkspace.id);
    }
  }, [selectedWorkspace?.id]);

  async function handleStagedUpload(stagedFiles: StagedUploadFile[]) {
    if (!selectedWorkspace?.id || !stagedFiles.length) return;

    setIntakeBusy(true);
    setError(null);

    const results: IntakeUploadResult[] = [];
    const zipFiles: StagedUploadFile[] = [];
    const datasetFiles: StagedUploadFile[] = [];

    for (const staged of stagedFiles) {
      const extension = extensionOf(staged.file.name);
      if (extension === ".zip") {
        zipFiles.push(staged);
      } else if (datasetExtensions.has(extension)) {
        datasetFiles.push(staged);
      } else {
        results.push({
          fileName: staged.relativePath,
          status: "skipped",
          details: "Unsupported in intake flow. Allowed: ZIP, CSV, XLSX, JSON, Parquet.",
        });
      }
    }

    for (const staged of zipFiles) {
      try {
        const outcome = await uploadWorkspaceZip(selectedWorkspace.id, staged.file);
        results.push({
          fileName: staged.relativePath,
          status: "uploaded",
          details: `ZIP extracted (${outcome.extractedFiles} files, ${outcome.datasetCandidates} candidates).`,
        });
      } catch (err) {
        results.push({
          fileName: staged.relativePath,
          status: "failed",
          details: err instanceof Error ? err.message : "ZIP upload failed",
        });
      }
    }

    const hasRelativeFolders = datasetFiles.some((item) => item.relativePath.includes("/"));
    const shouldBundle = intakeMode === "bundle" && datasetFiles.length > 0 && hasRelativeFolders;

    if (shouldBundle) {
      try {
        const relativePaths = datasetFiles.map((item) => item.relativePath);
        await uploadDatasetBundle(selectedWorkspace.id, {
          files: datasetFiles.map((item) => item.file),
          relativePaths,
          name: `${topFolderName(relativePaths)} Bundle`,
          visibility: "WORKSPACE",
          autoRunPipeline: false,
        });
        results.push({
          fileName: `${topFolderName(relativePaths)}/`,
          status: "uploaded",
          details: `Folder bundle uploaded (${datasetFiles.length} dataset files).`,
        });
      } catch (err) {
        results.push({
          fileName: "Folder bundle",
          status: "failed",
          details: err instanceof Error ? err.message : "Folder upload failed",
        });
      }
    } else {
      for (const staged of datasetFiles) {
        try {
          await uploadDataset(selectedWorkspace.id, {
            file: staged.file,
            name: staged.file.name.replace(/\.[^.]+$/, ""),
            visibility: "WORKSPACE",
            autoRunPipeline: false,
          });
          results.push({
            fileName: staged.relativePath,
            status: "uploaded",
            details: "Registered as raw dataset via workspace upload.",
          });
        } catch (err) {
          results.push({
            fileName: staged.relativePath,
            status: "failed",
            details: err instanceof Error ? err.message : "Upload failed",
          });
        }
      }
    }

    setIntakeResults(results);
    setIntakeEvent(`Intake completed: ${results.filter((item) => item.status === "uploaded").length} uploaded.`);
    await refreshIntakeFiles(selectedWorkspace.id);
    setIntakeBusy(false);
  }

  async function handleUploadFiles(files: FileList | null) {
    if (!files?.length) return;
    const staged = Array.from(files).map((file) => ({ file, relativePath: normalizeRelativePath(file.name) }));
    await handleStagedUpload(staged);
  }

  async function handleUploadFolder(files: FileList | null) {
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

  async function handleDrop(event: React.DragEvent<HTMLDivElement>) {
    event.preventDefault();
    if (!selectedWorkspace?.id || intakeBusy) return;
    try {
      const staged = await collectDropFiles(event.dataTransfer);
      await handleStagedUpload(staged);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to process dropped files/folders");
      setIntakeBusy(false);
    }
  }

  async function registerCandidate(fileId: string) {
    if (!selectedWorkspace?.id) return;
    setIntakeBusy(true);
    try {
      await registerWorkspaceFileDataset(selectedWorkspace.id, fileId);
      setIntakeEvent("Dataset registered from candidate.");
      await refreshIntakeFiles(selectedWorkspace.id);
    } finally {
      setIntakeBusy(false);
    }
  }

  async function sendCandidateToProfiling(fileId: string) {
    if (!selectedWorkspace?.id) return;
    setIntakeBusy(true);
    try {
      await sendWorkspaceFileToPreparation(selectedWorkspace.id, fileId, "profiling");
      setIntakeEvent("Candidate sent to Data Profiling.");
      await refreshIntakeFiles(selectedWorkspace.id);
    } finally {
      setIntakeBusy(false);
    }
  }

  const totals = useMemo(() => {
    return items.reduce(
      (acc, workspace) => {
        acc.workspaces += 1;
        acc.members += workspace._count?.members ?? 0;
        acc.datasets += workspace._count?.datasets ?? 0;
        acc.analysis += workspace._count?.analysisJobs ?? 0;
        acc.reports += workspace._count?.reports ?? 0;
        return acc;
      },
      {
        workspaces: 0,
        members: 0,
        datasets: 0,
        analysis: 0,
        reports: 0,
      },
    );
  }, [items]);

  if (lifecyclePage) {
    return <ResearchLifecycleStagePage config={lifecyclePage} />;
  }

  return (
    <div className="min-h-screen bg-slate-50">
      <div className="mx-auto max-w-7xl px-6 py-8">
        <div className="space-y-8">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
            <div>
              <h1 className="text-3xl font-bold tracking-tight text-slate-900">Workspaces</h1>
              <p className="mt-1 text-sm text-slate-600">
                Manage collaborative research environments, datasets, analysis, and reports.
              </p>
            </div>

            <div className="flex flex-wrap gap-2">
              <Button
                variant="outline"
                onClick={() => void load()}
                className="rounded-xl border-slate-200 bg-white text-slate-700"
              >
                <RefreshCcw className="mr-2 h-4 w-4" />
                Refresh
              </Button>

              <Button
                onClick={() => setOpenCreate(true)}
                className="rounded-xl bg-linear-to-r from-indigo-500 to-violet-600 text-white"
              >
                <Plus className="mr-2 h-4 w-4" />
                Create Workspace
              </Button>
            </div>
          </div>

          {error ? (
            <Card className="rounded-2xl border-rose-200 bg-rose-50 shadow-sm">
              <CardContent className="p-4 text-sm text-rose-700">{error}</CardContent>
            </Card>
          ) : null}

          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-5">
            <StatCard
              label="Workspaces"
              value={String(totals.workspaces)}
              icon={<FolderKanban className="h-5 w-5" />}
            />
            <StatCard
              label="Members"
              value={String(totals.members)}
              icon={<Users className="h-5 w-5" />}
            />
            <StatCard
              label="Datasets"
              value={String(totals.datasets)}
              icon={<Database className="h-5 w-5" />}
            />
            <StatCard
              label="Analysis Jobs"
              value={String(totals.analysis)}
              icon={<BarChart3 className="h-5 w-5" />}
            />
            <StatCard
              label="Reports"
              value={String(totals.reports)}
              icon={<FileText className="h-5 w-5" />}
            />
          </div>

          <Card className="rounded-2xl border-slate-200 bg-white shadow-sm">
            <CardContent className="p-5">
              <div className="relative w-full max-w-xl">
                <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                <Input
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  placeholder="Search workspaces by name, description, owner, or role..."
                  className="h-11 rounded-xl border-slate-200 bg-slate-50 pl-10"
                />
              </div>
            </CardContent>
          </Card>

          <Card className="rounded-2xl border-slate-200 bg-white shadow-sm">
            <CardContent className="p-5">
              <div className="mb-4 flex flex-wrap items-start justify-between gap-3">
                <div>
                  <p className="text-xs font-semibold uppercase tracking-wider text-slate-500">Workspace Intake Console</p>
                  <h2 className="text-lg font-semibold text-slate-900">Intake Command Center</h2>
                  <p className="text-sm text-slate-600">
                    Upload ZIP/folder/data files, detect dataset candidates, register datasets, and hand off to profiling.
                  </p>
                </div>

                <div className="inline-flex rounded-xl border border-slate-300 bg-white p-1 text-xs">
                  <button
                    type="button"
                    onClick={() => setIntakeMode("single")}
                    className={`rounded-lg px-3 py-1.5 transition ${
                      intakeMode === "single" ? "bg-slate-900 text-white" : "text-slate-600 hover:bg-slate-100"
                    }`}
                  >
                    Single Files
                  </button>
                  <button
                    type="button"
                    onClick={() => setIntakeMode("bundle")}
                    className={`rounded-lg px-3 py-1.5 transition ${
                      intakeMode === "bundle" ? "bg-slate-900 text-white" : "text-slate-600 hover:bg-slate-100"
                    }`}
                  >
                    Folder Bundle
                  </button>
                </div>
              </div>

              <div className="flex flex-wrap gap-2">
                <Button
                  onClick={() => fileInputRef.current?.click()}
                  disabled={!selectedWorkspace || intakeBusy}
                  className="rounded-xl bg-slate-900 text-white"
                >
                  {intakeBusy ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Upload className="mr-2 h-4 w-4" />}
                  Upload Files
                </Button>

                <Button
                  variant="outline"
                  onClick={() => folderInputRef.current?.click()}
                  disabled={!selectedWorkspace || intakeBusy}
                  className="rounded-xl border-slate-200"
                >
                  <Folder className="mr-2 h-4 w-4" />
                  Upload Folder
                </Button>

                <Button
                  variant="outline"
                  onClick={() => selectedWorkspace && void refreshIntakeFiles(selectedWorkspace.id)}
                  disabled={!selectedWorkspace || intakeBusy}
                  className="rounded-xl border-slate-200"
                >
                  <RefreshCcw className="mr-2 h-4 w-4" />
                  Refresh Intake
                </Button>

                <Button
                  variant="outline"
                  onClick={() => selectedWorkspace && router.push(`/dashboard/projects?workspaceId=${encodeURIComponent(selectedWorkspace.id)}`)}
                  disabled={!selectedWorkspace}
                  className="rounded-xl border-slate-200"
                >
                  Create Project
                </Button>

                <Button
                  variant="outline"
                  onClick={() => selectedWorkspace && router.push(`/dashboard/tasks?workspaceId=${encodeURIComponent(selectedWorkspace.id)}`)}
                  disabled={!selectedWorkspace}
                  className="rounded-xl border-slate-200"
                >
                  Create Task
                </Button>

                <Button
                  variant="outline"
                  onClick={() => selectedWorkspace && router.push(`/dashboard/workspaces/${selectedWorkspace.id}?tab=members`)}
                  disabled={!selectedWorkspace}
                  className="rounded-xl border-slate-200"
                >
                  Assign Team
                </Button>

                <Button
                  variant="outline"
                  onClick={() => selectedWorkspace && router.push(`/dashboard/files?workspaceId=${encodeURIComponent(selectedWorkspace.id)}`)}
                  disabled={!selectedWorkspace}
                  className="rounded-xl border-slate-200"
                >
                  Open Raw File Library
                </Button>
              </div>

              <input
                ref={fileInputRef}
                type="file"
                multiple
                className="hidden"
                accept=".zip,.csv,.xlsx,.json,.parquet"
                aria-label="Upload workspace files"
                title="Upload workspace files"
                onChange={(event) => {
                  void handleUploadFiles(event.target.files);
                  event.target.value = "";
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
                  void handleUploadFolder(event.target.files);
                  event.target.value = "";
                }}
                {...({ webkitdirectory: "true", directory: "true" } as Record<string, string>)}
              />

              <div
                onDragOver={(event) => event.preventDefault()}
                onDrop={(event) => void handleDrop(event)}
                className="mt-4 rounded-xl border border-dashed border-slate-300 bg-slate-50 px-4 py-5 text-sm text-slate-600"
              >
                Drop files or folders here. Intake mode: <span className="font-semibold">{intakeMode === "single" ? "Single Files" : "Folder Bundle"}</span>.
              </div>

              {intakeResults.length ? (
                <div className="mt-4 rounded-xl border border-slate-200 bg-slate-50 p-3 text-sm text-slate-700">
                  <div className="mb-2 flex items-center justify-between gap-2">
                    <p className="font-semibold text-slate-800">Latest Intake Results</p>
                    <p className="text-xs text-slate-500">Grouped by top-level folder</p>
                  </div>
                  <div className="space-y-2">
                    {groupedIntakeResults.map(({ group, results }) => {
                      const uploaded = results.filter((item) => item.status === "uploaded").length;
                      const skipped = results.filter((item) => item.status === "skipped").length;
                      const failed = results.filter((item) => item.status === "failed").length;

                      return (
                        <div key={group} className="rounded-lg border border-slate-200 bg-white p-2.5">
                          <div className="flex items-center justify-between gap-2">
                            <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">{group}</p>
                            <p className="text-xs text-slate-500">
                              {uploaded} uploaded · {skipped} skipped · {failed} failed
                            </p>
                          </div>
                          <ul className="mt-1.5 space-y-1">
                            {results.slice(0, 4).map((item, index) => (
                              <li key={`${group}-${item.fileName}-${index}`} className="text-xs text-slate-700">
                                <span className="font-medium">{item.fileName}</span>: {item.details}
                              </li>
                            ))}
                          </ul>
                        </div>
                      );
                    })}
                  </div>
                </div>
              ) : null}

              <div className="mt-4 grid gap-4 xl:grid-cols-3">
                <div className="rounded-xl border border-slate-200 p-3 xl:col-span-1">
                  <p className="mb-2 text-sm font-semibold text-slate-900">Workspace File Explorer</p>
                  <div className="space-y-2 text-sm">
                    {flattenedIntakeFiles.length === 0 ? (
                      <p className="text-slate-500">No files indexed for this workspace yet.</p>
                    ) : (
                      flattenedIntakeFiles.slice(0, 10).map((node) => (
                        <div key={node.id} className="flex items-center gap-2 rounded-lg border border-slate-100 px-2 py-1.5">
                          {node.kind === "FOLDER" ? <Folder className="h-4 w-4 text-blue-600" /> : <File className="h-4 w-4 text-slate-600" />}
                          <span className="truncate text-slate-700">{node.relativePath}</span>
                        </div>
                      ))
                    )}
                  </div>
                </div>

                <div className="rounded-xl border border-slate-200 p-3 xl:col-span-1">
                  <p className="mb-2 text-sm font-semibold text-slate-900">Detected Dataset Candidates</p>
                  <div className="space-y-2 text-sm">
                    {datasetCandidates.length === 0 ? (
                      <p className="text-slate-500">Dataset candidates appear after intake detection.</p>
                    ) : (
                      datasetCandidates.slice(0, 8).map((candidate) => (
                        <div key={candidate.id} className="rounded-lg border border-slate-100 p-2">
                          <p className="truncate font-medium text-slate-900">{candidate.name}</p>
                          <p className="truncate text-xs text-slate-500">{candidate.relativePath}</p>
                          <div className="mt-2 flex flex-wrap gap-2">
                            {!candidate.datasetId ? (
                              <Button
                                variant="outline"
                                className="h-8 rounded-lg border-slate-200"
                                onClick={() => void registerCandidate(candidate.id)}
                                disabled={intakeBusy}
                              >
                                <Database className="mr-1 h-3.5 w-3.5" />
                                Register
                              </Button>
                            ) : (
                              <Button
                                className="h-8 rounded-lg bg-slate-900 text-white"
                                onClick={() => void sendCandidateToProfiling(candidate.id)}
                                disabled={intakeBusy}
                              >
                                <Wand2 className="mr-1 h-3.5 w-3.5" />
                                To Profiling
                              </Button>
                            )}
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                </div>

                <div className="rounded-xl border border-slate-200 p-3 xl:col-span-1">
                  <p className="mb-2 text-sm font-semibold text-slate-900">Pipeline Handoff</p>
                  <div className="space-y-2">
                    {[
                      { label: "Data Management", href: "/dashboard/files" },
                      { label: "Dataset Registry", href: "/dashboard/datasets?view=raw" },
                      { label: "Data Preparation", href: "/dashboard/data-preparation/profiling" },
                    ].map((step) => (
                      <Button
                        key={step.href}
                        variant="outline"
                        className="w-full justify-between rounded-lg border-slate-200"
                        onClick={() => selectedWorkspace && handoffWorkspace(`${step.href}`)}
                        disabled={!selectedWorkspace}
                      >
                        <span>{step.label}</span>
                        <ArrowRight className="h-4 w-4" />
                      </Button>
                    ))}
                  </div>

                  <div className="mt-3 rounded-lg bg-slate-50 p-2 text-xs text-slate-600">
                    Latest event: {intakeEvent}
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="rounded-2xl border-slate-200 bg-white shadow-sm">
            <CardContent className="p-5">
              <div className="grid gap-5 lg:grid-cols-[1.4fr_1fr]">
                <div className="space-y-3">
                  <p className="text-xs font-semibold uppercase tracking-wider text-slate-500">Workspace Operations</p>
                  <h2 className="text-lg font-semibold text-slate-900">Operational Handoff</h2>
                  <p className="text-sm text-slate-600">
                    Use a selected workspace as the command center and hand off work directly into each research stage.
                  </p>
                  <div className="rounded-xl border border-slate-200 bg-slate-50 p-3">
                    <p className="text-xs text-slate-500">Selected Workspace</p>
                    <p className="text-sm font-semibold text-slate-900">{selectedWorkspace?.name ?? "None selected"}</p>
                    <p className="text-xs text-slate-500">
                      {selectedWorkspace
                        ? `Owner: ${selectedWorkspace.owner.name || selectedWorkspace.owner.email}`
                        : "Select a workspace from the list below to enable handoff."}
                    </p>
                  </div>
                </div>
                <div className="grid gap-2 sm:grid-cols-2">
                  {handoffTargets.map((target) => (
                    <Button
                      key={target.id}
                      variant="outline"
                      className="justify-between rounded-xl border-slate-200 bg-white"
                      onClick={() => handoffWorkspace(target.href)}
                      disabled={!selectedWorkspace}
                    >
                      <span>{target.label}</span>
                      <ArrowRight className="h-4 w-4" />
                    </Button>
                  ))}
                </div>
              </div>
            </CardContent>
          </Card>

          <div className="grid gap-5">
            {loading ? (
              <EmptyCard label="Loading workspaces..." />
            ) : filtered.length === 0 ? (
              <EmptyCard label="No workspaces found." />
            ) : (
              filtered.map((workspace) => (
                <Card
                  key={workspace.id}
                  className={`rounded-2xl border-slate-200 bg-white shadow-sm transition hover:-translate-y-0.5 hover:shadow-md ${selectedWorkspace?.id === workspace.id ? "ring-2 ring-indigo-400" : ""}`}
                >
                  <CardContent className="p-6">
                    <div className="flex flex-col gap-5 xl:flex-row xl:items-start xl:justify-between">
                      <div className="space-y-3">
                        <div className="flex flex-wrap items-center gap-2">
                          <h2 className="text-lg font-semibold text-slate-900">{workspace.name}</h2>
                          <WorkspaceRoleBadge role={workspace.currentUserRole} />
                          <StatusBadge status={workspace.status} />
                          <BadgePill label={workspace.status === "ACTIVE" ? "Live" : "Archived"} />
                        </div>

                        <p className="max-w-4xl text-sm leading-6 text-slate-600">
                          {workspace.description || "No workspace description provided."}
                        </p>

                        <div className="flex flex-wrap gap-4 text-xs text-slate-500">
                          <span>Owner: {workspace.owner.name || workspace.owner.email}</span>
                          <span>Members: {workspace._count?.members ?? 0}</span>
                          <span>Datasets: {workspace._count?.datasets ?? 0}</span>
                          <span>Analysis Jobs: {workspace._count?.analysisJobs ?? 0}</span>
                          <span>Reports: {workspace._count?.reports ?? 0}</span>
                          <span>Updated: {new Date(workspace.updatedAt).toLocaleString()}</span>
                        </div>
                      </div>

                      <div className="flex flex-wrap gap-2">
                        <Button
                          variant="outline"
                          className="rounded-xl border-slate-200"
                          onClick={() => setSelectedWorkspaceId(workspace.id)}
                        >
                          {selectedWorkspace?.id === workspace.id ? "Selected" : "Select"}
                        </Button>
                        <QuickCounter
                          icon={<Users className="h-4 w-4" />}
                          label={String(workspace._count?.members ?? 0)}
                        />
                        <QuickCounter
                          icon={<Database className="h-4 w-4" />}
                          label={String(workspace._count?.datasets ?? 0)}
                        />
                        <QuickCounter
                          icon={<BarChart3 className="h-4 w-4" />}
                          label={String(workspace._count?.analysisJobs ?? 0)}
                        />
                        <QuickCounter
                          icon={<FileText className="h-4 w-4" />}
                          label={String(workspace._count?.reports ?? 0)}
                        />

                        <Button asChild className="rounded-xl bg-linear-to-r from-indigo-500 to-violet-600 text-white">
                          <Link href={`/dashboard/workspaces/${workspace.id}`}>
                            Open Workspace
                            <ArrowRight className="ml-2 h-4 w-4" />
                          </Link>
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))
            )}
          </div>
        </div>
      </div>

      <CreateWorkspaceDialog
        open={openCreate}
        onOpenChange={setOpenCreate}
        onSubmit={handleCreateWorkspace}
        busy={busy}
      />
    </div>
  );
}

function StatCard({
  label,
  value,
  icon,
}: {
  label: string;
  value: string;
  icon: React.ReactNode;
}) {
  return (
    <Card className="rounded-2xl border-slate-200 bg-white shadow-sm">
      <CardContent className="flex items-start justify-between p-5">
        <div>
          <p className="text-sm text-slate-500">{label}</p>
          <p className="mt-2 text-2xl font-bold text-slate-900">{value}</p>
        </div>
        <div className="rounded-xl bg-violet-100 p-3 text-violet-700">{icon}</div>
      </CardContent>
    </Card>
  );
}

function EmptyCard({ label }: { label: string }) {
  return (
    <Card className="rounded-2xl border-slate-200 bg-white shadow-sm">
      <CardContent className="p-6 text-sm text-slate-500">{label}</CardContent>
    </Card>
  );
}

function StatusBadge({ status }: { status: string }) {
  const className =
    status === "ACTIVE"
      ? "rounded-full border-emerald-200 bg-emerald-50 text-emerald-700"
      : "rounded-full border-amber-200 bg-amber-50 text-amber-700";

  return (
    <span className={`inline-flex items-center rounded-full border px-2.5 py-1 text-xs font-medium ${className}`}>
      {status}
    </span>
  );
}

function BadgePill({ label }: { label: string }) {
  return (
    <span className="inline-flex items-center rounded-full border border-slate-200 bg-slate-50 px-2.5 py-1 text-xs font-medium text-slate-600">
      {label}
    </span>
  );
}

function QuickCounter({
  icon,
  label,
}: {
  icon: React.ReactNode;
  label: string;
}) {
  return (
    <div className="flex h-10 items-center gap-2 rounded-xl border border-slate-200 bg-slate-50 px-3 text-sm text-slate-700">
      {icon}
      {label}
    </div>
  );
}
