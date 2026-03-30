import { IsInt, IsOptional, IsString, Max, Min } from 'class-validator';

export class InitiateUploadDto {
  @IsString()
  filename!: string;

  @IsOptional()
  @IsString()
  mimeType?: string;

  @IsInt()
  @Min(1)
  @Max(100000)
  totalParts!: number;

  @IsOptional()
  totalSizeBytes?: number;
}
