import { IsString } from 'class-validator'

export class PullDatasetDto {
  @IsString()
  workspaceId!: string
}
