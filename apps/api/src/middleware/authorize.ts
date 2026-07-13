import type { NextFunction, Request, Response } from 'express';
import { hasAnyRole } from '../constants/rbac.js';
import { HttpError } from '../utils/errors.js';

export function authorize(...allowedRoles: string[]) {
  return (req: Request, _res: Response, next: NextFunction): void => {
    const roles = req.user?.roles ?? [];
    const permitted = hasAnyRole(roles, allowedRoles);
    if (!permitted) return next(new HttpError(403, 'Forbidden'));
    next();
  };
}
