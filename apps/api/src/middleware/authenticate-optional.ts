import type { NextFunction, Request, Response } from 'express';
import { verifyToken } from '../utils/jwt.js';

import { resolveAuthenticatedUser } from '../services/authenticated-user.service.js';

export async function authenticateOptional(req: Request, _res: Response, next: NextFunction): Promise<void> {
  const header = req.headers.authorization;
  if (!header?.startsWith('Bearer ')) {
    next();
    return;
  }

  const token = header.slice(7);
  try {
    const payload = verifyToken(token);
    req.user = (await resolveAuthenticatedUser(payload)) ?? undefined;
  } catch {
    // Ignore invalid optional credentials and continue as anonymous.
  }

  next();
}
