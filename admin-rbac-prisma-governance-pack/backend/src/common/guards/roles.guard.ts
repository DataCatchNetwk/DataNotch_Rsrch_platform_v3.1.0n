import { CanActivate, ExecutionContext, ForbiddenException, Injectable } from "@nestjs/common";
import { Reflector } from "@nestjs/core";
import { ROLES_KEY, AppRole } from "../decorators/roles.decorator";

type RequestUser = { id: string; role?: AppRole };

@Injectable()
export class RolesGuard implements CanActivate {
  constructor(private readonly reflector: Reflector) {}
  canActivate(context: ExecutionContext): boolean {
    const requiredRoles = this.reflector.getAllAndOverride<AppRole[]>(ROLES_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);
    if (!requiredRoles?.length) return true;
    const req = context.switchToHttp().getRequest();
    const user = req.user as RequestUser | undefined;
    if (!user?.role) throw new ForbiddenException("Missing authenticated role");
    if (!requiredRoles.includes(user.role)) {
      throw new ForbiddenException("Insufficient role for this admin action");
    }
    return true;
  }
}
