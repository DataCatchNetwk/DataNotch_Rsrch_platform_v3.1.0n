
import { IsString } from "class-validator";
export class RequestIdParamDto { @IsString() requestId!: string; }
