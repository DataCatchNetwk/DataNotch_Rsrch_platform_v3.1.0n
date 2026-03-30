\
/**
 * analysis-jobs-api-client.ts
 *
 * Production-ready API contract + client wiring for the Analysis Jobs page.
 *
 * Recommended placement:
 * src/lib/api/analysis-jobs-api-client.ts
 *
 * Use with:
 * app/dashboard/analysis/page.tsx
 */

export type JobStatus = "QUEUED" | "RUNNING" | "SUCCEEDED" | "FAILED" | "CANCELLED";

export type AnalysisJob = {
  id: string;
  name: string;
  dataset: string;
  workspace: string;
  analysisType: string;
  status: JobStatus;
  submittedAt: string;
  updatedAt: string;
  runtimeMinutes: number | null;
  owner: string;
  hasArtifacts: boolean;
  pipeline?: string;
  params?: Record<string, string | number | boolean>;
  logs?: string[];
};

export type AnalysisJobsListQuery = {
  search?: string;
  status?: "ALL" | JobStatus;
  workspaceId?: string;
  datasetId?: string;
  sortBy?: "Newest" | "Oldest" | "Runtime" | "Status" | "Last Updated";
  submittedDate?: string;
  page?: number;
  pageSize?: number;
};

export type AnalysisJobsListItemDto = {
  id: string;
  jobName: string;
  datasetName: string;
  workspaceName: string;
  analysisType: string;
  status: JobStatus;
  submittedAt: string;
  updatedAt: string;
  runtimeMinutes: number | null;
  ownerName: string;
  artifactCount: number;
  pipelineName?: string | null;
};

export type AnalysisJobDetailsDto = {
  id: string;
  jobName: string;
  datasetName: string;
  workspaceName: string;
  analysisType: string;
  status: JobStatus;
  submittedAt: string;
  updatedAt: string;
  runtimeMinutes: number | null;
  ownerName: string;
  artifactCount: number;
  pipelineName?: string | null;
  params?: Record<string, string | number | boolean> | null;
  logs?: string[] | null;
};

export type PaginatedResponse<T> = {
  items: T[];
  total: number;
  page: number;
  pageSize: number;
};

export type RetryJobResponse = {
  ok: true;
  newJobId?: string;
  message?: string;
};

export type CancelJobResponse = {
  ok: true;
  message?: string;
};

export type BulkJobActionResponse = {
  ok: true;
  processedIds: string[];
  skippedIds?: string[];
  message?: string;
};

export class ApiError extends Error {
  status: number;
  payload?: unknown;

  constructor(message: string, status: number, payload?: unknown) {
    super(message);
    this.name = "ApiError";
    this.status = status;
    this.payload = payload;
  }
}

const API_BASE =
  process.env.NEXT_PUBLIC_API_BASE_URL?.replace(/\/$/, "") ?? "http://localhost:4000";

const API_PREFIX = "/api/v1";

function buildUrl(path: string, query?: Record<string, string | number | undefined>) {
  const url = new URL(`${API_BASE}${API_PREFIX}${path}`);
  if (query) {
    Object.entries(query).forEach(([key, value]) => {
      if (value !== undefined && value !== "") url.searchParams.set(key, String(value));
    });
  }
  return url.toString();
}

async function request<T>(path: string, init?: RequestInit, query?: Record<string, string | number | undefined>): Promise<T> {
  const res = await fetch(buildUrl(path, query), {
    ...init,
    headers: {
      "Content-Type": "application/json",
      ...(init?.headers ?? {}),
    },
    credentials: "include",
    cache: "no-store",
  });

  let payload: unknown = null;
  const contentType = res.headers.get("content-type") || "";

  if (contentType.includes("application/json")) {
    payload = await res.json();
  } else {
    payload = await res.text();
  }

  if (!res.ok) {
    const message =
      typeof payload === "object" &&
      payload !== null &&
      "message" in payload &&
      typeof (payload as { message?: unknown }).message === "string"
        ? (payload as { message: string }).message
        : `Request failed with status ${res.status}`;
    throw new ApiError(message, res.status, payload);
  }

  return payload as T;
}

function mapListItem(dto: AnalysisJobsListItemDto): AnalysisJob {
  return {
    id: dto.id,
    name: dto.jobName,
    dataset: dto.datasetName,
    workspace: dto.workspaceName,
    analysisType: dto.analysisType,
    status: dto.status,
    submittedAt: dto.submittedAt,
    updatedAt: dto.updatedAt,
    runtimeMinutes: dto.runtimeMinutes,
    owner: dto.ownerName,
    hasArtifacts: dto.artifactCount > 0,
    pipeline: dto.pipelineName ?? undefined,
  };
}

function mapDetails(dto: AnalysisJobDetailsDto): AnalysisJob {
  return {
    id: dto.id,
    name: dto.jobName,
    dataset: dto.datasetName,
    workspace: dto.workspaceName,
    analysisType: dto.analysisType,
    status: dto.status,
    submittedAt: dto.submittedAt,
    updatedAt: dto.updatedAt,
    runtimeMinutes: dto.runtimeMinutes,
    owner: dto.ownerName,
    hasArtifacts: dto.artifactCount > 0,
    pipeline: dto.pipelineName ?? undefined,
    params: dto.params ?? undefined,
    logs: dto.logs ?? undefined,
  };
}

function normalizeSort(sortBy?: AnalysisJobsListQuery["sortBy"]) {
  switch (sortBy) {
    case "Newest":
      return "submittedAt:desc";
    case "Oldest":
      return "submittedAt:asc";
    case "Runtime":
      return "runtimeMinutes:desc";
    case "Status":
      return "status:asc";
    case "Last Updated":
      return "updatedAt:desc";
    default:
      return undefined;
  }
}

/**
 * Expected backend endpoints
 *
 * GET    /api/v1/analysis-jobs
 * GET    /api/v1/analysis-jobs/:jobId
 * POST   /api/v1/analysis-jobs/:jobId/retry
 * POST   /api/v1/analysis-jobs/:jobId/cancel
 * POST   /api/v1/analysis-jobs/bulk/retry
 * POST   /api/v1/analysis-jobs/bulk/cancel
 * GET    /api/v1/analysis-jobs/:jobId/download
 * GET    /api/v1/analysis-jobs/:jobId/logs/download
 */

export async function listAnalysisJobs(query: AnalysisJobsListQuery = {}) {
  const result = await request<PaginatedResponse<AnalysisJobsListItemDto>>(
    "/analysis-jobs",
    { method: "GET" },
    {
      search: query.search,
      status: query.status && query.status !== "ALL" ? query.status : undefined,
      workspaceId: query.workspaceId,
      datasetId: query.datasetId,
      sort: normalizeSort(query.sortBy),
      submittedDate: query.submittedDate,
      page: query.page,
      pageSize: query.pageSize,
    }
  );

  return {
    ...result,
    items: result.items.map(mapListItem),
  };
}

export async function getAnalysisJob(jobId: string) {
  const dto = await request<AnalysisJobDetailsDto>(`/analysis-jobs/${jobId}`, {
    method: "GET",
  });
  return mapDetails(dto);
}

export async function retryAnalysisJob(jobId: string) {
  return request<RetryJobResponse>(`/analysis-jobs/${jobId}/retry`, {
    method: "POST",
  });
}

export async function cancelAnalysisJob(jobId: string) {
  return request<CancelJobResponse>(`/analysis-jobs/${jobId}/cancel`, {
    method: "POST",
  });
}

export async function retryAnalysisJobsBulk(jobIds: string[]) {
  return request<BulkJobActionResponse>("/analysis-jobs/bulk/retry", {
    method: "POST",
    body: JSON.stringify({ jobIds }),
  });
}

export async function cancelAnalysisJobsBulk(jobIds: string[]) {
  return request<BulkJobActionResponse>("/analysis-jobs/bulk/cancel", {
    method: "POST",
    body: JSON.stringify({ jobIds }),
  });
}

export function getAnalysisJobDownloadUrl(jobId: string) {
  return buildUrl(`/analysis-jobs/${jobId}/download`);
}

export function getAnalysisJobLogsDownloadUrl(jobId: string) {
  return buildUrl(`/analysis-jobs/${jobId}/logs/download`);
}

/**
 * Drop-in page wiring example
 *
 * 1) Import into page.tsx:
 *
 * import {
 *   ApiError,
 *   cancelAnalysisJob,
 *   cancelAnalysisJobsBulk,
 *   getAnalysisJob,
 *   getAnalysisJobDownloadUrl,
 *   getAnalysisJobLogsDownloadUrl,
 *   listAnalysisJobs,
 *   retryAnalysisJob,
 *   retryAnalysisJobsBulk,
 * } from "@/lib/api/analysis-jobs-api-client";
 *
 * 2) Replace your loadJobs() body with:
 *
 * const result = await listAnalysisJobs({
 *   search,
 *   status,
 *   sortBy,
 *   page: 1,
 *   pageSize: 50,
 * });
 * setJobs(result.items);
 *
 * 3) For details sheet:
 *
 * const fullJob = await getAnalysisJob(job.id);
 * setDetailsJob(fullJob);
 *
 * 4) For retry:
 *
 * await retryAnalysisJob(job.id);
 * await loadJobs();
 *
 * 5) For cancel:
 *
 * await cancelAnalysisJob(job.id);
 * await loadJobs();
 *
 * 6) For bulk retry / cancel:
 *
 * await retryAnalysisJobsBulk(selectedIds);
 * await loadJobs();
 *
 * await cancelAnalysisJobsBulk(selectedIds);
 * await loadJobs();
 *
 * 7) For downloads:
 *
 * window.open(getAnalysisJobDownloadUrl(job.id), "_blank");
 * window.open(getAnalysisJobLogsDownloadUrl(job.id), "_blank");
 */

/**
 * Suggested NestJS response shape for GET /analysis-jobs
 *
 * {
 *   "items": [
 *     {
 *       "id": "job_1002",
 *       "jobName": "A1C Risk Clustering",
 *       "datasetName": "clinical_panel_march.xlsx",
 *       "workspaceName": "Metabolic Risk",
 *       "analysisType": "Clustering",
 *       "status": "SUCCEEDED",
 *       "submittedAt": "2026-03-29T13:10:00.000Z",
 *       "updatedAt": "2026-03-29T13:44:00.000Z",
 *       "runtimeMinutes": 34,
 *       "ownerName": "You",
 *       "artifactCount": 3,
 *       "pipelineName": "cluster_default"
 *     }
 *   ],
 *   "total": 1,
 *   "page": 1,
 *   "pageSize": 50
 * }
 */
