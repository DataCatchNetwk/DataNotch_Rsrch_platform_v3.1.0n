import { IsOptional, IsString, MaxLength, MinLength } from 'class-validator';

export class RequestMoreInfoDto {
  @IsString()
  @MinLength(10)
  @MaxLength(5000)
  notes!: string;

  @IsOptional()
  @IsString()
  dueDate?: string;
}
