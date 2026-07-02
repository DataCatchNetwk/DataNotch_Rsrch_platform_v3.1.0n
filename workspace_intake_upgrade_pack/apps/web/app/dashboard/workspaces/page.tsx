"use client";

import React, { useEffect, useMemo, useState } from "react";
import {
  Archive,
  ArrowRight,
  BarChart3,
  Database,
  File,
  FileSpreadsheet,
  Folder,
  FolderOpen,
  GitBranch,
  Loader2,
  Plus,
  RefreshCw,
  Search,
  Upload,
  Users,
  Workflow,
} from "lucide-react";
import {
  DatasetCandidate,
  WorkspaceCard,
  WorkspaceFile,
  WorkspaceSummary,
  workspaceIntakeApi,
} from "@/lib/api/workspace-intake";

function Card({ children, className = "" }: { children: React.ReactNode; className?: string }) {
  return <div className={`rounded-2xl border border-slate-200 bg-white shadow-sm ${className}`}>{children}</div>;
}

function Button({
  children,
  onClick,
  variant = "dark",
  disabled,
}: {
  children: React.ReactNode;
  onClick?: () => void;
  variant?: "dark" | "purple" | "ghost";
  disabled?: boolean;
}) {
  const cls =
    variant === "purple"
      ? "bg-violet-600 text-white hover:bg-violet-700"
      : variant === "ghost"
      ? "bg-white border border-slate-200 hover:bg-slate-50"
      : "bg-slate-950 text-white hover:bg-slate-800";

  return (
    <button
      disabled={disabled}
      onClick={onClick}
      className={`inline-flex items-center justify-center gap-2 rounded-xl px-4 py-2 text-sm font-medium transition disabled:opacity-50 ${cls}`}
    >
      {children}
    </button>
  );
}

function Kpi({ label, value, icon }: { label: string; value: string | number; icon: React.ReactNode }) {
  return (
    <Card className="p-5">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-xs uppercase tracking-wide text-slate-500">{label}</p>
          <p className="mt-2 text-2xl font-bold">{value}</p>
        </div>
        <div className="rounded-2xl bg-violet-100 p-3 text-violet-700">{icon}</div>
      </div>
    </Card>
  );
}

const defaultSummary: WorkspaceSummary = {
  workspaces: 0,
  members: 0,
  datasets: 0,
  files: 0,
  archives: 0,
  candidates: 0,
};

export default function WorkspacesPage() {
  const [summary, setSummary] = useState<WorkspaceSummary>(defaultSummary);
  const [workspaces, setWorkspaces] = useState<WorkspaceCard[]>([]);
  const [selectedWorkspaceId, setSelectedWorkspaceId] = useState<string>("");
  const [files, setFiles] = useState<WorkspaceFile[]>([]);
  const [candidates, setCandidates] = useState<DatasetCandidate[]>([]);
  const [loading, setLoading] = useState(false);
  const [event, setEvent] = useState("Ready for workspace intake.");
  const [search, setSearch] = useState("");

  const selectedWorkspace = useMemo(
    () => workspaces.find((w) => w.id === selectedWorkspaceId) ?? workspaces[0],
    [workspaces, selectedWorkspaceId],
  );

  async function load() {
    setLoading(true);
    try {
      const [s, w] = await Promise.all([workspaceIntakeApi.summary(), workspaceIntakeApi.workspaces()]);
      setSummary(s);
      setWorkspaces(w);
      if (!selectedWorkspaceId && w[0]) setSelectedWorkspaceId(w[0].id);
    } finally {
      setLoading(false);
    }
  }

  async function loadWorkspaceDetails(id: string) {
    if (!id) return;
    const [f, c] = await Promise.all([workspaceIntakeApi.files(id), workspaceIntakeApi.candidates(id)]);
    setFiles(f);
    setCandidates(c);
  }

  useEffect(() => {
    load().catch(() => setEvent("Could not load workspace intake API. Check backend route wiring."));
  }, []);

  useEffect(() => {
    if (selectedWorkspace?.id) loadWorkspaceDetails(selectedWorkspace.id).catch(() => {});
  }, [selectedWorkspace?.id]);

  async function createWorkspace() {
    const name = prompt("Workspace name", "New SDOH Research Workspace");
    if (!name) return;
    const workspace = await workspaceIntakeApi.createWorkspace({
      name,
      description: "Workspace created from the intake console.",
    });
    setEvent(`Workspace created: ${workspace.name}`);
    await load();
    setSelectedWorkspaceId(workspace.id);
  }

  async function handleUpload(fileList: FileList | null) {
    if (!fileList || !selectedWorkspace) return;
    setLoading(true);
    setEvent("Uploading and processing files...");
    try {
      const response = await workspaceIntakeApi.upload(selectedWorkspace.id, fileList);
      setEvent(
        `Uploaded ${response.uploaded.length} file(s). Detected ${response.candidates.length} dataset candidate(s).`,
      );
      await load();
      await loadWorkspaceDetails(selectedWorkspace.id);
    } catch (e) {
      setEvent(e instanceof Error ? e.message : "Upload failed.");
    } finally {
      setLoading(false);
    }
  }

  async function register(candidateId: string) {
    if (!selectedWorkspace) return;
    const res = await workspaceIntakeApi.registerDataset(selectedWorkspace.id, candidateId);
    setEvent(`Dataset registered. Next: ${res.nextUrl}`);
    await loadWorkspaceDetails(selectedWorkspace.id);
  }

  async function handoff(target: string) {
    if (!selectedWorkspace) return;
    const res = await workspaceIntakeApi.handoff(selectedWorkspace.id, target);
    setEvent(`Handoff ready: ${res.target} → ${res.nextUrl}`);
  }

  const filteredWorkspaces = workspaces.filter((w) =>
    `${w.name} ${w.description} ${w.owner}`.toLowerCase().includes(search.toLowerCase()),
  );

  return (
    <main className="min-h-screen bg-slate-50 p-8 text-slate-950">
      <div className="mx-auto max-w-7xl space-y-6">
        <section className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <p className="text-sm text-slate-500">Research Platform</p>
            <h1 className="text-4xl font-bold tracking-tight">Workspace Intake</h1>
            <p className="mt-2 max-w-3xl text-slate-600">
              Upload ZIP/folder/data files, extract assets into a workspace, register datasets, create projects/tasks,
              assign teams, and hand off work to Data Management, Data Preparation, Research Studio, Analytics, and Outputs.
            </p>
          </div>

          <div className="flex gap-2">
            <Button variant="ghost" onClick={load}>
              <RefreshCw className="h-4 w-4" /> Refresh
            </Button>
            <Button variant="purple" onClick={createWorkspace}>
              <Plus className="h-4 w-4" /> Create Workspace
            </Button>
          </div>
        </section>

        <section className="grid gap-4 md:grid-cols-3 xl:grid-cols-6">
          <Kpi label="Workspaces" value={summary.workspaces} icon={<FolderOpen className="h-5 w-5" />} />
          <Kpi label="Members" value={summary.members} icon={<Users className="h-5 w-5" />} />
          <Kpi label="Datasets" value={summary.datasets} icon={<Database className="h-5 w-5" />} />
          <Kpi label="Files" value={summary.files} icon={<File className="h-5 w-5" />} />
          <Kpi label="Archives" value={summary.archives} icon={<Archive className="h-5 w-5" />} />
          <Kpi label="Candidates" value={summary.candidates} icon={<FileSpreadsheet className="h-5 w-5" />} />
        </section>

        <Card className="p-4">
          <div className="flex items-center gap-3 rounded-xl border bg-slate-50 px-4 py-3">
            <Search className="h-5 w-5 text-slate-400" />
            <input
              className="w-full bg-transparent outline-none"
              placeholder="Search workspaces by name, description, owner, or role..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
        </Card>

        <section className="grid gap-6 xl:grid-cols-[1.05fr_1.4fr]">
          <Card className="p-5">
            <div className="mb-4 flex items-center justify-between">
              <h2 className="text-xl font-semibold">Workspaces</h2>
              {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
            </div>

            <div className="space-y-3">
              {filteredWorkspaces.map((workspace) => (
                <button
                  key={workspace.id}
                  onClick={() => setSelectedWorkspaceId(workspace.id)}
                  className={`w-full rounded-2xl border p-4 text-left transition ${
                    selectedWorkspace?.id === workspace.id
                      ? "border-violet-500 bg-violet-50"
                      : "border-slate-200 bg-white hover:bg-slate-50"
                  }`}
                >
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <h3 className="font-semibold">{workspace.name}</h3>
                      <p className="mt-1 text-sm text-slate-600">{workspace.description}</p>
                    </div>
                    <span className="rounded-full bg-emerald-100 px-2 py-1 text-xs font-medium text-emerald-700">
                      {workspace.status}
                    </span>
                  </div>

                  <div className="mt-4 flex flex-wrap gap-3 text-xs text-slate-500">
                    <span>Owner: {workspace.owner}</span>
                    <span>Members: {workspace.members}</span>
                    <span>Datasets: {workspace.datasets}</span>
                    <span>Files: {workspace.files}</span>
                    <span>Candidates: {workspace.candidates}</span>
                  </div>
                </button>
              ))}
            </div>
          </Card>

          <div className="space-y-6">
            <Card className="p-5">
              <div className="flex flex-wrap items-start justify-between gap-4">
                <div>
                  <p className="text-xs uppercase tracking-wide text-slate-500">Selected Workspace</p>
                  <h2 className="mt-1 text-2xl font-bold">{selectedWorkspace?.name ?? "No workspace selected"}</h2>
                  <p className="mt-1 text-slate-600">{selectedWorkspace?.description}</p>
                </div>

                <label className="inline-flex cursor-pointer items-center gap-2 rounded-xl bg-slate-950 px-4 py-2 text-sm font-medium text-white hover:bg-slate-800">
                  <Upload className="h-4 w-4" />
                  Upload ZIP / Files
                  <input type="file" multiple className="hidden" onChange={(e) => handleUpload(e.target.files)} />
                </label>
              </div>

              <div className="mt-5 rounded-2xl border border-dashed border-slate-300 bg-slate-50 p-8 text-center">
                <Upload className="mx-auto h-9 w-9 text-slate-400" />
                <p className="mt-3 font-medium">Drop ZIP, CSV, XLSX, JSON, Parquet, documents, or code files here</p>
                <p className="text-sm text-slate-500">
                  Archives are safely extracted into the workspace file tree and dataset candidates are detected.
                </p>
              </div>
            </Card>

            <Card className="p-5">
              <h2 className="text-xl font-semibold">Operational Handoff</h2>
              <p className="mt-1 text-sm text-slate-600">
                Send this workspace into the next chain stage while preserving audit, lineage, and job events.
              </p>

              <div className="mt-4 grid gap-3 md:grid-cols-2">
                {[
                  ["Data Management", "data-management"],
                  ["Dataset Registry", "dataset-registry"],
                  ["Data Preparation", "data-preparation"],
                  ["Research Studio", "research-studio"],
                  ["Analytics & AI", "analytics-ai"],
                  ["Outputs", "outputs"],
                ].map(([label, target]) => (
                  <button
                    key={target}
                    onClick={() => handoff(target)}
                    className="flex items-center justify-between rounded-xl border bg-white px-4 py-3 text-left hover:bg-slate-50"
                  >
                    <span>{label}</span>
                    <ArrowRight className="h-4 w-4" />
                  </button>
                ))}
              </div>
            </Card>
          </div>
        </section>

        <section className="grid gap-6 xl:grid-cols-3">
          <Card className="p-5 xl:col-span-1">
            <h2 className="mb-4 flex items-center gap-2 text-xl font-semibold">
              <Folder className="h-5 w-5 text-violet-600" /> Workspace File Explorer
            </h2>

            <div className="space-y-2">
              {files.length === 0 ? (
                <p className="rounded-xl bg-slate-50 p-4 text-sm text-slate-500">
                  No files yet. Upload a ZIP or dataset file to populate the explorer.
                </p>
              ) : (
                files.map((file) => (
                  <div key={file.id} className="flex items-center justify-between rounded-xl border px-3 py-2">
                    <div className="flex items-center gap-2">
                      {file.kind === "folder" ? <Folder className="h-4 w-4" /> : <File className="h-4 w-4" />}
                      <div>
                        <p className="text-sm font-medium">{file.name}</p>
                        <p className="text-xs text-slate-500">{file.path}</p>
                      </div>
                    </div>
                    {file.datasetCandidate ? (
                      <span className="rounded-full bg-blue-100 px-2 py-1 text-xs text-blue-700">dataset</span>
                    ) : null}
                  </div>
                ))
              )}
            </div>
          </Card>

          <Card className="p-5 xl:col-span-1">
            <h2 className="mb-4 flex items-center gap-2 text-xl font-semibold">
              <Database className="h-5 w-5 text-violet-600" /> Detected Dataset Candidates
            </h2>

            <div className="space-y-3">
              {candidates.length === 0 ? (
                <p className="rounded-xl bg-slate-50 p-4 text-sm text-slate-500">
                  Dataset candidates appear here after CSV, XLSX, JSON, or Parquet files are detected.
                </p>
              ) : (
                candidates.map((candidate) => (
                  <div key={candidate.id} className="rounded-xl border p-3">
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <p className="font-medium">{candidate.name}</p>
                        <p className="text-xs text-slate-500">
                          {candidate.format} · {candidate.rowsEstimate} rows · {candidate.columnsEstimate} columns ·{" "}
                          {candidate.confidence}% confidence
                        </p>
                      </div>
                      <span className="rounded-full bg-slate-100 px-2 py-1 text-xs">{candidate.status}</span>
                    </div>

                    <Button
                      disabled={candidate.status === "registered"}
                      variant="purple"
                      onClick={() => register(candidate.id)}
                    >
                      Register Dataset <ArrowRight className="h-4 w-4" />
                    </Button>
                  </div>
                ))
              )}
            </div>
          </Card>

          <Card className="p-5 xl:col-span-1">
            <h2 className="mb-4 flex items-center gap-2 text-xl font-semibold">
              <Workflow className="h-5 w-5 text-violet-600" /> Intake Actions
            </h2>

            <div className="space-y-3">
              <button
                onClick={() => selectedWorkspace && workspaceIntakeApi.createProject(selectedWorkspace.id, {
                  title: "Dataset intake project",
                  objective: "Track source upload, registration, profiling, and downstream handoff.",
                }).then(() => setEvent("Project created for selected workspace."))}
                className="flex w-full items-center justify-between rounded-xl border px-4 py-3 hover:bg-slate-50"
              >
                <span>Create Project</span>
                <ArrowRight className="h-4 w-4" />
              </button>

              <button
                onClick={() => selectedWorkspace && workspaceIntakeApi.createTask(selectedWorkspace.id, {
                  title: "Review uploaded dataset candidates",
                  stage: "DATA_MANAGEMENT",
                }).then(() => setEvent("Task created for dataset candidate review."))}
                className="flex w-full items-center justify-between rounded-xl border px-4 py-3 hover:bg-slate-50"
              >
                <span>Create Review Task</span>
                <ArrowRight className="h-4 w-4" />
              </button>

              <button
                onClick={() => selectedWorkspace && workspaceIntakeApi.assignTeam(selectedWorkspace.id, {
                  email: "analyst@datanoch.local",
                  role: "Data Analyst",
                }).then(() => setEvent("Team member assigned to workspace."))}
                className="flex w-full items-center justify-between rounded-xl border px-4 py-3 hover:bg-slate-50"
              >
                <span>Assign Team</span>
                <ArrowRight className="h-4 w-4" />
              </button>

              <button
                onClick={() => handoff("runtime-monitoring")}
                className="flex w-full items-center justify-between rounded-xl border px-4 py-3 hover:bg-slate-50"
              >
                <span>Open Runtime Monitoring</span>
                <BarChart3 className="h-4 w-4" />
              </button>
            </div>
          </Card>
        </section>

        <Card className="p-4">
          <div className="flex items-center gap-2 text-sm">
            <GitBranch className="h-4 w-4 text-violet-600" />
            <span className="font-medium">Latest Event:</span>
            <span className="text-slate-600">{event}</span>
          </div>
        </Card>
      </div>
    </main>
  );
}
