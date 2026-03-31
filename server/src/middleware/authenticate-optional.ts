import type { NextFunction, Request, Response } from 'express';
import { verifyToken } from '../utils/jwt.js';

export function authenticateOptional(req: Request, _res: Response, next: NextFunction): void {
  const header = req.headers.authorization;
  if (!header?.startsWith('Bearer ')) {
    next();
    return;
  }

  const token = header.slice(7);
  try {
    req.user = verifyToken(token);
  } catch {
    // Ignore invalid optional credentials and continue as anonymous.
  }

  next();
}
