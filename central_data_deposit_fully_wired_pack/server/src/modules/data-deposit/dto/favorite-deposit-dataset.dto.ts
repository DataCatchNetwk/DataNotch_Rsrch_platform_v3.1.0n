import { IsBoolean } from 'class-validator'

export class FavoriteDepositDatasetDto {
  @IsBoolean()
  favorite!: boolean
}
