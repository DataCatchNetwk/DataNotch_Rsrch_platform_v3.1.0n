import { IsEmail, IsEnum, IsOptional, IsString, MaxLength } from "class-validator"

export enum SupportTicketCategoryDto {
  LOGIN = "LOGIN",
  BILLING = "BILLING",
  TECHNICAL = "TECHNICAL",
  DATASET = "DATASET",
  ACCESS = "ACCESS",
  ACCOUNT = "ACCOUNT",
  SECURITY = "SECURITY",
  OTHER = "OTHER",
}

export class CreateSupportTicketDto {
  @IsOptional()
  @IsString()
  @MaxLength(120)
  requesterName?: string

  @IsEmail()
  requesterEmail!: string

  @IsString()
  @MaxLength(180)
  subject!: string

  @IsString()
  @MaxLength(5000)
  description!: string

  @IsEnum(SupportTicketCategoryDto)
  category!: SupportTicketCategoryDto
}
