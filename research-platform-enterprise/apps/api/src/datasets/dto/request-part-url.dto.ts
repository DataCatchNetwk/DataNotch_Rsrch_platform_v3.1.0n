import { IsInt, Min } from 'class-validator';

export class RequestPartUrlDto {
  @IsInt()
  @Min(1)
  partNumber!: number;
}
