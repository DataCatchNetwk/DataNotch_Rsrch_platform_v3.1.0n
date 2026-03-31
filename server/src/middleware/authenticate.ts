import type { NextFunction, Request, Response } from 'express';
import { verifyToken } from '../utils/jwt.js';
import { HttpError } from '../utils/errors.js';
import { assertTrustedNetwork } from './network-access.js';

export async function authenticate(req: Request, _res: Response, next: NextFunction): Promise<void> {
  const header = req.headers.authorization;
  if (!header?.startsWith('Bearer ')) {
    next(new HttpError(401, 'Missing or invalid authorization header'));
    return;
  }

  const token = header.slice(7);

  try {
    await assertTrustedNetwork(req);
    req.user = verifyToken(token);
    next();
  } catch (error) {
    if (error instanceof HttpError) {
      next(error);
      return;
    }

    next(new HttpError(401, 'Invalid or expired token'));
  }
}
