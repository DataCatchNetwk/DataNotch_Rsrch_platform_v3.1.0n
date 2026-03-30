import { IsBoolean, IsOptional, IsString } from 'class-validator';

export class UpdateNotificationPreferencesDto {
  @IsOptional() @IsBoolean() emailEnabled?: boolean;
  @IsOptional() @IsBoolean() pushEnabled?: boolean;
  @IsOptional() @IsBoolean() inAppEnabled?: boolean;
  @IsOptional() @IsBoolean() datasetAlerts?: boolean;
  @IsOptional() @IsBoolean() workspaceAlerts?: boolean;
  @IsOptional() @IsBoolean() collaborationAlerts?: boolean;
  @IsOptional() @IsBoolean() reviewAlerts?: boolean;
  @IsOptional() @IsBoolean() analysisAlerts?: boolean;
  @IsOptional() @IsBoolean() reportAlerts?: boolean;
  @IsOptional() @IsBoolean() billingAlerts?: boolean;
  @IsOptional() @IsBoolean() securityAlerts?: boolean;
  @IsOptional() @IsString() quietHoursStart?: string;
  @IsOptional() @IsString() quietHoursEnd?: string;
}
