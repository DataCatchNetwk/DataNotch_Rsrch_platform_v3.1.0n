import { Type } from 'class-transformer';
import { IsArray, ValidateNested } from 'class-validator';
import { CompletePartDto } from './complete-part.dto';

export class CompleteUploadDto {
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => CompletePartDto)
  parts!: CompletePartDto[];
}
