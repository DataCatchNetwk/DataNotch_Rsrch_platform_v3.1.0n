import type { NextFunction, Request, Response } from 'express';
import { verifyToken } from '../utils/jwt.js';
import { HttpError } from '../utils/errors.js';
import { assertTrustedNetwork } from './network-access.js';
import { resolveAuthenticatedUser } from '../services/authenticated-user.service.js';

export async function authenticate(req: Request, _res: Response, next: NextFunction): Promise<void> {
  const header = req.headers.authorization;
  if (!header?.startsWith('Bearer ')) {
    next(new HttpError(401, 'Missing or invalid authorization header'));
    return;
  }

  const token = header.slice(7);

  try {
    await assertTrustedNetwork(req);
    const payload = verifyToken(token);
    const currentUser = await resolveAuthenticatedUser(payload);
    if (!currentUser) {
      next(new HttpError(401, 'Authenticated user no longer exists'));
      return;
    }
    req.user = currentUser;
    next();
  } catch (error) {
    if (error instanceof HttpError) {
      next(error);
      return;
    }

    next(new HttpError(401, 'Invalid or expired token'));
  }
}
