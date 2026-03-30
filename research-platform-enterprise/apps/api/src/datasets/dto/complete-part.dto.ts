import { IsInt, IsOptional, IsString, Min } from 'class-validator';

export class CompletePartDto {
  @IsInt()
  @Min(1)
  partNumber!: number;

  @IsString()
  etag!: string;

  @IsOptional()
  sizeBytes?: number;

  @IsOptional()
  @IsString()
  checksumSha256?: string;
}
