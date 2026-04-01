import { CanActivate, ExecutionContext, ForbiddenException, Injectable } from '@nestjs/common'

@Injectable()
export class DepositPermissionGuard implements CanActivate {
  constructor(private readonly requiredPermission: string) {}

  canActivate(context: ExecutionContext): boolean {
    const request = context.switchToHttp().getRequest()
    const permissions: string[] = request.user?.permissions ?? []

    if (!permissions.includes(this.requiredPermission)) {
      throw new ForbiddenException(`Missing permission: ${this.requiredPermission}`)
    }

    return true
  }
}
