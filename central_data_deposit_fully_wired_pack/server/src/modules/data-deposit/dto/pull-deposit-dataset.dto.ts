import { IsIn, IsInt, IsOptional, IsString, Min } from 'class-validator'

export class PullDepositDatasetDto {
  @IsString()
  workspaceId!: string

  @IsIn(['COPY', 'VIRTUAL_VIEW'])
  mode!: 'COPY' | 'VIRTUAL_VIEW'

  @IsOptional()
  @IsInt()
  @Min(1)
  rowLimit?: number
}
