import { Transform, Type } from 'class-transformer';
import { IsEnum, IsInt, IsOptional, IsString, Min } from 'class-validator';
import { ApplicationReviewStatus } from '../types/researcher-application.types';

export class QueryResearcherApplicationsDto {
  @IsOptional()
  @IsEnum(ApplicationReviewStatus)
  reviewStatus?: ApplicationReviewStatus;

  @IsOptional()
  @IsString()
  search?: string;

  @Type(() => Number)
  @IsOptional()
  @IsInt()
  @Min(1)
  page = 1;

  @Type(() => Number)
  @IsOptional()
  @IsInt()
  @Min(1)
  limit = 20;

  @Transform(({ value }) => String(value || 'desc').toLowerCase())
  @IsOptional()
  @IsString()
  sortDirection: 'asc' | 'desc' = 'desc';
}
