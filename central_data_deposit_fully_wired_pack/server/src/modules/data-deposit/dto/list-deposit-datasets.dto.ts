import { IsBooleanString, IsEnum, IsOptional, IsString, MaxLength } from 'class-validator'

export enum DepositDomainDto {
  HEALTH = 'HEALTH',
  SOCIAL = 'SOCIAL',
  CLIMATE = 'CLIMATE',
  ECONOMIC = 'ECONOMIC',
  DEMOGRAPHIC = 'DEMOGRAPHIC',
  EDUCATION = 'EDUCATION',
  OTHER = 'OTHER',
}

export enum DepositAccessibilityDto {
  PUBLIC = 'PUBLIC',
  RESTRICTED = 'RESTRICTED',
  CONTROLLED = 'CONTROLLED',
}

export class ListDepositDatasetsDto {
  @IsOptional()
  @IsString()
  @MaxLength(120)
  search?: string

  @IsOptional()
  @IsEnum(DepositDomainDto)
  domain?: DepositDomainDto

  @IsOptional()
  @IsEnum(DepositAccessibilityDto)
  accessibility?: DepositAccessibilityDto

  @IsOptional()
  @IsBooleanString()
  favoritesOnly?: string

  @IsOptional()
  page?: number

  @IsOptional()
  pageSize?: number
}
