
import { ArrayMinSize, IsArray, IsIn, IsString } from "class-validator";

export class BulkStatusActionDto {
  @IsArray()
  @ArrayMinSize(1)
  @IsString({ each: true })
  userIds!: string[];

  @IsIn(["ACTIVE", "PENDING", "SUSPENDED"])
  status!: "ACTIVE" | "PENDING" | "SUSPENDED";

  @IsString()
  reason!: string;
}
