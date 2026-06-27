import type { NextFunction, Request, Response } from 'express';
import { HttpError } from '../utils/errors.js';

/**
 * Guard for internal debug endpoints that must be callable without JWT login.
 * Enabled only when DEBUG_ADMIN_TOKEN is configured.
 */
export function requireDebugAdminToken(req: Request, _res: Response, next: NextFunction): void {
  const expectedToken = process.env.DEBUG_ADMIN_TOKEN;

  if (!expectedToken) {
    next(new HttpError(404, 'Debug endpoint is disabled'));
    return;
  }

  const providedToken = req.header('x-debug-admin-token');
  if (!providedToken || providedToken !== expectedToken) {
    next(new HttpError(403, 'Forbidden'));
    return;
  }

  next();
}
