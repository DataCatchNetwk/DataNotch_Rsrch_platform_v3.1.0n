import type { Request } from 'express';
import { HttpError } from '../utils/errors.js';
import { verifyToken } from '../utils/jwt.js';

export function authenticateStreamRequest(req: Request) {
  const header = req.headers.authorization;
  const queryToken = typeof req.query.token === 'string' ? req.query.token : null;
  const token = header?.startsWith('Bearer ') ? header.slice(7) : queryToken;

  if (!token) {
    throw new HttpError(401, 'Missing stream authentication token');
  }

  req.user = verifyToken(token);
  return req.user;
}