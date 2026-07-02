const RAW_API_BASE =
  process.env.NEXT_PUBLIC_API_BASE_URL ??
  process.env.NEXT_PUBLIC_API_URL ??
  "http://127.0.0.1:3001"

const API_BASE = RAW_API_BASE.replace(/\/+$/, "")
const TOKEN_KEY = "auth_token"

export type AnalysisJobStatus = "QUEUED" | "RUNNING" | "SUCCEEDED" | "FAILED" | "CANCELLED"

export type AnalysisJobsSortOption =
  | "NEWEST"
  | "OLDEST"
  | "RUNTIME"
  | "STATUS"
  | "LAST_UPDATED"

export interface AnalysisJobsListQuery {
  search?: string
  status?: AnalysisJobStatus | "ALL"
  workspaceId?: string
  datasetId?: string
  includeArchived?: boolean
  sortBy?: AnalysisJobsSortOption
  submittedDate?: string
  page?: number
  pageSize?: number
}

export interface AnalysisJobQueueDto {
  queueName: string | null
  backendAvailable: boolean
  waitingJobs: number
  activeJobs: number
  queuedMinutes: number | null
  estimatedWaitMinutes: number | null
  note: string
}

export interface AnalysisJobsListItemDto {
  id: string
  jobName: string
  datasetName: string
  workspaceName: string
  analysisType: string
  status: AnalysisJobStatus
  submittedAt: string
  updatedAt: string
  runtimeMinutes: number | null
  ownerName: string
  artifactCount: number
  pipelineName?: string | null
  archivedAt?: string | null
  queue?: AnalysisJobQueueDto | null
}

export interface AnalysisJobDetailsDto {
  id: string
  jobName: string
  datasetName: string
  workspaceName: string
  analysisType: string
  status: AnalysisJobStatus
  submittedAt: string
  updatedAt: string
  runtimeMinutes: number | null
  ownerName: string
  artifactCount: number
  pipelineName?: string | null
  archivedAt?: string | null
  queue?: AnalysisJobQueueDto | null
  params?: Record<string, string | number | boolean | null> | null
  logs?: string[] | AnalysisJobLogDto[] | null
}

export interface AnalysisJobLogDto {
  id?: string
  timestamp?: string
  level?: "INFO" | "WARN" | "ERROR" | "DEBUG"
  message: string
}

export interface PaginatedResponse<T> {
  items: T[]
  total: number
  page: number
  pageSize: number
}

export interface RetryJobResponse {
  ok: true
  newJobId?: string
  message?: string
}

export interface DuplicateJobResponse {
  ok: true
  newJobId?: string
  message?: string
}

export interface CancelJobResponse {
  ok: true
  message?: string
}

export interface ArchiveJobResponse {
  ok: true
  message?: string
}

export interface DeleteJobResponse {
  ok: true
  message?: string
}

export interface BulkJobActionResponse {
  ok: true
  processedIds: string[]
  skippedIds?: string[]
  message?: string
}

export interface AnalysisJobsPageLogEntry {
  id: string
  timestamp: string
  level: "INFO" | "WARN" | "ERROR" | "DEBUG"
  message: string
}

export interface AnalysisJobsPageItem {
  id: string
  title: string
  templateName: string
  status: AnalysisJobStatus
  progressPercent: number
  createdAt: string
  startedAt?: string | null
  finishedAt?: string | null
  owner?: {
    name: string
    email?: string | null
  } | null
  dataset?: {
    id: string
    name: string
  } | null
  latestMessage?: string | null
  workspaceName: string
  runtimeMinutes: number | null
  artifactIds: string[]
  reportId?: string | null
  parameters?: Record<string, unknown> | null
  logs: AnalysisJobsPageLogEntry[]
  archivedAt?: string | null
  queue?: AnalysisJobQueueDto | null
}

export type AnalysisJobDetails = AnalysisJobsPageItem
export type AnalysisJobsListResponse = PaginatedResponse<AnalysisJobsPageItem>

export class ApiError extends Error {
  status: number
  payload?: unknown
  path?: string

  constructor(message: string, status: number, payload?: unknown, path?: string) {
    super(message)
    this.name = "ApiError"
    this.status = status
    this.payload = payload
    this.path = path
  }
}

type RequestOptions = RequestInit & {
  json?: unknown
}

type RequestCandidate = {
  path: string
  init?: RequestOptions
}

function getStoredToken() {
  if (typeof window === "undefined") {
    return null
  }

  try {
    return window.localStorage.getItem(TOKEN_KEY) ?? window.sessionStorage.getItem(TOKEN_KEY)
  } catch {
    return null
  }
}

function clearStoredAuth() {
  if (typeof window === "undefined") {
    return
  }

  try {
    window.localStorage.removeItem("auth_token")
    window.localStorage.removeItem("refresh_token")
    window.localStorage.removeItem("auth_user")
    window.sessionStorage.removeItem("auth_token")
    window.sessionStorage.removeItem("refresh_token")
    window.sessionStorage.removeItem("auth_user")
  } catch {
    // Storage can be unavailable in hardened browser contexts.
  }
}

function buildApiUrl(path: string) {
  const normalizedPath = path.startsWith("/") ? path : `/${path}`
  return normalizedPath.startsWith("/api/")
    ? `${API_BASE}${normalizedPath}`
    : API_BASE.endsWith("/api")
      ? `${API_BASE}${normalizedPath}`
      : `${API_BASE}/api${normalizedPath}`
}

function withQuery(path: string, query?: Record<string, string | number | boolean | undefined>) {
  const url = new URL(buildApiUrl(path))

  if (query) {
    for (const [key, value] of Object.entries(query)) {
      if (value !== undefined && value !== "") {
        url.searchParams.set(key, String(value))
      }
    }
  }

  const pathnameWithQuery = `${url.pathname}${url.search}`
  return pathnameWithQuery.startsWith("/api") ? pathnameWithQuery.slice(4) : pathnameWithQuery
}

async function requestJson<T>(path: string, options: RequestOptions = {}): Promise<T> {
  const { json, headers, ...rest } = options
  const token = getStoredToken()
  const isFormData = typeof FormData !== "undefined" && json instanceof FormData
  const url = buildApiUrl(path)

  let response: Response

  try {
    response = await fetch(url, {
      ...rest,
      credentials: "include",
      cache: "no-store",
      headers: {
        ...(isFormData ? {} : { "Content-Type": "application/json" }),
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
        ...(headers ?? {}),
      },
      body:
        json === undefined
          ? rest.body
          : isFormData
            ? (json as FormData)
            : JSON.stringify(json),
    })
  } catch (error) {
    throw new ApiError(
      `Unable to reach the API at ${API_BASE}. Start the server and try again.`,
      0,
      error,
      path
    )
  }

  const contentType = response.headers.get("content-type") ?? ""
  const payload = contentType.includes("application/json")
    ? await response.json().catch(() => null)
    : await response.text().catch(() => null)

  if (!response.ok) {
    const message =
      payload &&
      typeof payload === "object" &&
      "message" in payload &&
      typeof (payload as { message?: unknown }).message === "string"
        ? (payload as { message: string }).message
        : typeof payload === "string" && payload.trim().length > 0
          ? payload
          : `Request failed (${response.status})`

    if (response.status === 401) {
      clearStoredAuth()
    }

    throw new ApiError(message, response.status, payload, path)
  }

  if (response.status === 204) {
    return undefined as T
  }

  return payload as T
}

async function requestFirst<T>(candidates: RequestCandidate[]): Promise<T> {
  let lastError: unknown

  for (const candidate of candidates) {
    try {
      return await requestJson<T>(candidate.path, candidate.init)
    } catch (error) {
      lastError = error
      if (error instanceof ApiError && error.status === 404) {
        continue
      }
      throw error
    }
  }

  if (lastError instanceof Error) {
    throw lastError
  }

  throw new ApiError("Analysis Jobs API request failed", 0)
}

function normalizeSort(sortBy?: AnalysisJobsSortOption) {
  switch (sortBy) {
    case "NEWEST":
      return "submittedAt:desc"
    case "OLDEST":
      return "submittedAt:asc"
    case "RUNTIME":
      return "runtimeMinutes:desc"
    case "STATUS":
      return "status:asc"
    case "LAST_UPDATED":
      return "updatedAt:desc"
    default:
      return undefined
  }
}

function normalizeProgress(status: AnalysisJobStatus) {
  switch (status) {
    case "QUEUED":
      return 8
    case "RUNNING":
      return 55
    case "SUCCEEDED":
      return 100
    case "FAILED":
      return 100
    case "CANCELLED":
      return 100
  }
}

function deriveStartAndFinish(
  submittedAt: string,
  updatedAt: string,
  runtimeMinutes: number | null,
  status: AnalysisJobStatus
) {
  if (runtimeMinutes == null) {
    return {
      startedAt: status === "QUEUED" ? null : submittedAt,
      finishedAt: status === "RUNNING" || status === "QUEUED" ? null : updatedAt,
    }
  }

  const endTime = new Date(updatedAt).getTime()
  const startedAt = new Date(endTime - runtimeMinutes * 60_000).toISOString()

  return {
    startedAt,
    finishedAt: status === "RUNNING" ? null : updatedAt,
  }
}

function mapLogs(logs: AnalysisJobDetailsDto["logs"], fallbackTimestamp: string): AnalysisJobsPageLogEntry[] {
  if (!logs || logs.length === 0) {
    return []
  }

  return logs.map((entry, index) => {
    if (typeof entry === "string") {
      return {
        id: `log-${index + 1}`,
        timestamp: fallbackTimestamp,
        level: "INFO",
        message: entry,
      }
    }

    return {
      id: entry.id ?? `log-${index + 1}`,
      timestamp: entry.timestamp ?? fallbackTimestamp,
      level: entry.level ?? "INFO",
      message: entry.message,
    }
  })
}

function buildArtifactIds(jobId: string, artifactCount: number) {
  return Array.from({ length: artifactCount }, (_, index) => `${jobId}-artifact-${index + 1}`)
}

function mapListItem(dto: AnalysisJobsListItemDto): AnalysisJobsPageItem {
  const timing = deriveStartAndFinish(dto.submittedAt, dto.updatedAt, dto.runtimeMinutes, dto.status)
  const artifactIds = buildArtifactIds(dto.id, dto.artifactCount)

  return {
    id: dto.id,
    title: dto.jobName,
    templateName: dto.analysisType,
    status: dto.status,
    progressPercent: normalizeProgress(dto.status),
    createdAt: dto.submittedAt,
    startedAt: timing.startedAt,
    finishedAt: timing.finishedAt,
    owner: { name: dto.ownerName },
    dataset: { id: dto.id, name: dto.datasetName },
    latestMessage: null,
    workspaceName: dto.workspaceName,
    runtimeMinutes: dto.runtimeMinutes,
    artifactIds,
    reportId: artifactIds.length > 0 ? `${dto.id}-report` : null,
    logs: [],
    archivedAt: dto.archivedAt ?? null,
    queue: dto.queue ?? null,
  }
}

function mapDetails(dto: AnalysisJobDetailsDto): AnalysisJobDetails {
  const base = mapListItem(dto)
  const logs = mapLogs(dto.logs, dto.updatedAt)

  return {
    ...base,
    latestMessage: logs.at(-1)?.message ?? null,
    parameters: dto.params ? Object.fromEntries(Object.entries(dto.params)) : null,
    logs,
  }
}

function normalizePaginatedPayload<T>(payload: unknown): PaginatedResponse<T> {
  if (payload && typeof payload === "object") {
    const candidate = payload as Partial<PaginatedResponse<T>>
    return {
      items: Array.isArray(candidate.items) ? candidate.items : [],
      total: typeof candidate.total === "number" ? candidate.total : Array.isArray(candidate.items) ? candidate.items.length : 0,
      page: typeof candidate.page === "number" ? candidate.page : 1,
      pageSize: typeof candidate.pageSize === "number" ? candidate.pageSize : Array.isArray(candidate.items) ? candidate.items.length : 0,
    }
  }

  return {
    items: [],
    total: 0,
    page: 1,
    pageSize: 0,
  }
}

export async function listAnalysisJobs(query: AnalysisJobsListQuery = {}): Promise<AnalysisJobsListResponse> {
  const queryParams = {
    search: query.search,
    status: query.status && query.status !== "ALL" ? query.status : undefined,
    workspaceId: query.workspaceId,
    datasetId: query.datasetId,
    includeArchived: query.includeArchived,
    sort: normalizeSort(query.sortBy),
    submittedDate: query.submittedDate,
    page: query.page,
    pageSize: query.pageSize,
  }

  const payload = await requestFirst<unknown>([
    { path: withQuery("/analysis/jobs", queryParams), init: { method: "GET" } },
    { path: withQuery("/v1/analysis-jobs", queryParams), init: { method: "GET" } },
    { path: withQuery("/analysis-jobs", queryParams), init: { method: "GET" } },
  ])

  const normalized = normalizePaginatedPayload<AnalysisJobsListItemDto>(payload)

  return {
    ...normalized,
    items: normalized.items.map(mapListItem),
  }
}

export async function getAnalysisJob(jobId: string): Promise<AnalysisJobDetails> {
  const dto = await requestFirst<AnalysisJobDetailsDto>([
    { path: `/analysis/jobs/${jobId}`, init: { method: "GET" } },
    { path: `/v1/analysis-jobs/${jobId}`, init: { method: "GET" } },
    { path: `/analysis-jobs/${jobId}`, init: { method: "GET" } },
  ])

  return mapDetails(dto)
}

export async function retryAnalysisJob(jobId: string): Promise<RetryJobResponse> {
  return requestFirst<RetryJobResponse>([
    { path: `/analysis/jobs/${jobId}/retry`, init: { method: "POST" } },
    { path: `/v1/analysis-jobs/${jobId}/retry`, init: { method: "POST" } },
    { path: `/analysis-jobs/${jobId}/retry`, init: { method: "POST" } },
  ])
}

export async function duplicateAnalysisJob(jobId: string): Promise<DuplicateJobResponse> {
  return requestFirst<DuplicateJobResponse>([
    { path: `/analysis/jobs/${jobId}/duplicate`, init: { method: "POST" } },
    { path: `/v1/analysis-jobs/${jobId}/duplicate`, init: { method: "POST" } },
    { path: `/analysis-jobs/${jobId}/duplicate`, init: { method: "POST" } },
  ])
}

export async function cancelAnalysisJob(jobId: string): Promise<CancelJobResponse> {
  return requestFirst<CancelJobResponse>([
    { path: `/analysis/jobs/${jobId}/cancel`, init: { method: "POST" } },
    { path: `/analysis/jobs/${jobId}/cancel`, init: { method: "PATCH" } },
    { path: `/v1/analysis-jobs/${jobId}/cancel`, init: { method: "POST" } },
    { path: `/analysis-jobs/${jobId}/cancel`, init: { method: "POST" } },
  ])
}

export async function deleteAnalysisJob(jobId: string): Promise<DeleteJobResponse> {
  return requestFirst<DeleteJobResponse>([
    { path: `/analysis/jobs/${jobId}`, init: { method: "DELETE" } },
    { path: `/v1/analysis-jobs/${jobId}`, init: { method: "DELETE" } },
    { path: `/analysis-jobs/${jobId}`, init: { method: "DELETE" } },
  ])
}

export async function archiveAnalysisJob(jobId: string): Promise<ArchiveJobResponse> {
  return requestFirst<ArchiveJobResponse>([
    { path: `/analysis/jobs/${jobId}/archive`, init: { method: "POST" } },
    { path: `/v1/analysis-jobs/${jobId}/archive`, init: { method: "POST" } },
    { path: `/analysis-jobs/${jobId}/archive`, init: { method: "POST" } },
  ])
}

export async function restoreAnalysisJob(jobId: string): Promise<ArchiveJobResponse> {
  return requestFirst<ArchiveJobResponse>([
    { path: `/analysis/jobs/${jobId}/restore`, init: { method: "POST" } },
    { path: `/v1/analysis-jobs/${jobId}/restore`, init: { method: "POST" } },
    { path: `/analysis-jobs/${jobId}/restore`, init: { method: "POST" } },
  ])
}

export async function retryAnalysisJobsBulk(jobIds: string[]): Promise<BulkJobActionResponse> {
  return requestFirst<BulkJobActionResponse>([
    { path: "/analysis/jobs/bulk/retry", init: { method: "POST", json: { jobIds } } },
    { path: "/v1/analysis-jobs/bulk/retry", init: { method: "POST", json: { jobIds } } },
    { path: "/analysis-jobs/bulk/retry", init: { method: "POST", json: { jobIds } } },
  ])
}

export async function cancelAnalysisJobsBulk(jobIds: string[]): Promise<BulkJobActionResponse> {
  return requestFirst<BulkJobActionResponse>([
    { path: "/analysis/jobs/bulk/cancel", init: { method: "POST", json: { jobIds } } },
    { path: "/analysis/jobs/bulk/cancel", init: { method: "PATCH", json: { jobIds } } },
    { path: "/v1/analysis-jobs/bulk/cancel", init: { method: "POST", json: { jobIds } } },
    { path: "/analysis-jobs/bulk/cancel", init: { method: "POST", json: { jobIds } } },
  ])
}

export async function deleteAnalysisJobsBulk(jobIds: string[]): Promise<BulkJobActionResponse> {
  return requestFirst<BulkJobActionResponse>([
    { path: "/analysis/jobs/bulk/delete", init: { method: "POST", json: { jobIds } } },
    { path: "/v1/analysis-jobs/bulk/delete", init: { method: "POST", json: { jobIds } } },
    { path: "/analysis-jobs/bulk/delete", init: { method: "POST", json: { jobIds } } },
  ])
}

export async function archiveAnalysisJobsBulk(jobIds: string[]): Promise<BulkJobActionResponse> {
  return requestFirst<BulkJobActionResponse>([
    { path: "/analysis/jobs/bulk/archive", init: { method: "POST", json: { jobIds } } },
    { path: "/v1/analysis-jobs/bulk/archive", init: { method: "POST", json: { jobIds } } },
    { path: "/analysis-jobs/bulk/archive", init: { method: "POST", json: { jobIds } } },
  ])
}

export async function restoreAnalysisJobsBulk(jobIds: string[]): Promise<BulkJobActionResponse> {
  return requestFirst<BulkJobActionResponse>([
    { path: "/analysis/jobs/bulk/restore", init: { method: "POST", json: { jobIds } } },
    { path: "/v1/analysis-jobs/bulk/restore", init: { method: "POST", json: { jobIds } } },
    { path: "/analysis-jobs/bulk/restore", init: { method: "POST", json: { jobIds } } },
  ])
}

export function getAnalysisJobDownloadUrl(jobId: string) {
  return buildApiUrl(`/analysis/jobs/${jobId}/download`)
}

export function getAnalysisJobLogsDownloadUrl(jobId: string) {
  return buildApiUrl(`/analysis/jobs/${jobId}/logs/download`)
}

/*
Exact wiring notes for app/dashboard/analysis/jobs/page.tsx

1. Import from:
   @/src/lib/api/analysis-jobs-api-client

2. Replace old hook imports:
   - useAnalysisJobs
   - useAnalysisJobDetails
   - useCancelAnalysisJob

3. Replace page data loading with:
   await listAnalysisJobs({ search, status: effectiveStatus, sortBy, page: 1, pageSize: 50 })

4. Replace details loader with:
   await getAnalysisJob(jobId)

5. Replace row actions:
   await retryAnalysisJob(job.id)
   await cancelAnalysisJob(job.id)

6. Replace bulk actions:
   await retryAnalysisJobsBulk(selectedIds)
   await cancelAnalysisJobsBulk(selectedIds)

7. Replace local output/log download placeholders with:
   window.open(getAnalysisJobDownloadUrl(job.id), "_blank", "noopener,noreferrer")
   window.open(getAnalysisJobLogsDownloadUrl(job.id), "_blank", "noopener,noreferrer")
*/
