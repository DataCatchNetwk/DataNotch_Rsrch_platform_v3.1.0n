import { IsBoolean, IsOptional, IsString, MaxLength } from "class-validator"

export class AddSupportReplyDto {
  @IsString()
  @MaxLength(10000)
  message!: string

  @IsOptional()
  @IsBoolean()
  isInternal?: boolean
}
