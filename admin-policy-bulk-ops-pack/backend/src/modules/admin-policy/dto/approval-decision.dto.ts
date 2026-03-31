
import { IsOptional, IsString } from "class-validator";

export class ApprovalDecisionDto {
  @IsOptional()
  @IsString()
  assignRole?: "USER" | "REVIEWER" | "STAFF" | "ADMIN" | "SUPER_ADMIN";

  @IsString()
  reason!: string;
}
