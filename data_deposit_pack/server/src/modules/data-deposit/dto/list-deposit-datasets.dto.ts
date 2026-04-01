import { IsBooleanString, IsEnum, IsOptional, IsString } from "class-validator";

export enum DatasetDomainDto {
  HEALTH = "HEALTH",
  SOCIAL = "SOCIAL",
  CLIMATE = "CLIMATE",
  ECONOMIC = "ECONOMIC",
  EDUCATION = "EDUCATION",
  MOBILITY = "MOBILITY",
  ENVIRONMENT = "ENVIRONMENT",
  GENOMICS = "GENOMICS",
  IMAGING = "IMAGING",
  WEARABLE = "WEARABLE",
  SURVEY = "SURVEY",
  OTHER = "OTHER",
}

export class ListDepositDatasetsDto {
  @IsOptional()
  @IsString()
  search?: string;

  @IsOptional()
  @IsEnum(DatasetDomainDto)
  domain?: DatasetDomainDto;

  @IsOptional()
  @IsString()
  accessLevel?: string;

  @IsOptional()
  @IsBooleanString()
  featured?: string;
}
