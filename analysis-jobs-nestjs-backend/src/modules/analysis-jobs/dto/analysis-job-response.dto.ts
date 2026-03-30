import { AnalysisJobStatus } from "../analysis-jobs.types";

export class AnalysisJobsListItemDto {
  id!: string;
  jobName!: string;
  datasetName!: string;
  workspaceName!: string;
  analysisType!: string;
  status!: AnalysisJobStatus;
  submittedAt!: string;
  updatedAt!: string;
  runtimeMinutes!: number | null;
  ownerName!: string;
  artifactCount!: number;
  pipelineName?: string | null;
}

export class AnalysisJobDetailsDto extends AnalysisJobsListItemDto {
  params?: Record<string, string | number | boolean> | null;
  logs?: string[] | null;
}

export class PaginatedAnalysisJobsDto {
  items!: AnalysisJobsListItemDto[];
  total!: number;
  page!: number;
  pageSize!: number;
}

export class RetryJobResponseDto {
  ok!: true;
  newJobId?: string;
  message?: string;
}

export class CancelJobResponseDto {
  ok!: true;
  message?: string;
}

export class BulkJobActionResponseDto {
  ok!: true;
  processedIds!: string[];
  skippedIds?: string[];
  message?: string;
}
