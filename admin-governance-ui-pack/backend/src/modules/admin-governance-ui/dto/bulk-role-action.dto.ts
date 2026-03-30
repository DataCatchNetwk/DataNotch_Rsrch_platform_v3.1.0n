import { ArrayMinSize, IsArray, IsIn, IsString } from "class-validator";

export class BulkRoleActionDto {
  @IsArray()
  @ArrayMinSize(1)
  @IsString({ each: true })
  userIds!: string[];

  @IsIn(["USER", "REVIEWER", "STAFF", "ADMIN", "SUPER_ADMIN"])
  role!: "USER" | "REVIEWER" | "STAFF" | "ADMIN" | "SUPER_ADMIN";
}
