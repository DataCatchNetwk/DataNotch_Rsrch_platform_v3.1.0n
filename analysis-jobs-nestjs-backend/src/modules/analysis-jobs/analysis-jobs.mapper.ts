import {
  AnalysisJobDetails,
  AnalysisJobListItem,
  PaginatedResult,
} from "./analysis-jobs.types";
import {
  AnalysisJobDetailsDto,
  AnalysisJobsListItemDto,
  PaginatedAnalysisJobsDto,
} from "./dto/analysis-job-response.dto";

export class AnalysisJobsMapper {
  static toListItemDto(item: AnalysisJobListItem): AnalysisJobsListItemDto {
    return {
      id: item.id,
      jobName: item.jobName,
      datasetName: item.datasetName,
      workspaceName: item.workspaceName,
      analysisType: item.analysisType,
      status: item.status,
      submittedAt: item.submittedAt.toISOString(),
      updatedAt: item.updatedAt.toISOString(),
      runtimeMinutes: item.runtimeMinutes,
      ownerName: item.ownerName,
      artifactCount: item.artifactCount,
      pipelineName: item.pipelineName ?? null,
    };
  }

  static toDetailsDto(item: AnalysisJobDetails): AnalysisJobDetailsDto {
    return {
      ...this.toListItemDto(item),
      params: item.params ?? null,
      logs: item.logs ?? null,
    };
  }

  static toPaginatedDto(
    result: PaginatedResult<AnalysisJobListItem>,
  ): PaginatedAnalysisJobsDto {
    return {
      items: result.items.map((item) => this.toListItemDto(item)),
      total: result.total,
      page: result.page,
      pageSize: result.pageSize,
    };
  }
}
