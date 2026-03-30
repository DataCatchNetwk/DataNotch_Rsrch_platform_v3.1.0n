import { IsOptional, IsString, Matches } from "class-validator";

export class UpdateProfileDto {
  @IsOptional()
  @IsString()
  firstName?: string;

  @IsOptional()
  @IsString()
  lastName?: string;

  @IsOptional()
  @IsString()
  institution?: string;

  @IsOptional()
  @IsString()
  department?: string;

  @IsOptional()
  @IsString()
  researchGroup?: string;

  @IsOptional()
  @Matches(/^[A-Za-z_]+\/[A-Za-z_]+$/)
  timezone?: string;
}
