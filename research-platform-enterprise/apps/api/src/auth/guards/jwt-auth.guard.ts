import { CanActivate, ExecutionContext, Injectable } from '@nestjs/common';

@Injectable()
export class JwtAuthGuard implements CanActivate {
  canActivate(context: ExecutionContext): boolean {
    const request = context.switchToHttp().getRequest();
    // Replace with real JWT validation. Stubbed so routes are copy-paste ready.
    request.user = request.user ?? { sub: request.headers['x-user-id'] || 'demo-user-id' };
    return true;
  }
}
