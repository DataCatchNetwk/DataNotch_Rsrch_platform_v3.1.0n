import { IsEnum, IsInt, IsOptional, IsString, Max, Min } from 'class-validator';

export enum NotificationCategoryDto {
  SYSTEM = 'SYSTEM',
  DATASET = 'DATASET',
  WORKSPACE = 'WORKSPACE',
  COLLABORATION = 'COLLABORATION',
  REVIEW = 'REVIEW',
  REQUEST = 'REQUEST',
  ANALYSIS = 'ANALYSIS',
  REPORT = 'REPORT',
  BILLING = 'BILLING',
  SECURITY = 'SECURITY',
}

export enum NotificationStatusDto {
  UNREAD = 'UNREAD',
  READ = 'READ',
  ARCHIVED = 'ARCHIVED',
}

export class ListNotificationsDto {
  @IsOptional()
  @IsString()
  cursor?: string;

  @IsOptional()
  @IsInt()
  @Min(1)
  @Max(100)
  limit?: number = 20;

  @IsOptional()
  @IsEnum(NotificationStatusDto)
  status?: NotificationStatusDto;

  @IsOptional()
  @IsEnum(NotificationCategoryDto)
  category?: NotificationCategoryDto;
}
