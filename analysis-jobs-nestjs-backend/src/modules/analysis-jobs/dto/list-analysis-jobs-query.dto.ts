import { Transform } from "class-transformer";
import {
  IsEnum,
  IsInt,
  IsOptional,
  IsString,
  Matches,
  Max,
  Min,
} from "class-validator";
import { AnalysisJobStatus, AnalysisJobsSort } from "../analysis-jobs.types";

export class ListAnalysisJobsQueryDto {
  @IsOptional()
  @IsString()
  search?: string;

  @IsOptional()
  @IsEnum(AnalysisJobStatus)
  status?: AnalysisJobStatus;

  @IsOptional()
  @IsString()
  workspaceId?: string;

  @IsOptional()
  @IsString()
  datasetId?: string;

  @IsOptional()
  @Matches(/^(submittedAt:desc|submittedAt:asc|runtimeMinutes:desc|status:asc|updatedAt:desc)$/)
  sort?: AnalysisJobsSort;

  @IsOptional()
  @Matches(/^\d{4}-\d{2}-\d{2}$/)
  submittedDate?: string;

  @IsOptional()
  @Transform(({ value }) => Number(value))
  @IsInt()
  @Min(1)
  page?: number = 1;

  @IsOptional()
  @Transform(({ value }) => Number(value))
  @IsInt()
  @Min(1)
  @Max(100)
  pageSize?: number = 50;
}
