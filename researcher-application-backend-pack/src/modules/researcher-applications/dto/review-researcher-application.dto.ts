import { IsEnum, IsOptional, IsString, MaxLength } from 'class-validator';
import { ApplicationReviewDecision } from '../types/researcher-application.types';

export class ReviewResearcherApplicationDto {
  @IsEnum(ApplicationReviewDecision)
  decision!: ApplicationReviewDecision;

  @IsOptional()
  @IsString()
  @MaxLength(5000)
  notes?: string;

  @IsOptional()
  @IsString()
  requestedRole?: string;

  @IsOptional()
  @IsString()
  requestedAccountStatus?: string;
}
