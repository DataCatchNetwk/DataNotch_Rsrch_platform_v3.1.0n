export enum AnalysisJobStatus {
  QUEUED = "QUEUED",
  RUNNING = "RUNNING",
  SUCCEEDED = "SUCCEEDED",
  FAILED = "FAILED",
  CANCELLED = "CANCELLED",
}

export type AnalysisJobsSort =
  | "submittedAt:desc"
  | "submittedAt:asc"
  | "runtimeMinutes:desc"
  | "status:asc"
  | "updatedAt:desc";

export type AnalysisJobListItem = {
  id: string;
  jobName: string;
  datasetName: string;
  workspaceName: string;
  analysisType: string;
  status: AnalysisJobStatus;
  submittedAt: Date;
  updatedAt: Date;
  runtimeMinutes: number | null;
  ownerName: string;
  artifactCount: number;
  pipelineName?: string | null;
};

export type AnalysisJobDetails = AnalysisJobListItem & {
  params?: Record<string, string | number | boolean> | null;
  logs?: string[] | null;
};

export type PaginatedResult<T> = {
  items: T[];
  total: number;
  page: number;
  pageSize: number;
};
