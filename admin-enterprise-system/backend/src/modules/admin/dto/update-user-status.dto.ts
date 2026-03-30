
import { IsIn } from "class-validator";
export class UpdateUserStatusDto { @IsIn(["ACTIVE","PENDING","SUSPENDED"]) status!: "ACTIVE"|"PENDING"|"SUSPENDED"; }
