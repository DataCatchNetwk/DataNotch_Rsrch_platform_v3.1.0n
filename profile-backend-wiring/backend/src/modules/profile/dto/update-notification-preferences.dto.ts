import {
  ArrayMinSize,
  IsArray,
  IsBoolean,
  IsString,
  ValidateNested,
} from "class-validator";
import { Type } from "class-transformer";

export class NotificationPreferenceInputDto {
  @IsString()
  key!: string;

  @IsBoolean()
  enabled!: boolean;
}

export class UpdateNotificationPreferencesDto {
  @IsArray()
  @ArrayMinSize(1)
  @ValidateNested({ each: true })
  @Type(() => NotificationPreferenceInputDto)
  preferences!: NotificationPreferenceInputDto[];
}
