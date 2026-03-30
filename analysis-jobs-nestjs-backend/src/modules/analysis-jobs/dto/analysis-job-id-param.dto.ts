import { IsString } from "class-validator";

export class AnalysisJobIdParamDto {
  @IsString()
  jobId!: string;
}
