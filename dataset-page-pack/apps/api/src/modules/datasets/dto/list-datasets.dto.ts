import { IsBooleanString, IsIn, IsOptional, IsString } from 'class-validator'

export class ListDatasetsDto {
  @IsOptional()
  @IsString()
  search?: string

  @IsOptional()
  @IsIn(['library', 'deposit', 'workspace', 'cohort', 'operations', 'analysis', 'lineage', 'access', 'favorites'])
  section?: string

  @IsOptional()
  @IsIn(['PRIVATE', 'TEAM', 'PUBLIC', 'RESTRICTED'])
  visibility?: string

  @IsOptional()
  @IsString()
  workspaceId?: string

  @IsOptional()
  @IsString()
  tag?: string

  @IsOptional()
  @IsIn(['updatedAt', 'createdAt', 'name', 'recordCount'])
  sortBy?: string

  @IsOptional()
  @IsBooleanString()
  favoritesOnly?: string
}
