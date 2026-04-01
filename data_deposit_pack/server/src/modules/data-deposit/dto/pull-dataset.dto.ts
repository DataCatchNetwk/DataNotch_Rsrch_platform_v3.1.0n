import { IsArray, IsObject, IsOptional, IsString } from "class-validator";

export class PullDatasetDto {
  @IsString()
  workspaceId!: string;

  @IsOptional()
  @IsArray()
  selectedFields?: string[];

  @IsOptional()
  @IsObject()
  filters?: Record<string, unknown>;
}
