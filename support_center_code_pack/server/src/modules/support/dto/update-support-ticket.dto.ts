import { IsEnum, IsOptional, IsString } from "class-validator"

const supportStatuses = ["OPEN", "TRIAGED", "IN_PROGRESS", "WAITING_FOR_USER", "RESOLVED", "CLOSED", "SPAM"] as const
const supportPriorities = ["LOW", "MEDIUM", "HIGH", "CRITICAL"] as const

export class UpdateSupportTicketDto {
  @IsOptional()
  @IsString()
  assignedToId?: string

  @IsOptional()
  @IsEnum(supportStatuses)
  status?: (typeof supportStatuses)[number]

  @IsOptional()
  @IsEnum(supportPriorities)
  priority?: (typeof supportPriorities)[number]
}
