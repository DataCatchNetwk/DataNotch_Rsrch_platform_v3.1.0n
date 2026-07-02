"use client";

import type { ReactNode } from "react";
import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import {
  Archive,
  ArrowLeft,
  BarChart3,
  CheckCircle2,
  FileText,
  FolderKanban,
  Globe,
  Lock,
  MoreHorizontal,
  PlayCircle,
  Plus,
  RefreshCcw,
  Settings,
  Trash2,
  Upload,
  UserMinus,
  UserPlus,
  Users,
  XCircle,
} from "lucide-react";

import {
  addWorkspaceMember,
  archiveWorkspace,
  cancelAnalysisJob,
  createAnalysisJob,
  createPipelineRun,
  deleteDataset,
  deleteReport,
  getWorkspace,
  listWorkspacePipelineRuns,
  removeWorkspaceMember,
  resumePipelineRun,
  uploadDataset,
  uploadReport,
  updateWorkspace,
  updateWorkspaceMemberRole,
  cancelPipelineRun,
  type PipelineRun,
  type Workspace,
  type WorkspaceRole,
} from "@/src/lib/api/workspaces";
import { canWorkspace } from "@/src/lib/workspace-ui-permissions";
import {
  AnalysisStatusBadge,
  DatasetVisibilityBadge,
  ReportStatusBadge,
  WorkspaceRoleBadge,
} from "@/components/workspaces/workspace-badges";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";
import WorkspaceFileExplorer from "@/app/dashboard/workspaces/WorkspaceFileExplorer";
import { fetchWorkspaceRegistryDatasets, type WorkspaceRegistryDataset } from "@/src/lib/api/workspaceZip";

type UiState = {
  editingWorkspace: boolean;
  creatingDataset: boolean;
  creatingAnalysis: boolean;
  creatingPipeline: boolean;
  creatingReport: boolean;
  invitingMember: boolean;
};

type WorkspaceTab = "overview" | "members" | "datasets" | "analysis" | "pipelines" | "reports";

const initialUiState: UiState = {
  editingWorkspace: false,
  creatingDataset: false,
  creatingAnalysis: false,
  creatingPipeline: false,
  creatingReport: false,
  invitingMember: false,
};

export default function WorkspaceDetailsPage() {
  const params = useParams();
  const router = useRouter();
  const workspaceId = String(params.workspaceId);

  const [workspace, setWorkspace] = useState<Workspace | null>(null);
  const [pipelineRuns, setPipelineRuns] = useState<PipelineRun[]>([]);
  const [loading, setLoading] = useState(true);
  const [pipelineLoading, setPipelineLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [ui, setUi] = useState<UiState>(initialUiState);
  const [activeTab, setActiveTab] = useState<WorkspaceTab>("overview");
  const [error, setError] = useState<string | null>(null);
  const [registryDatasets, setRegistryDatasets] = useState<WorkspaceRegistryDataset[]>([]);

  const [workspaceForm, setWorkspaceForm] = useState({
    name: "",
    description: "",
  });

  const [memberForm, setMemberForm] = useState({
    userId: "",
    role: "VIEWER" as WorkspaceRole,
  });

  const [datasetForm, setDatasetForm] = useState({
    name: "",
    description: "",
    visibility: "WORKSPACE" as "PRIVATE" | "WORKSPACE" | "PUBLIC" | "RESTRICTED",
    recordCount: "",
    tags: "",
    autoRunPipeline: true,
    file: null as File | null,
  });

  const [analysisForm, setAnalysisForm] = useState({
    name: "",
    description: "",
    jobType: "",
    datasetId: "",
    autoPipeline: false,
    analysisType: "classification",
    parametersJson: "{\n  \"model\": \"logistic_regression\"\n}",
  });

  const [reportForm, setReportForm] = useState({
    title: "",
    reportType: "",
    description: "",
    datasetIds: "",
    metadataJson: "{\n  \"format\": \"pdf\"\n}",
    file: null as File | null,
  });

  const [pipelineForm, setPipelineForm] = useState({
    name: "",
    datasetId: "",
    analysisType: "classification",
  });

  async function loadPipelineRuns() {
    setPipelineLoading(true);
    try {
      const runs = await listWorkspacePipelineRuns(workspaceId);
      setPipelineRuns(runs);
    } catch (err) {
      console.warn("Failed to load workspace pipeline runs", err);
      setPipelineRuns([]);
    } finally {
      setPipelineLoading(false);
    }
  }

  async function loadRegistryDatasets() {
    try {
      const records = await fetchWorkspaceRegistryDatasets(workspaceId);
      setRegistryDatasets(records);
    } catch {
      setRegistryDatasets([]);
    }
  }

  async function loadWorkspace() {
    setLoading(true);
    setError(null);
    setPipelineLoading(true);

    try {
      const data = await getWorkspace(workspaceId);
      setWorkspace(data);
      setWorkspaceForm({
        name: data.name,
        description: data.description ?? "",
      });

      try {
        const runs = await listWorkspacePipelineRuns(workspaceId);
        setPipelineRuns(runs);
      } catch (pipelineErr) {
        console.warn("Failed to load workspace pipeline runs", pipelineErr);
        setPipelineRuns([]);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load workspace");
    } finally {
      setLoading(false);
      setPipelineLoading(false);
    }
  }

  useEffect(() => {
    void loadWorkspace();
  }, [workspaceId]);

  useEffect(() => {
    void loadRegistryDatasets();
  }, [workspaceId]);

  const currentRole = workspace?.currentUserRole;
  const counts = workspace?._count;

  const datasetOptions = useMemo(() => workspace?.datasets ?? [], [workspace]);
  const memberOptions = useMemo(() => workspace?.members ?? [], [workspace]);

  function openWorkspaceAction(tab: WorkspaceTab, panel: keyof UiState) {
    setActiveTab(tab);
    setUi({
      ...initialUiState,
      [panel]: true,
    });
  }

  async function handleUpdateWorkspace() {
    if (!workspace) return;

    setBusy(true);
    setError(null);
    try {
      const updated = await updateWorkspace(workspace.id, {
        name: workspaceForm.name,
        description: workspaceForm.description,
      });
      setWorkspace(updated);
      setUi((state) => ({ ...state, editingWorkspace: false }));
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to update workspace");
    } finally {
      setBusy(false);
    }
  }

  async function handleArchiveWorkspace() {
    if (!workspace) return;
    if (workspace.status === "ARCHIVED") return;

    setBusy(true);
    setError(null);
    try {
      const updated = await archiveWorkspace(workspace.id);
      setWorkspace(updated);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to archive workspace");
    } finally {
      setBusy(false);
    }
  }

  async function handleInviteMember() {
    if (!workspace || !memberForm.userId.trim()) return;

    setBusy(true);
    setError(null);
    try {
      await addWorkspaceMember(workspace.id, {
        userId: memberForm.userId.trim(),
        role: memberForm.role,
      });
      await loadWorkspace();
      setMemberForm({ userId: "", role: "VIEWER" });
      setUi((state) => ({ ...state, invitingMember: false }));
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to add member");
    } finally {
      setBusy(false);
    }
  }

  async function handleMemberRoleChange(memberUserId: string, role: WorkspaceRole) {
    if (!workspace) return;

    setBusy(true);
    setError(null);
    try {
      await updateWorkspaceMemberRole(workspace.id, memberUserId, { role });
      await loadWorkspace();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to update member role");
    } finally {
      setBusy(false);
    }
  }

  async function handleRemoveMember(memberUserId: string) {
    if (!workspace) return;

    setBusy(true);
    setError(null);
    try {
      await removeWorkspaceMember(workspace.id, memberUserId);
      await loadWorkspace();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to remove member");
    } finally {
      setBusy(false);
    }
  }

  async function handleCreateDataset() {
    if (!workspace || !datasetForm.file) return;

    setBusy(true);
    setError(null);
    try {
      await uploadDataset(workspace.id, {
        file: datasetForm.file,
        name: datasetForm.name.trim(),
        description: datasetForm.description || undefined,
        visibility: datasetForm.visibility,
        recordCount: datasetForm.recordCount ? Number(datasetForm.recordCount) : undefined,
        tags: datasetForm.tags
          ? datasetForm.tags.split(",").map((tag) => tag.trim()).filter(Boolean)
          : [],
        autoRunPipeline: datasetForm.autoRunPipeline,
      });
      await loadWorkspace();
      setDatasetForm({
        name: "",
        description: "",
        visibility: "WORKSPACE",
        recordCount: "",
        tags: "",
        autoRunPipeline: true,
        file: null,
      });
      setUi((state) => ({ ...state, creatingDataset: false }));
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to create dataset");
    } finally {
      setBusy(false);
    }
  }

  async function handleDeleteDataset(datasetId: string) {
    if (!workspace) return;

    setBusy(true);
    setError(null);
    try {
      await deleteDataset(workspace.id, datasetId);
      await loadWorkspace();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to delete dataset");
    } finally {
      setBusy(false);
    }
  }

  async function handleCreateAnalysisJob() {
    if (!workspace || !analysisForm.name.trim() || !analysisForm.jobType.trim()) return;

    setBusy(true);
    setError(null);
    try {
      const analysisJob = await createAnalysisJob(workspace.id, {
        name: analysisForm.name.trim(),
        description: analysisForm.description || undefined,
        jobType: analysisForm.jobType.trim(),
        datasetId: analysisForm.datasetId || undefined,
        parametersJson: safeJsonParse(analysisForm.parametersJson),
        autoPipeline: analysisForm.autoPipeline,
        analysisType: analysisForm.autoPipeline ? analysisForm.analysisType : undefined,
      });
      await loadWorkspace();
      setAnalysisForm({
        name: "",
        description: "",
        jobType: "",
        datasetId: "",
        autoPipeline: false,
        analysisType: "classification",
        parametersJson: "{\n  \"model\": \"logistic_regression\"\n}",
      });
      setUi((state) => ({ ...state, creatingAnalysis: false }));

      const pipelineRunId =
        analysisJob &&
        typeof analysisJob.resultsJson === "object" &&
        analysisJob.resultsJson !== null &&
        "pipelineRunId" in analysisJob.resultsJson &&
        typeof (analysisJob.resultsJson as { pipelineRunId?: unknown }).pipelineRunId === "string"
          ? (analysisJob.resultsJson as { pipelineRunId: string }).pipelineRunId
          : null;

      if (analysisForm.autoPipeline && pipelineRunId) {
        router.push(`/dashboard/workspaces/${workspace.id}/pipelines/${pipelineRunId}`);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to create analysis job");
    } finally {
      setBusy(false);
    }
  }

  async function handleCreatePipelineRun() {
    if (!workspace || !pipelineForm.name.trim() || !pipelineForm.datasetId) return;

    setBusy(true);
    setError(null);
    try {
      const run = await createPipelineRun({
        workspaceId: workspace.id,
        datasetId: pipelineForm.datasetId,
        name: pipelineForm.name.trim(),
        templateCode: "research_default_v1",
        parameters: {
          analysisType: pipelineForm.analysisType,
          autoPublish: true,
          autoGenerateReport: true,
        },
      });
      await loadPipelineRuns();
      setPipelineForm({ name: "", datasetId: "", analysisType: "classification" });
      setUi((state) => ({ ...state, creatingPipeline: false }));
      router.push(`/dashboard/workspaces/${workspace.id}/pipelines/${run.id}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to create pipeline run");
    } finally {
      setBusy(false);
    }
  }

  async function handleCancelPipelineRun(runId: string) {
    setBusy(true);
    setError(null);
    try {
      await cancelPipelineRun(runId, "Canceled from workspace UI");
      await loadPipelineRuns();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to cancel pipeline run");
    } finally {
      setBusy(false);
    }
  }

  async function handleResumePipelineRun(runId: string) {
    setBusy(true);
    setError(null);
    try {
      await resumePipelineRun(runId, "Resumed from workspace UI");
      await loadPipelineRuns();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to resume pipeline run");
    } finally {
      setBusy(false);
    }
  }

  async function handleCancelAnalysis(jobId: string) {
    if (!workspace) return;

    setBusy(true);
    setError(null);
    try {
      await cancelAnalysisJob(workspace.id, jobId);
      await loadWorkspace();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to cancel analysis job");
    } finally {
      setBusy(false);
    }
  }

  async function handleCreateReport() {
    if (!workspace || !reportForm.file || !reportForm.title.trim() || !reportForm.reportType.trim()) return;

    setBusy(true);
    setError(null);
    try {
      await uploadReport(workspace.id, {
        file: reportForm.file,
        title: reportForm.title.trim(),
        reportType: reportForm.reportType.trim(),
        description: reportForm.description || undefined,
        datasetIds: reportForm.datasetIds
          ? reportForm.datasetIds.split(",").map((id) => id.trim()).filter(Boolean)
          : [],
        metadataJson: safeJsonParse(reportForm.metadataJson),
      });
      await loadWorkspace();
      setReportForm({
        title: "",
        reportType: "",
        description: "",
        datasetIds: "",
        metadataJson: "{\n  \"format\": \"pdf\"\n}",
        file: null,
      });
      setUi((state) => ({ ...state, creatingReport: false }));
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to create report");
    } finally {
      setBusy(false);
    }
  }

  async function handleDeleteReport(reportId: string) {
    if (!workspace) return;

    setBusy(true);
    setError(null);
    try {
      await deleteReport(workspace.id, reportId);
      await loadWorkspace();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to delete report");
    } finally {
      setBusy(false);
    }
  }

  function openExternal(url?: string | null) {
    if (!url) {
      return;
    }

    window.open(url, "_blank", "noopener,noreferrer");
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 p-8">
        <Card className="mx-auto max-w-7xl rounded-2xl border-slate-200 bg-white shadow-sm">
          <CardContent className="p-6 text-sm text-slate-500">Loading workspace...</CardContent>
        </Card>
      </div>
    );
  }

  if (!workspace) {
    return (
      <div className="min-h-screen bg-slate-50 p-8">
        <Card className="mx-auto max-w-4xl rounded-2xl border-slate-200 bg-white shadow-sm">
          <CardContent className="space-y-5 p-6">
            <div className="space-y-2">
              <p className="text-lg font-semibold text-slate-900">Workspace could not be loaded</p>
              <p className="text-sm leading-6 text-slate-600">
                The selected workspace may have been archived, deleted, or created under a different account. The workspace list is still available, so you can reopen a valid workspace without restarting the application.
              </p>
            </div>
            <div className="rounded-2xl border border-rose-200 bg-rose-50 p-4 text-sm text-rose-700">
              {error || "Workspace could not be loaded."}
            </div>
            <div className="flex flex-wrap gap-2">
              <Button
                variant="outline"
                onClick={() => void loadWorkspace()}
                className="rounded-xl border-slate-200 bg-white text-slate-700"
              >
                <RefreshCcw className="mr-2 h-4 w-4" />
                Retry
              </Button>
              <Button asChild className="rounded-xl bg-linear-to-r from-indigo-500 to-violet-600 text-white">
                <Link href="/dashboard/workspaces">
                  <ArrowLeft className="mr-2 h-4 w-4" />
                  Back to Workspaces
                </Link>
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  const ownershipLabel = workspace.currentUserRole === "OWNER" ? "Owned" : "Shared";

  return (
    <div className="min-h-screen bg-slate-50">
      <div className="mx-auto max-w-7xl px-6 py-8">
        <div className="space-y-8">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
            <div className="space-y-3">
              <Link
                href="/dashboard/workspaces"
                className="inline-flex items-center gap-2 text-sm font-medium text-slate-500 hover:text-slate-900"
              >
                <ArrowLeft className="h-4 w-4" />
                Back to Workspaces
              </Link>

              <div className="flex flex-wrap items-center gap-2">
                <h1 className="text-3xl font-bold tracking-tight text-slate-900">{workspace.name}</h1>
                <WorkspaceRoleBadge role={workspace.currentUserRole} />
                <Badge
                  variant="outline"
                  className={
                    workspace.status === "ACTIVE"
                      ? "rounded-full border-emerald-200 bg-emerald-50 text-emerald-700"
                      : "rounded-full border-amber-200 bg-amber-50 text-amber-700"
                  }
                >
                  {workspace.status}
                </Badge>
                <Badge variant="outline" className="rounded-full border-indigo-200 bg-indigo-50 text-indigo-700">
                  {ownershipLabel}
                </Badge>
              </div>

              <p className="max-w-4xl text-sm leading-6 text-slate-600">
                {workspace.description || "No workspace description provided yet."}
              </p>
            </div>

            <div className="flex flex-wrap gap-2">
              <Button
                variant="outline"
                onClick={() => void loadWorkspace()}
                className="rounded-xl border-slate-200 bg-white text-slate-700"
              >
                <RefreshCcw className="mr-2 h-4 w-4" />
                Refresh
              </Button>

              {canWorkspace(currentRole, "inviteMember") && (
                <Button
                  variant="outline"
                  onClick={() => openWorkspaceAction("members", "invitingMember")}
                  className="rounded-xl border-slate-200 bg-white text-slate-700"
                >
                  <UserPlus className="mr-2 h-4 w-4" />
                  Invite Member
                </Button>
              )}

              {canWorkspace(currentRole, "uploadDataset") && (
                <Button
                  variant="outline"
                  onClick={() => openWorkspaceAction("datasets", "creatingDataset")}
                  className="rounded-xl border-slate-200 bg-white text-slate-700"
                >
                  <Upload className="mr-2 h-4 w-4" />
                  Upload Dataset
                </Button>
              )}

              {canWorkspace(currentRole, "createAnalysis") && (
                <Button
                  variant="outline"
                  onClick={() => openWorkspaceAction("analysis", "creatingAnalysis")}
                  className="rounded-xl border-slate-200 bg-white text-slate-700"
                >
                  <PlayCircle className="mr-2 h-4 w-4" />
                  Run Analysis
                </Button>
              )}

              {canWorkspace(currentRole, "createReport") && (
                <Button
                  className="rounded-xl bg-linear-to-r from-indigo-500 to-violet-600 text-white"
                  onClick={() => openWorkspaceAction("reports", "creatingReport")}
                >
                  <FileText className="mr-2 h-4 w-4" />
                  Generate Report
                </Button>
              )}

              {canWorkspace(currentRole, "editWorkspace") && (
                <Button
                  variant="outline"
                  onClick={() => openWorkspaceAction("overview", "editingWorkspace")}
                  className="rounded-xl border-slate-200 bg-white text-slate-700"
                >
                  <Settings className="mr-2 h-4 w-4" />
                  Settings
                </Button>
              )}

              {canWorkspace(currentRole, "archiveWorkspace") && (
                <Button
                  variant="outline"
                  onClick={() => void handleArchiveWorkspace()}
                  disabled={busy || workspace.status === "ARCHIVED"}
                  className="rounded-xl border-amber-200 text-amber-700 hover:bg-amber-50"
                >
                  {workspace.status === "ARCHIVED" ? (
                    <CheckCircle2 className="mr-2 h-4 w-4" />
                  ) : (
                    <Archive className="mr-2 h-4 w-4" />
                  )}
                  {workspace.status === "ARCHIVED" ? "Archived" : "Archive"}
                </Button>
              )}
            </div>
          </div>

          {error ? (
            <Card className="rounded-2xl border-rose-200 bg-rose-50 shadow-sm">
              <CardContent className="p-4 text-sm text-rose-700">{error}</CardContent>
            </Card>
          ) : null}

          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-5">
            <MetricCard icon={<Users className="h-5 w-5" />} label="Members" value={String(counts?.members ?? 0)} />
            <MetricCard icon={<FolderKanban className="h-5 w-5" />} label="Datasets" value={String(counts?.datasets ?? 0)} />
            <MetricCard icon={<BarChart3 className="h-5 w-5" />} label="Analysis Jobs" value={String(counts?.analysisJobs ?? 0)} />
            <MetricCard icon={<FileText className="h-5 w-5" />} label="Reports" value={String(counts?.reports ?? 0)} />
            <MetricCard
              icon={workspace.status === "ACTIVE" ? <CheckCircle2 className="h-5 w-5" /> : <XCircle className="h-5 w-5" />}
              label="Status"
              value={workspace.status}
            />
          </div>

          <Tabs value={activeTab} onValueChange={(value) => setActiveTab(value as WorkspaceTab)} className="space-y-6">
            <TabsList className="grid h-11 w-full grid-cols-6 rounded-xl bg-slate-100 p-1">
              <TabsTrigger value="overview" className="rounded-lg">Overview</TabsTrigger>
              <TabsTrigger value="members" className="rounded-lg">Members</TabsTrigger>
              <TabsTrigger value="datasets" className="rounded-lg">Datasets</TabsTrigger>
              <TabsTrigger value="analysis" className="rounded-lg">Analysis</TabsTrigger>
              <TabsTrigger value="pipelines" className="rounded-lg">Pipelines</TabsTrigger>
              <TabsTrigger value="reports" className="rounded-lg">Reports</TabsTrigger>
            </TabsList>

            <TabsContent value="overview" className="space-y-6">
              <div className="grid gap-6 xl:grid-cols-2">
                <Card className="rounded-2xl border-slate-200 bg-white shadow-sm">
                  <CardHeader>
                    <CardTitle>Workspace Overview</CardTitle>
                    <CardDescription>Core details and current user role.</CardDescription>
                  </CardHeader>
                  <CardContent className="grid gap-4 md:grid-cols-2">
                    <InfoBox label="Workspace Name" value={workspace.name} />
                    <InfoBox label="Your Role" value={workspace.currentUserRole} />
                    <InfoBox label="Owner" value={workspace.owner.name || workspace.owner.email} />
                    <InfoBox label="Created" value={new Date(workspace.createdAt).toLocaleString()} />
                    <InfoBox label="Updated" value={new Date(workspace.updatedAt).toLocaleString()} />
                    <InfoBox label="Status" value={workspace.status} />
                  </CardContent>
                </Card>

                {ui.editingWorkspace && canWorkspace(currentRole, "editWorkspace") ? (
                  <Card className="rounded-2xl border-slate-200 bg-white shadow-sm">
                    <CardHeader>
                      <CardTitle>Edit Workspace</CardTitle>
                      <CardDescription>Update workspace name and description.</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div className="space-y-2">
                        <Label htmlFor="workspace-name">Name</Label>
                        <Input
                          id="workspace-name"
                          value={workspaceForm.name}
                          onChange={(event) => setWorkspaceForm((state) => ({ ...state, name: event.target.value }))}
                          className="rounded-xl"
                        />
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="workspace-description">Description</Label>
                        <Textarea
                          id="workspace-description"
                          value={workspaceForm.description}
                          onChange={(event) =>
                            setWorkspaceForm((state) => ({ ...state, description: event.target.value }))
                          }
                          className="min-h-30 rounded-xl"
                        />
                      </div>

                      <div className="flex justify-end gap-2">
                        <Button
                          variant="outline"
                          className="rounded-xl"
                          onClick={() => setUi((state) => ({ ...state, editingWorkspace: false }))}
                        >
                          Cancel
                        </Button>
                        <Button
                          onClick={() => void handleUpdateWorkspace()}
                          disabled={busy}
                          className="rounded-xl bg-linear-to-r from-indigo-500 to-violet-600 text-white"
                        >
                          Save Changes
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                ) : (
                  <Card className="rounded-2xl border-slate-200 bg-white shadow-sm">
                    <CardHeader>
                      <CardTitle>Quick Permissions Summary</CardTitle>
                      <CardDescription>Visible actions for your current workspace role.</CardDescription>
                    </CardHeader>
                    <CardContent className="flex flex-wrap gap-2">
                      {[
                        ["Invite Member", "inviteMember"],
                        ["Upload Dataset", "uploadDataset"],
                        ["Run Analysis", "createAnalysis"],
                        ["Generate Report", "createReport"],
                        ["Edit Workspace", "editWorkspace"],
                        ["Archive Workspace", "archiveWorkspace"],
                      ].map(([label, action]) => (
                        <Badge
                          key={action}
                          variant="outline"
                          className={
                            canWorkspace(currentRole, action)
                              ? "rounded-full border-emerald-200 bg-emerald-50 text-emerald-700"
                              : "rounded-full border-slate-200 bg-slate-50 text-slate-500"
                          }
                        >
                          {label}
                        </Badge>
                      ))}
                    </CardContent>
                  </Card>
                )}
              </div>
            </TabsContent>

            <TabsContent value="members" className="space-y-6">
              {ui.invitingMember && canWorkspace(currentRole, "inviteMember") ? (
                <Card className="rounded-2xl border-slate-200 bg-white shadow-sm">
                  <CardHeader>
                    <CardTitle>Add Member</CardTitle>
                    <CardDescription>Invite a user to this workspace with a role.</CardDescription>
                  </CardHeader>
                  <CardContent className="grid gap-4 md:grid-cols-[1.2fr_0.7fr_auto] md:items-end">
                    <div className="space-y-2">
                      <Label htmlFor="member-user-id">User ID</Label>
                      <Input
                        id="member-user-id"
                        value={memberForm.userId}
                        onChange={(event) => setMemberForm((state) => ({ ...state, userId: event.target.value }))}
                        placeholder="Enter user ID"
                        className="rounded-xl"
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="member-role">Role</Label>
                      <select
                        id="member-role"
                        title="Select workspace role for invited member"
                        aria-label="Select workspace role for invited member"
                        value={memberForm.role}
                        onChange={(event) =>
                          setMemberForm((state) => ({
                            ...state,
                            role: event.target.value as WorkspaceRole,
                          }))
                        }
                        className="h-11 w-full rounded-xl border border-slate-200 bg-white px-3 text-sm"
                      >
                        <option value="ADMIN">ADMIN</option>
                        <option value="RESEARCHER">RESEARCHER</option>
                        <option value="VIEWER">VIEWER</option>
                      </select>
                    </div>

                    <Button
                      onClick={() => void handleInviteMember()}
                      disabled={busy}
                      className="rounded-xl bg-linear-to-r from-indigo-500 to-violet-600 text-white"
                    >
                      <UserPlus className="mr-2 h-4 w-4" />
                      Add
                    </Button>
                  </CardContent>
                </Card>
              ) : null}

              <div className="grid gap-4">
                {workspace.members.map((member) => (
                  <Card key={member.id} className="rounded-2xl border-slate-200 bg-white shadow-sm">
                    <CardContent className="flex flex-col gap-4 p-5 lg:flex-row lg:items-center lg:justify-between">
                      <div className="space-y-1">
                        <p className="text-sm font-semibold text-slate-900">
                          {member.user.name || member.user.email}
                        </p>
                        <p className="text-xs text-slate-500">{member.user.email}</p>
                      </div>

                      <div className="flex flex-wrap items-center gap-2">
                        <WorkspaceRoleBadge role={member.role} />

                        {canWorkspace(currentRole, "changeMemberRole") &&
                        member.user.id !== workspace.owner.id ? (
                          <select
                            title={`Change role for ${member.user.name || member.user.email}`}
                            aria-label={`Change role for ${member.user.name || member.user.email}`}
                            value={member.role}
                            onChange={(event) =>
                              void handleMemberRoleChange(
                                member.user.id,
                                event.target.value as WorkspaceRole,
                              )
                            }
                            className="h-10 rounded-xl border border-slate-200 bg-white px-3 text-sm"
                            disabled={busy}
                          >
                            <option value="ADMIN">ADMIN</option>
                            <option value="RESEARCHER">RESEARCHER</option>
                            <option value="VIEWER">VIEWER</option>
                          </select>
                        ) : null}

                        {canWorkspace(currentRole, "removeMember") &&
                        member.user.id !== workspace.owner.id ? (
                          <Button
                            variant="outline"
                            disabled={busy}
                            onClick={() => void handleRemoveMember(member.user.id)}
                            className="rounded-xl border-rose-200 text-rose-600 hover:bg-rose-50"
                          >
                            <UserMinus className="mr-2 h-4 w-4" />
                            Remove
                          </Button>
                        ) : null}
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </TabsContent>

            <TabsContent value="datasets" className="space-y-6">
              <WorkspaceFileExplorer workspaceId={workspaceId} />

              <Card className="rounded-2xl border-slate-200 bg-white shadow-sm">
                <CardHeader>
                  <CardTitle>Registered Raw Datasets</CardTitle>
                  <CardDescription>
                    Datasets registered from extracted workspace ZIP files with lineage to Data Preparation.
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  {registryDatasets.length === 0 ? (
                    <p className="text-sm text-slate-500">No workspace ZIP datasets have been registered yet.</p>
                  ) : (
                    <div className="overflow-hidden rounded-xl border border-slate-200">
                      <table className="w-full text-sm">
                        <thead className="bg-slate-50 text-left text-slate-600">
                          <tr>
                            <th className="p-3">Dataset</th>
                            <th className="p-3">Stage</th>
                            <th className="p-3">Version</th>
                            <th className="p-3">Status</th>
                            <th className="p-3">Action</th>
                          </tr>
                        </thead>
                        <tbody>
                          {registryDatasets.map((dataset) => (
                            <tr key={dataset.id} className="border-t border-slate-100">
                              <td className="p-3 font-medium text-slate-900">{dataset.name}</td>
                              <td className="p-3">{dataset.stage}</td>
                              <td className="p-3">{dataset.version}</td>
                              <td className="p-3">{dataset.status}</td>
                              <td className="p-3">
                                <Link
                                  className="text-indigo-700 hover:text-indigo-600"
                                  href={`/dashboard/datasets?prep=profiling&datasetId=${dataset.registeredDatasetId ?? ""}`}
                                >
                                  Open in Data Profiling
                                </Link>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}
                </CardContent>
              </Card>

              {ui.creatingDataset && canWorkspace(currentRole, "uploadDataset") ? (
                <Card className="rounded-2xl border-slate-200 bg-white shadow-sm">
                  <CardHeader>
                    <CardTitle>Create Dataset</CardTitle>
                    <CardDescription>Register a dataset in this workspace.</CardDescription>
                  </CardHeader>
                  <CardContent className="grid gap-4 md:grid-cols-2">
                    <div className="space-y-2">
                      <Label>Name</Label>
                      <Input
                        value={datasetForm.name}
                        onChange={(event) => setDatasetForm((state) => ({ ...state, name: event.target.value }))}
                        placeholder={datasetForm.file?.name || "Optional display name"}
                        className="rounded-xl"
                      />
                    </div>

                    <div className="space-y-2">
                      <Label>Visibility</Label>
                      <select
                        title="Select dataset visibility"
                        aria-label="Select dataset visibility"
                        value={datasetForm.visibility}
                        onChange={(event) =>
                          setDatasetForm((state) => ({
                            ...state,
                            visibility: event.target.value as typeof datasetForm.visibility,
                          }))
                        }
                        className="h-11 w-full rounded-xl border border-slate-200 bg-white px-3 text-sm"
                      >
                        <option value="PRIVATE">PRIVATE</option>
                        <option value="WORKSPACE">WORKSPACE</option>
                        <option value="PUBLIC">PUBLIC</option>
                        <option value="RESTRICTED">RESTRICTED</option>
                      </select>
                    </div>

                    <div className="space-y-2 md:col-span-2">
                      <Label>Dataset File</Label>
                      <Input
                        type="file"
                        onChange={(event) =>
                          setDatasetForm((state) => ({ ...state, file: event.target.files?.[0] ?? null }))
                        }
                        className="rounded-xl"
                      />
                    </div>

                    <div className="space-y-2 md:col-span-2">
                      <Label>Description</Label>
                      <Textarea
                        value={datasetForm.description}
                        onChange={(event) => setDatasetForm((state) => ({ ...state, description: event.target.value }))}
                        className="min-h-27.5 rounded-xl"
                      />
                    </div>

                    <div className="space-y-2">
                      <Label>Record Count</Label>
                      <Input
                        type="number"
                        value={datasetForm.recordCount}
                        onChange={(event) => setDatasetForm((state) => ({ ...state, recordCount: event.target.value }))}
                        className="rounded-xl"
                      />
                    </div>

                    <div className="space-y-2">
                      <Label>Tags</Label>
                      <Input
                        value={datasetForm.tags}
                        onChange={(event) => setDatasetForm((state) => ({ ...state, tags: event.target.value }))}
                        placeholder="csv, cohort, wearable"
                        className="rounded-xl"
                      />
                    </div>

                    <div className="space-y-2 md:col-span-2">
                      <label className="flex items-center gap-2 text-sm text-slate-700">
                        <input
                          type="checkbox"
                          checked={datasetForm.autoRunPipeline}
                          onChange={(event) =>
                            setDatasetForm((state) => ({ ...state, autoRunPipeline: event.target.checked }))
                          }
                          className="h-4 w-4 rounded border-slate-300"
                        />
                        Automatically trigger full research pipeline after upload
                      </label>
                    </div>

                    <div className="flex justify-end gap-2 md:col-span-2">
                      <Button
                        variant="outline"
                        className="rounded-xl"
                        onClick={() => setUi((state) => ({ ...state, creatingDataset: false }))}
                      >
                        Cancel
                      </Button>
                      <Button
                        onClick={() => void handleCreateDataset()}
                        disabled={busy || !datasetForm.file}
                        className="rounded-xl bg-linear-to-r from-indigo-500 to-violet-600 text-white"
                      >
                        <Plus className="mr-2 h-4 w-4" />
                        Upload Dataset
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ) : null}

              <div className="grid gap-4">
                {workspace.datasets.length === 0 ? (
                  <EmptyCard label="No datasets in this workspace yet." />
                ) : (
                  workspace.datasets.map((dataset) => (
                    <Card key={dataset.id} className="rounded-2xl border-slate-200 bg-white shadow-sm">
                      <CardContent className="flex flex-col gap-4 p-5 lg:flex-row lg:items-center lg:justify-between">
                        <div className="space-y-2">
                          <div className="flex flex-wrap items-center gap-2">
                            <p className="text-sm font-semibold text-slate-900">{dataset.name}</p>
                            <DatasetVisibilityBadge visibility={dataset.visibility} />
                            <Badge variant="outline" className="rounded-full">
                              v{dataset.version}
                            </Badge>
                          </div>
                          <p className="text-xs text-slate-500">
                            {dataset.description || "No description"} • {dataset.recordCount ?? 0} records
                          </p>
                        </div>

                        <div className="flex flex-wrap gap-2">
                          {canWorkspace(currentRole, "downloadDataset") && (
                            <Button
                              variant="outline"
                              className="rounded-xl border-slate-200"
                              onClick={() => openExternal(dataset.storagePath)}
                              disabled={!dataset.storagePath}
                            >
                              {dataset.storagePath ? (
                                <Globe className="mr-2 h-4 w-4" />
                              ) : (
                                <Lock className="mr-2 h-4 w-4" />
                              )}
                              Download
                            </Button>
                          )}

                          {canWorkspace(currentRole, "deleteDataset") && (
                            <Button
                              variant="outline"
                              disabled={busy}
                              onClick={() => void handleDeleteDataset(dataset.id)}
                              className="rounded-xl border-rose-200 text-rose-600 hover:bg-rose-50"
                            >
                              <Trash2 className="mr-2 h-4 w-4" />
                              Delete
                            </Button>
                          )}
                        </div>
                      </CardContent>
                    </Card>
                  ))
                )}
              </div>
            </TabsContent>

            <TabsContent value="analysis" className="space-y-6">
              {ui.creatingAnalysis && canWorkspace(currentRole, "createAnalysis") ? (
                <Card className="rounded-2xl border-slate-200 bg-white shadow-sm">
                  <CardHeader>
                    <CardTitle>Create Analysis Job</CardTitle>
                    <CardDescription>Queue a new analysis run for this workspace.</CardDescription>
                  </CardHeader>
                  <CardContent className="grid gap-4 md:grid-cols-2">
                    <div className="space-y-2">
                      <Label>Name</Label>
                      <Input
                        value={analysisForm.name}
                        onChange={(event) => setAnalysisForm((state) => ({ ...state, name: event.target.value }))}
                        className="rounded-xl"
                      />
                    </div>

                    <div className="space-y-2">
                      <Label>Job Type</Label>
                      <Input
                        value={analysisForm.jobType}
                        onChange={(event) => setAnalysisForm((state) => ({ ...state, jobType: event.target.value }))}
                        placeholder="regression, clustering, qa"
                        className="rounded-xl"
                      />
                    </div>

                    <div className="space-y-2">
                      <Label>Dataset</Label>
                      <select
                        title="Select dataset for analysis"
                        aria-label="Select dataset for analysis"
                        value={analysisForm.datasetId}
                        onChange={(event) => setAnalysisForm((state) => ({ ...state, datasetId: event.target.value }))}
                        className="h-11 w-full rounded-xl border border-slate-200 bg-white px-3 text-sm"
                      >
                        <option value="">No dataset selected</option>
                        {datasetOptions.map((dataset) => (
                          <option key={dataset.id} value={dataset.id}>
                            {dataset.name}
                          </option>
                        ))}
                      </select>
                    </div>

                    <div className="space-y-2">
                      <Label>Description</Label>
                      <Input
                        value={analysisForm.description}
                        onChange={(event) => setAnalysisForm((state) => ({ ...state, description: event.target.value }))}
                        className="rounded-xl"
                      />
                    </div>

                    <div className="space-y-2 md:col-span-2">
                      <label className="flex items-center gap-2 text-sm text-slate-700">
                        <input
                          type="checkbox"
                          checked={analysisForm.autoPipeline}
                          onChange={(event) =>
                            setAnalysisForm((state) => ({ ...state, autoPipeline: event.target.checked }))
                          }
                          className="h-4 w-4 rounded border-slate-300"
                        />
                        Trigger full automated pipeline (ingest, validate, transform, train, evaluate, report)
                      </label>
                    </div>

                    {analysisForm.autoPipeline ? (
                      <div className="space-y-2">
                        <Label>Automation Analysis Type</Label>
                        <select
                          title="Select automated analysis type"
                          aria-label="Select automated analysis type"
                          value={analysisForm.analysisType}
                          onChange={(event) =>
                            setAnalysisForm((state) => ({ ...state, analysisType: event.target.value }))
                          }
                          className="h-11 w-full rounded-xl border border-slate-200 bg-white px-3 text-sm"
                        >
                          <option value="classification">Classification</option>
                          <option value="regression">Regression</option>
                          <option value="clustering">Clustering</option>
                          <option value="forecasting">Forecasting</option>
                        </select>
                      </div>
                    ) : null}

                    <div className="space-y-2 md:col-span-2">
                      <Label>Parameters JSON</Label>
                      <Textarea
                        value={analysisForm.parametersJson}
                        onChange={(event) => setAnalysisForm((state) => ({ ...state, parametersJson: event.target.value }))}
                        className="min-h-37.5 rounded-xl font-mono text-sm"
                      />
                    </div>

                    <div className="flex justify-end gap-2 md:col-span-2">
                      <Button
                        variant="outline"
                        className="rounded-xl"
                        onClick={() => setUi((state) => ({ ...state, creatingAnalysis: false }))}
                      >
                        Cancel
                      </Button>
                      <Button
                        onClick={() => void handleCreateAnalysisJob()}
                        disabled={busy || (analysisForm.autoPipeline && !analysisForm.datasetId)}
                        className="rounded-xl bg-linear-to-r from-indigo-500 to-violet-600 text-white"
                      >
                        <PlayCircle className="mr-2 h-4 w-4" />
                        Queue Analysis
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ) : null}

              <div className="grid gap-4">
                {workspace.analysisJobs.length === 0 ? (
                  <EmptyCard label="No analysis jobs created yet." />
                ) : (
                  workspace.analysisJobs.map((job) => (
                    <Card key={job.id} className="rounded-2xl border-slate-200 bg-white shadow-sm">
                      <CardContent className="flex flex-col gap-4 p-5 lg:flex-row lg:items-center lg:justify-between">
                        <div className="space-y-2">
                          <div className="flex flex-wrap items-center gap-2">
                            <p className="text-sm font-semibold text-slate-900">{job.name}</p>
                            <AnalysisStatusBadge status={job.status} />
                            <Badge variant="outline" className="rounded-full">
                              {job.jobType}
                            </Badge>
                          </div>
                          <p className="text-xs text-slate-500">
                            {job.description || "No description"} • Dataset: {job.dataset?.name || "None"}
                          </p>
                        </div>

                        <div className="flex flex-wrap gap-2">
                          {canWorkspace(currentRole, "cancelAnalysis") &&
                            (job.status === "QUEUED" || job.status === "RUNNING") && (
                              <Button
                                variant="outline"
                                disabled={busy}
                                onClick={() => void handleCancelAnalysis(job.id)}
                                className="rounded-xl border-amber-200 text-amber-700 hover:bg-amber-50"
                              >
                                <MoreHorizontal className="mr-2 h-4 w-4" />
                                Cancel
                              </Button>
                            )}
                        </div>
                      </CardContent>
                    </Card>
                  ))
                )}
              </div>
            </TabsContent>

            <TabsContent value="pipelines" className="space-y-6">
              <div className="flex flex-wrap justify-end gap-2">
                {canWorkspace(currentRole, "createAnalysis") ? (
                  <Button
                    className="rounded-xl bg-linear-to-r from-indigo-500 to-violet-600 text-white"
                    onClick={() => setUi((state) => ({ ...state, creatingPipeline: !state.creatingPipeline }))}
                  >
                    <PlayCircle className="mr-2 h-4 w-4" />
                    Start Automated Pipeline
                  </Button>
                ) : null}
              </div>

              {ui.creatingPipeline && canWorkspace(currentRole, "createAnalysis") ? (
                <Card className="rounded-2xl border-slate-200 bg-white shadow-sm">
                  <CardHeader>
                    <CardTitle>Start Pipeline Run</CardTitle>
                    <CardDescription>Queue the full research automation path for a workspace dataset.</CardDescription>
                  </CardHeader>
                  <CardContent className="grid gap-4 md:grid-cols-2">
                    <div className="space-y-2">
                      <Label>Run Name</Label>
                      <Input
                        value={pipelineForm.name}
                        onChange={(event) => setPipelineForm((state) => ({ ...state, name: event.target.value }))}
                        placeholder="Automated cancer cohort pipeline"
                        className="rounded-xl"
                      />
                    </div>

                    <div className="space-y-2">
                      <Label>Dataset</Label>
                      <select
                        title="Select dataset for pipeline"
                        aria-label="Select dataset for pipeline"
                        value={pipelineForm.datasetId}
                        onChange={(event) => setPipelineForm((state) => ({ ...state, datasetId: event.target.value }))}
                        className="h-11 w-full rounded-xl border border-slate-200 bg-white px-3 text-sm"
                      >
                        <option value="">Select a dataset</option>
                        {datasetOptions.map((dataset) => (
                          <option key={dataset.id} value={dataset.id}>
                            {dataset.name}
                          </option>
                        ))}
                      </select>
                    </div>

                    <div className="space-y-2">
                      <Label>Analysis Type</Label>
                      <select
                        title="Select analysis type"
                        aria-label="Select analysis type"
                        value={pipelineForm.analysisType}
                        onChange={(event) => setPipelineForm((state) => ({ ...state, analysisType: event.target.value }))}
                        className="h-11 w-full rounded-xl border border-slate-200 bg-white px-3 text-sm"
                      >
                        <option value="classification">Classification</option>
                        <option value="regression">Regression</option>
                        <option value="clustering">Clustering</option>
                        <option value="forecasting">Forecasting</option>
                      </select>
                    </div>

                    <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4 text-sm text-slate-600">
                      This queues ingest, validation, transformation, training, evaluation, charts, report generation, export, and publish.
                    </div>

                    <div className="flex justify-end gap-2 md:col-span-2">
                      <Button
                        variant="outline"
                        className="rounded-xl"
                        onClick={() => setUi((state) => ({ ...state, creatingPipeline: false }))}
                      >
                        Cancel
                      </Button>
                      <Button
                        onClick={() => void handleCreatePipelineRun()}
                        disabled={busy || !pipelineForm.name.trim() || !pipelineForm.datasetId}
                        className="rounded-xl bg-linear-to-r from-indigo-500 to-violet-600 text-white"
                      >
                        <PlayCircle className="mr-2 h-4 w-4" />
                        Queue Pipeline
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ) : null}

              <div className="grid gap-4">
                {pipelineLoading ? (
                  <EmptyCard label="Loading pipeline runs..." />
                ) : pipelineRuns.length === 0 ? (
                  <EmptyCard label="No pipeline runs created yet." />
                ) : (
                  pipelineRuns.map((run) => (
                    <Card key={run.id} className="rounded-2xl border-slate-200 bg-white shadow-sm">
                      <CardContent className="space-y-4 p-5">
                        <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
                          <div className="space-y-2">
                            <div className="flex flex-wrap items-center gap-2">
                              <p className="text-sm font-semibold text-slate-900">{run.name}</p>
                              <Badge variant="outline" className="rounded-full">{run.status}</Badge>
                              <Badge variant="outline" className="rounded-full border-blue-200 bg-blue-50 text-blue-700">
                                {Math.round(run.progressPercent)}%
                              </Badge>
                            </div>
                            <p className="text-xs text-slate-500">
                              Dataset: {datasetOptions.find((dataset) => dataset.id === run.datasetId)?.name || "Unknown"} • Started: {run.startedAt ? new Date(run.startedAt).toLocaleString() : "Pending"}
                            </p>
                            {run.failureReason ? (
                              <p className="text-xs text-rose-600">{run.failureReason}</p>
                            ) : null}
                          </div>

                          <div className="flex flex-wrap gap-2">
                            <Button asChild variant="outline" className="rounded-xl border-slate-200">
                              <Link href={`/dashboard/workspaces/${workspace.id}/pipelines/${run.id}`}>Open Live View</Link>
                            </Button>
                            {(run.status === "QUEUED" || run.status === "RUNNING") ? (
                              <Button
                                variant="outline"
                                disabled={busy}
                                onClick={() => void handleCancelPipelineRun(run.id)}
                                className="rounded-xl border-amber-200 text-amber-700 hover:bg-amber-50"
                              >
                                Cancel
                              </Button>
                            ) : null}
                            {(run.status === "FAILED" || run.status === "CANCELED") ? (
                              <Button
                                variant="outline"
                                disabled={busy}
                                onClick={() => void handleResumePipelineRun(run.id)}
                                className="rounded-xl border-emerald-200 text-emerald-700 hover:bg-emerald-50"
                              >
                                Resume
                              </Button>
                            ) : null}
                          </div>
                        </div>

                        <progress
                          className="h-2 w-full overflow-hidden rounded-full [&::-webkit-progress-bar]:bg-slate-100 [&::-webkit-progress-value]:bg-indigo-500 [&::-moz-progress-bar]:bg-indigo-500"
                          max={100}
                          value={Math.max(0, Math.min(100, run.progressPercent))}
                        />

                        <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
                          {run.steps.slice(0, 6).map((step) => (
                            <div key={step.id} className="rounded-xl border border-slate-200 bg-slate-50 p-3">
                              <div className="flex items-center justify-between gap-2">
                                <span className="text-sm font-medium text-slate-900">{step.order}. {step.name}</span>
                                <span className="text-xs text-slate-500">{step.status}</span>
                              </div>
                              <progress
                                className="mt-2 h-1.5 w-full overflow-hidden rounded-full [&::-webkit-progress-bar]:bg-white [&::-webkit-progress-value]:bg-indigo-500 [&::-moz-progress-bar]:bg-indigo-500"
                                max={100}
                                value={Math.max(0, Math.min(100, step.progressPercent))}
                              />
                            </div>
                          ))}
                        </div>
                      </CardContent>
                    </Card>
                  ))
                )}
              </div>
            </TabsContent>

            <TabsContent value="reports" className="space-y-6">
              {ui.creatingReport && canWorkspace(currentRole, "createReport") ? (
                <Card className="rounded-2xl border-slate-200 bg-white shadow-sm">
                  <CardHeader>
                    <CardTitle>Create Report</CardTitle>
                    <CardDescription>Generate a report tied to this workspace.</CardDescription>
                  </CardHeader>
                  <CardContent className="grid gap-4 md:grid-cols-2">
                    <div className="space-y-2">
                      <Label>Title</Label>
                      <Input
                        value={reportForm.title}
                        onChange={(event) => setReportForm((state) => ({ ...state, title: event.target.value }))}
                        placeholder={reportForm.file?.name || "Report title"}
                        className="rounded-xl"
                      />
                    </div>

                    <div className="space-y-2">
                      <Label>Report Type</Label>
                      <Input
                        value={reportForm.reportType}
                        onChange={(event) => setReportForm((state) => ({ ...state, reportType: event.target.value }))}
                        placeholder="summary, dashboard-export, manuscript"
                        className="rounded-xl"
                      />
                    </div>

                    <div className="space-y-2 md:col-span-2">
                      <Label>Report File</Label>
                      <Input
                        type="file"
                        onChange={(event) =>
                          setReportForm((state) => ({ ...state, file: event.target.files?.[0] ?? null }))
                        }
                        className="rounded-xl"
                      />
                    </div>

                    <div className="space-y-2 md:col-span-2">
                      <Label>Description</Label>
                      <Textarea
                        value={reportForm.description}
                        onChange={(event) => setReportForm((state) => ({ ...state, description: event.target.value }))}
                        className="min-h-27.5 rounded-xl"
                      />
                    </div>

                    <div className="space-y-2 md:col-span-2">
                      <Label>Dataset IDs (comma separated)</Label>
                      <Input
                        value={reportForm.datasetIds}
                        onChange={(event) => setReportForm((state) => ({ ...state, datasetIds: event.target.value }))}
                        placeholder={datasetOptions.map((dataset) => dataset.id).join(", ")}
                        className="rounded-xl"
                      />
                    </div>

                    <div className="space-y-2 md:col-span-2">
                      <Label>Metadata JSON</Label>
                      <Textarea
                        value={reportForm.metadataJson}
                        onChange={(event) => setReportForm((state) => ({ ...state, metadataJson: event.target.value }))}
                        className="min-h-37.5 rounded-xl font-mono text-sm"
                      />
                    </div>

                    <div className="flex justify-end gap-2 md:col-span-2">
                      <Button
                        variant="outline"
                        className="rounded-xl"
                        onClick={() => setUi((state) => ({ ...state, creatingReport: false }))}
                      >
                        Cancel
                      </Button>
                      <Button
                        onClick={() => void handleCreateReport()}
                        disabled={busy || !reportForm.file}
                        className="rounded-xl bg-linear-to-r from-indigo-500 to-violet-600 text-white"
                      >
                        <FileText className="mr-2 h-4 w-4" />
                        Upload Report
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ) : null}

              <div className="grid gap-4">
                {workspace.reports.length === 0 ? (
                  <EmptyCard label="No reports generated yet." />
                ) : (
                  workspace.reports.map((report) => (
                    <Card key={report.id} className="rounded-2xl border-slate-200 bg-white shadow-sm">
                      <CardContent className="flex flex-col gap-4 p-5 lg:flex-row lg:items-center lg:justify-between">
                        <div className="space-y-2">
                          <div className="flex flex-wrap items-center gap-2">
                            <p className="text-sm font-semibold text-slate-900">{report.title}</p>
                            <ReportStatusBadge status={report.status} />
                            <Badge variant="outline" className="rounded-full">
                              {report.reportType}
                            </Badge>
                          </div>
                          <p className="text-xs text-slate-500">
                            {report.description || "No description"} • {report.datasets?.length ?? 0} linked datasets
                          </p>
                        </div>

                        <div className="flex flex-wrap gap-2">
                          {canWorkspace(currentRole, "downloadReport") && (
                            <Button
                              variant="outline"
                              className="rounded-xl border-slate-200"
                              onClick={() => openExternal(report.publicUrl || report.storagePath)}
                              disabled={!report.publicUrl && !report.storagePath}
                            >
                              {report.publicUrl || report.storagePath ? (
                                <Globe className="mr-2 h-4 w-4" />
                              ) : (
                                <Lock className="mr-2 h-4 w-4" />
                              )}
                              Download
                            </Button>
                          )}

                          {canWorkspace(currentRole, "deleteReport") && (
                            <Button
                              variant="outline"
                              disabled={busy}
                              onClick={() => void handleDeleteReport(report.id)}
                              className="rounded-xl border-rose-200 text-rose-600 hover:bg-rose-50"
                            >
                              <Trash2 className="mr-2 h-4 w-4" />
                              Delete
                            </Button>
                          )}
                        </div>
                      </CardContent>
                    </Card>
                  ))
                )}
              </div>
            </TabsContent>
          </Tabs>
        </div>
      </div>
    </div>
  );
}

function MetricCard({
  icon,
  label,
  value,
}: {
  icon: ReactNode;
  label: string;
  value: string;
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

function InfoBox({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
      <p className="text-xs font-medium uppercase tracking-wide text-slate-400">{label}</p>
      <p className="mt-2 text-sm font-semibold text-slate-900">{value}</p>
    </div>
  );
}

function EmptyCard({ label }: { label: string }) {
  return (
    <Card className="rounded-2xl border-slate-200 bg-white shadow-sm">
      <CardContent className="p-6 text-sm text-slate-500">{label}</CardContent>
    </Card>
  );
}

function safeJsonParse(value: string) {
  try {
    return JSON.parse(value);
  } catch {
    return undefined;
  }
}
