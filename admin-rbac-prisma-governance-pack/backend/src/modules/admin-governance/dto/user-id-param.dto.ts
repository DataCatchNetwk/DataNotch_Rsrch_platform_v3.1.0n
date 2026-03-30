import { IsString } from "class-validator";

export class UserIdParamDto {
  @IsString()
  userId!: string;
}
