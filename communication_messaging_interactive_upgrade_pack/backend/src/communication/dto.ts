import { IsArray, IsEmail, IsEnum, IsOptional, IsString } from 'class-validator';

export enum MessageKindDto {
  MESSAGE = 'MESSAGE',
  INTERNAL_NOTE = 'INTERNAL_NOTE',
  FORWARD = 'FORWARD',
}

export class CreateThreadDto {
  @IsString() subject!: string;
  @IsString() body!: string;
  @IsArray() @IsEmail({}, { each: true }) toEmails!: string[];
  @IsOptional() @IsArray() @IsEmail({}, { each: true }) ccEmails?: string[];
  @IsOptional() @IsString() assetType?: string;
  @IsOptional() @IsString() assetId?: string;
  @IsOptional() @IsString() assetName?: string;
}

export class ReplyDto {
  @IsString() body!: string;
  @IsOptional() @IsEnum(MessageKindDto) kind?: MessageKindDto;
}

export class ForwardDto {
  @IsEmail() toEmail!: string;
  @IsOptional() @IsString() note?: string;
}
