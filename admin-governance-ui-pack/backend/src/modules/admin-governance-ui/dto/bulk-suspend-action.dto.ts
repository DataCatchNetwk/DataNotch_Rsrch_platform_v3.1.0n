import { ArrayMinSize, IsArray, IsString } from "class-validator";

export class BulkSuspendActionDto {
  @IsArray()
  @ArrayMinSize(1)
  @IsString({ each: true })
  userIds!: string[];
}
