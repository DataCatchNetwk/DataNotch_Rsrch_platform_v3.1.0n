
import { IsIn } from "class-validator";
export class UpdateUserRoleDto { @IsIn(["USER","REVIEWER","STAFF","ADMIN"]) role!: "USER"|"REVIEWER"|"STAFF"|"ADMIN"; }
