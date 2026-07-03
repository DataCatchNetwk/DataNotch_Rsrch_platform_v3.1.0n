import { CanActivate, ExecutionContext, ForbiddenException, Injectable } from '@nestjs/common';

export type Permission = 'meeting:create'|'meeting:cancel'|'meeting:pause'|'meeting:deleteLog'|'message:broadcast'|'ticket:manage';

const rolePermissions: Record<string, Permission[]> = {
  ADMIN: ['meeting:create','meeting:cancel','meeting:pause','meeting:deleteLog','message:broadcast','ticket:manage'],
  RESEARCHER: ['meeting:create'],
  USER: ['meeting:create'],
};

@Injectable()
export class PermissionGuard implements CanActivate {
  canActivate(ctx: ExecutionContext): boolean {
    const req = ctx.switchToHttp().getRequest();
    const needed = req.permission as Permission | undefined;
    if (!needed) return true;
    const role = req.user?.role || 'USER';
    if (!rolePermissions[role]?.includes(needed)) throw new ForbiddenException('Insufficient permission');
    return true;
  }
}
