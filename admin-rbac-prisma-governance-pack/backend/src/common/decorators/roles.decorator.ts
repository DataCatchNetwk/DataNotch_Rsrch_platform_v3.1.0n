import { SetMetadata } from "@nestjs/common";

export const ROLES_KEY = "roles";
export type AppRole = "USER" | "REVIEWER" | "STAFF" | "ADMIN" | "SUPER_ADMIN";
export const Roles = (...roles: AppRole[]) => SetMetadata(ROLES_KEY, roles);
