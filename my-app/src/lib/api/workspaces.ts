import { apiRequest } from "./client";

export type WorkspaceRole = "OWNER" | "ADMIN" | "RESEARCHER" | "VIEWER";
export type WorkspaceStatus = "ACTIVE" | "ARCHIVED";
export type DatasetVisibility = "PRIVATE" | "WORKSPACE" | "PUBLIC" | "RESTRICTED";
export type AnalysisJobStatus = "QUEUED" | "RUNNING" | "SUCCEEDED" | "FAILED" | "CANCELLED";
export type ReportStatus = "DRAFT" | "READY" | "ARCHIVED";
export type PipelineRunStatus = "DRAFT" | "QUEUED" | "RUNNING" | "SUCCEEDED" | "FAILED" | "CANCELED" | "PARTIAL_SUCCESS";
export type PipelineStepStatus = "PENDING" | "QUEUED" | "RUNNING" | "SUCCEEDED" | "FAILED" | "SKIPPED" | "CANCELED";
export type PipelineStepType =
  | "INGEST"
  | "PROFILE"
  | "VALIDATE"
  | "CLEAN"
  | "TRANSFORM"
  | "FEATURE_ENGINEERING"
  | "SPLIT"
  | "TRAIN"
  | "EVALUATE"
  | "EXPLAIN"
  | "CHART"
  | "REPORT"
  | "EXPORT"
  | "PUBLISH";
export type NotificationSeverity = "info" | "success" | "warning";
export type NotificationType =
  | "request_created"
  | "request_reviewed"
  | "request_comment"
  | "dataset_added"
  | "report_created"
  | "member_added";

export type PlatformUser = {
  id: string;
  name?: string | null;
  email: string;
};

export type WorkspaceMember = {
  id: string;
  role: WorkspaceRole;
  joinedAt?: string;
  isActive?: boolean;
  user: PlatformUser;
};

export type Dataset = {
  id: string;
  name: string;
  description?: string | null;
  version: number;
  visibility: DatasetVisibility;
  storagePath?: string | null;
  mimeType?: string | null;
  sizeBytes?: number | null;
  recordCount?: number | null;
  tags: string[];
  createdAt: string;
  updatedAt: string;
  createdBy?: PlatformUser;
};

export type AnalysisJob = {
  id: string;
  name: string;
  description?: string | null;
  status: AnalysisJobStatus;
  jobType: string;
  parametersJson?: unknown;
  resultsJson?: unknown;
  logsText?: string | null;
  startedAt?: string | null;
  completedAt?: string | null;
  failedAt?: string | null;
  createdAt: string;
  updatedAt: string;
  createdBy?: PlatformUser;
  dataset?: Dataset | null;
};

export type Report = {
  id: string;
  title: string;
  description?: string | null;
  status: ReportStatus;
  reportType: string;
  storagePath?: string | null;
  publicUrl?: string | null;
  metadataJson?: unknown;
  createdAt: string;
  updatedAt: string;
  createdBy?: PlatformUser;
  datasets?: Dataset[];
};

export type NotificationItem = {
  id: string;
  userId: string;
  workspaceId?: string | null;
  type: NotificationType;
  title: string;
  description: string;
  severity: NotificationSeverity;
  isRead: boolean;
  readAt?: string | null;
  link?: string | null;
  createdAt: string;
};

export type PipelineStep = {
  id: string;
  order: number;
  name: string;
  type: PipelineStepType;
  status: PipelineStepStatus;
  progressPercent: number;
  workerType?: string | null;
  failureReason?: string | null;
  startedAt?: string | null;
  completedAt?: string | null;
  metricsJson?: unknown;
  outputJson?: unknown;
};

export type PipelineEvent = {
  id: string;
  stepOrder?: number | null;
  eventType: string;
  level: string;
  message: string;
  dataJson?: unknown;
  createdAt: string;
};

export type PipelineArtifact = {
  id: string;
  kind: string;
  name: string;
  storageKey: string;
  mimeType?: string | null;
  createdAt: string;
};

export type WorkerJob = {
  id: string;
  queueName: string;
  jobName: string;
  workerType: string;
  status: string;
  progressPercent: number;
  startedAt?: string | null;
  completedAt?: string | null;
};

export type PipelineRun = {
  id: string;
  workspaceId: string;
  datasetId?: string | null;
  requestId?: string | null;
  name: string;
  status: PipelineRunStatus;
  currentStepIndex: number;
  progressPercent: number;
  failureReason?: string | null;
  startedAt?: string | null;
  completedAt?: string | null;
  canceledAt?: string | null;
  parametersJson?: unknown;
  metricsJson?: unknown;
  createdAt: string;
  updatedAt: string;
  steps: PipelineStep[];
  events?: PipelineEvent[];
  artifacts?: PipelineArtifact[];
  jobs?: WorkerJob[];
};

export type WorkspaceCount = {
  datasets: number;
  analysisJobs: number;
  reports: number;
  members: number;
};

export type Workspace = {
  id: string;
  name: string;
  description?: string | null;
  status: WorkspaceStatus;
  owner: PlatformUser;
  members: WorkspaceMember[];
  datasets: Dataset[];
  analysisJobs: AnalysisJob[];
  reports: Report[];
  _count: WorkspaceCount;
  currentUserRole: WorkspaceRole;
  createdAt: string;
  updatedAt: string;
};

export type CreateWorkspacePayload = {
  name: string;
  description?: string;
};

export type UpdateWorkspacePayload = Partial<CreateWorkspacePayload>;

export type AddWorkspaceMemberPayload = {
  userId: string;
  role: WorkspaceRole;
};

export type UpdateWorkspaceMemberRolePayload = {
  role: WorkspaceRole;
};

export type CreateDatasetPayload = {
  name: string;
  description?: string;
  visibility?: DatasetVisibility;
  recordCount?: number;
  tags?: string[];
};

export type CreateAnalysisJobPayload = {
  name: string;
  description?: string;
  jobType: string;
  datasetId?: string;
  parametersJson?: unknown;
  autoPipeline?: boolean;
  analysisType?: string;
};

export type CreateReportPayload = {
  title: string;
  reportType: string;
  description?: string;
  datasetIds?: string[];
  metadataJson?: unknown;
};

export type UploadDatasetPayload = CreateDatasetPayload & {
  file: File;
  autoRunPipeline?: boolean;
};

export type UploadReportPayload = CreateReportPayload & {
  file: File;
};

type WorkspacesEnvelope = { workspaces: Workspace[] };
type WorkspaceEnvelope = { workspace: Workspace };
type MembersEnvelope = { members: WorkspaceMember[] };
type MemberEnvelope = { member: WorkspaceMember };
type DatasetsEnvelope = { datasets: Dataset[] };
type DatasetEnvelope = { dataset: Dataset };
type AnalysisJobsEnvelope = { analysisJobs: AnalysisJob[] };
type AnalysisJobEnvelope = { analysisJob: AnalysisJob };
type ReportsEnvelope = { reports: Report[] };
type ReportEnvelope = { report: Report };
type NotificationsEnvelope = { notifications: NotificationItem[] };
type NotificationEnvelope = { notification: NotificationItem };
type UnreadCountEnvelope = { count: number };
type PipelineRunEnvelope = { run: PipelineRun };
type PipelineRunsEnvelope = { runs: PipelineRun[] };

function appendIfPresent(formData: FormData, key: string, value: string | number | undefined) {
  if (value === undefined) {
    return;
  }

  const normalized = typeof value === "number" ? String(value) : value;
  if (normalized !== "") {
    formData.append(key, normalized);
  }
}

export async function getMyWorkspaces() {
  const data = await apiRequest<WorkspacesEnvelope>("/workspaces/mine");
  return data.workspaces;
}

export async function getWorkspace(workspaceId: string) {
  const data = await apiRequest<WorkspaceEnvelope>(`/workspaces/${workspaceId}`);
  return data.workspace;
}

export async function createWorkspace(payload: CreateWorkspacePayload) {
  const data = await apiRequest<WorkspaceEnvelope>("/workspaces", {
    method: "POST",
    json: payload,
  });
  return data.workspace;
}

export async function updateWorkspace(workspaceId: string, payload: UpdateWorkspacePayload) {
  const data = await apiRequest<WorkspaceEnvelope>(`/workspaces/${workspaceId}`, {
    method: "PATCH",
    json: payload,
  });
  return data.workspace;
}

export async function archiveWorkspace(workspaceId: string) {
  const data = await apiRequest<WorkspaceEnvelope>(`/workspaces/${workspaceId}/archive`, {
    method: "PATCH",
  });
  return data.workspace;
}

export async function listWorkspaceMembers(workspaceId: string) {
  const data = await apiRequest<MembersEnvelope>(`/workspaces/${workspaceId}/members`);
  return data.members;
}

export async function addWorkspaceMember(workspaceId: string, payload: AddWorkspaceMemberPayload) {
  const data = await apiRequest<MemberEnvelope>(`/workspaces/${workspaceId}/members`, {
    method: "POST",
    json: payload,
  });
  return data.member;
}

export async function updateWorkspaceMemberRole(
  workspaceId: string,
  memberUserId: string,
  payload: UpdateWorkspaceMemberRolePayload,
) {
  const data = await apiRequest<MemberEnvelope>(`/workspaces/${workspaceId}/members/${memberUserId}/role`, {
    method: "PATCH",
    json: payload,
  });
  return data.member;
}

export async function removeWorkspaceMember(workspaceId: string, memberUserId: string) {
  await apiRequest<void>(`/workspaces/${workspaceId}/members/${memberUserId}`, {
    method: "DELETE",
  });
}

export async function listDatasets(workspaceId: string) {
  const data = await apiRequest<DatasetsEnvelope>(`/workspaces/${workspaceId}/datasets`);
  return data.datasets;
}

export async function createDataset(workspaceId: string, payload: CreateDatasetPayload) {
  const data = await apiRequest<DatasetEnvelope>(`/workspaces/${workspaceId}/datasets`, {
    method: "POST",
    json: payload,
  });
  return data.dataset;
}

export async function uploadDataset(workspaceId: string, payload: UploadDatasetPayload) {
  const formData = new FormData();
  formData.append("file", payload.file);
  appendIfPresent(formData, "name", payload.name);
  appendIfPresent(formData, "description", payload.description);
  appendIfPresent(formData, "visibility", payload.visibility);
  appendIfPresent(formData, "recordCount", payload.recordCount);
  appendIfPresent(formData, "tags", payload.tags?.join(","));
  appendIfPresent(formData, "autoRunPipeline", payload.autoRunPipeline === undefined ? undefined : String(payload.autoRunPipeline));

  const data = await apiRequest<DatasetEnvelope>(`/workspaces/${workspaceId}/datasets/upload`, {
    method: "POST",
    json: formData,
  });
  return data.dataset;
}

export async function deleteDataset(workspaceId: string, datasetId: string) {
  await apiRequest<void>(`/workspaces/${workspaceId}/datasets/${datasetId}`, {
    method: "DELETE",
  });
}

export async function listAnalysisJobs(workspaceId: string) {
  const data = await apiRequest<AnalysisJobsEnvelope>(`/workspaces/${workspaceId}/analysis-jobs`);
  return data.analysisJobs;
}

export async function createAnalysisJob(workspaceId: string, payload: CreateAnalysisJobPayload) {
  const data = await apiRequest<AnalysisJobEnvelope>(`/workspaces/${workspaceId}/analysis-jobs`, {
    method: "POST",
    json: payload,
  });
  return data.analysisJob;
}

export async function cancelAnalysisJob(workspaceId: string, jobId: string) {
  const data = await apiRequest<AnalysisJobEnvelope>(`/workspaces/${workspaceId}/analysis-jobs/${jobId}/cancel`, {
    method: "PATCH",
  });
  return data.analysisJob;
}

export async function listReports(workspaceId: string) {
  const data = await apiRequest<ReportsEnvelope>(`/workspaces/${workspaceId}/reports`);
  return data.reports;
}

export async function createReport(workspaceId: string, payload: CreateReportPayload) {
  const data = await apiRequest<ReportEnvelope>(`/workspaces/${workspaceId}/reports`, {
    method: "POST",
    json: payload,
  });
  return data.report;
}

export async function uploadReport(workspaceId: string, payload: UploadReportPayload) {
  const formData = new FormData();
  formData.append("file", payload.file);
  appendIfPresent(formData, "title", payload.title);
  appendIfPresent(formData, "reportType", payload.reportType);
  appendIfPresent(formData, "description", payload.description);
  appendIfPresent(formData, "datasetIds", payload.datasetIds?.join(","));
  appendIfPresent(
    formData,
    "metadataJson",
    payload.metadataJson === undefined ? undefined : JSON.stringify(payload.metadataJson),
  );

  const data = await apiRequest<ReportEnvelope>(`/workspaces/${workspaceId}/reports/upload`, {
    method: "POST",
    json: formData,
  });
  return data.report;
}

export async function getNotifications() {
  const data = await apiRequest<NotificationsEnvelope>("/notifications");
  return data.notifications;
}

export async function getUnreadNotificationCount() {
  return apiRequest<UnreadCountEnvelope>("/notifications/unread-count");
}

export async function markNotificationRead(notificationId: string) {
  const data = await apiRequest<NotificationEnvelope>(`/notifications/${notificationId}/read`, {
    method: "PATCH",
  });
  return data.notification;
}

export async function markAllNotificationsRead() {
  return apiRequest<UnreadCountEnvelope>("/notifications/read-all", {
    method: "PATCH",
  });
}

export async function deleteReport(workspaceId: string, reportId: string) {
  await apiRequest<void>(`/workspaces/${workspaceId}/reports/${reportId}`, {
    method: "DELETE",
  });
}

export async function createPipelineRun(payload: {
  workspaceId: string;
  datasetId?: string;
  requestId?: string;
  templateCode?: string;
  name: string;
  parameters?: Record<string, unknown>;
}) {
  const data = await apiRequest<PipelineRunEnvelope>("/pipeline-runs", {
    method: "POST",
    json: payload,
  });
  return data.run;
}

export async function listWorkspacePipelineRuns(workspaceId: string) {
  const data = await apiRequest<PipelineRunsEnvelope>(`/pipeline-runs/workspace/${workspaceId}`);
  return data.runs;
}

export async function getPipelineRun(runId: string) {
  const data = await apiRequest<PipelineRunEnvelope>(`/pipeline-runs/${runId}`);
  return data.run;
}

export async function cancelPipelineRun(runId: string, reason?: string) {
  return apiRequest<{ success: boolean }>(`/pipeline-runs/${runId}/cancel`, {
    method: "POST",
    json: { reason },
  });
}

export async function resumePipelineRun(runId: string, reason?: string) {
  const data = await apiRequest<PipelineRunEnvelope>(`/pipeline-runs/${runId}/resume`, {
    method: "POST",
    json: { reason },
  });
  return data.run;
}