import { IsIn, IsOptional, IsString } from "class-validator";

export class ListUsersQueryDto {
  @IsOptional()
  @IsString()
  search?: string;

  @IsOptional()
  @IsIn(["ACTIVE", "PENDING", "SUSPENDED"])
  status?: "ACTIVE" | "PENDING" | "SUSPENDED";

  @IsOptional()
  @IsIn(["USER", "REVIEWER", "STAFF", "ADMIN", "SUPER_ADMIN"])
  role?: "USER" | "REVIEWER" | "STAFF" | "ADMIN" | "SUPER_ADMIN";
}
