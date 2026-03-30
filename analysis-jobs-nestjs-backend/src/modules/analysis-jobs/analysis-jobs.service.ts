import { Injectable, NotFoundException } from "@nestjs/common";
import { BulkJobActionDto } from "./dto/bulk-job-action.dto";
import { ListAnalysisJobsQueryDto } from "./dto/list-analysis-jobs-query.dto";
import {
  AnalysisJobDetails,
  AnalysisJobListItem,
  AnalysisJobStatus,
  PaginatedResult,
} from "./analysis-jobs.types";

@Injectable()
export class AnalysisJobsService {
  /**
   * Replace this mock storage with Prisma-backed repository logic.
   * The shapes here match the frontend API contract exactly.
   */
  private readonly mockJobs: AnalysisJobDetails[] = [
    {
      id: "job_1001",
      jobName: "Glucose Trend Forecast v2",
      datasetName: "t2dm_wearables_q1.csv",
      workspaceName: "Diabetes Study",
      analysisType: "Time Series",
      status: AnalysisJobStatus.RUNNING,
      submittedAt: new Date("2026-03-30T08:30:00.000Z"),
      updatedAt: new Date("2026-03-30T09:05:00.000Z"),
      runtimeMinutes: 35,
      ownerName: "You",
      artifactCount: 0,
      pipelineName: "forecast_pipeline_v2",
      params: { horizon_days: 14, normalize: true },
      logs: [
        "Container scheduled on worker-2",
        "Dataset validation passed",
        "Training fold 3/5 running",
      ],
    },
    {
      id: "job_1002",
      jobName: "A1C Risk Clustering",
      datasetName: "clinical_panel_march.xlsx",
      workspaceName: "Metabolic Risk",
      analysisType: "Clustering",
      status: AnalysisJobStatus.SUCCEEDED,
      submittedAt: new Date("2026-03-29T13:10:00.000Z"),
      updatedAt: new Date("2026-03-29T13:44:00.000Z"),
      runtimeMinutes: 34,
      ownerName: "You",
      artifactCount: 3,
      pipelineName: "cluster_default",
      params: { clusters: 5, scaling: "standard", outlier_trim: false },
      logs: [
        "Validation passed",
        "Feature scaling complete",
        "Artifacts packaged successfully",
      ],
    },
  ];

  async list(
    query: ListAnalysisJobsQueryDto,
  ): Promise<PaginatedResult<AnalysisJobListItem>> {
    let items = [...this.mockJobs];

    if (query.search) {
      const search = query.search.toLowerCase();
      items = items.filter((job) =>
        [
          job.id,
          job.jobName,
          job.datasetName,
          job.workspaceName,
          job.analysisType,
          job.pipelineName ?? "",
        ].some((value) => value.toLowerCase().includes(search)),
      );
    }

    if (query.status) {
      items = items.filter((job) => job.status === query.status);
    }

    if (query.submittedDate) {
      items = items.filter(
        (job) =>
          job.submittedAt.toISOString().slice(0, 10) === query.submittedDate,
      );
    }

    if (query.sort === "submittedAt:asc") {
      items.sort((a, b) => +a.submittedAt - +b.submittedAt);
    } else if (query.sort === "runtimeMinutes:desc") {
      items.sort((a, b) => (b.runtimeMinutes ?? -1) - (a.runtimeMinutes ?? -1));
    } else if (query.sort === "status:asc") {
      items.sort((a, b) => a.status.localeCompare(b.status));
    } else if (query.sort === "updatedAt:desc") {
      items.sort((a, b) => +b.updatedAt - +a.updatedAt);
    } else {
      items.sort((a, b) => +b.submittedAt - +a.submittedAt);
    }

    const page = query.page ?? 1;
    const pageSize = query.pageSize ?? 50;
    const start = (page - 1) * pageSize;
    const paged = items.slice(start, start + pageSize);

    return {
      items: paged.map(({ params, logs, ...rest }) => rest),
      total: items.length,
      page,
      pageSize,
    };
  }

  async getById(jobId: string): Promise<AnalysisJobDetails> {
    const job = this.mockJobs.find((item) => item.id === jobId);
    if (!job) {
      throw new NotFoundException(`Analysis job ${jobId} not found`);
    }
    return job;
  }

  async retry(jobId: string) {
    await this.getById(jobId);
    return {
      ok: true as const,
      newJobId: `${jobId}_retry`,
      message: "Retry queued successfully",
    };
  }

  async cancel(jobId: string) {
    await this.getById(jobId);
    return {
      ok: true as const,
      message: "Job cancelled successfully",
    };
  }

  async retryBulk(body: BulkJobActionDto) {
    return {
      ok: true as const,
      processedIds: body.jobIds,
      skippedIds: [],
      message: "Bulk retry queued successfully",
    };
  }

  async cancelBulk(body: BulkJobActionDto) {
    return {
      ok: true as const,
      processedIds: body.jobIds,
      skippedIds: [],
      message: "Bulk cancel completed successfully",
    };
  }
}
