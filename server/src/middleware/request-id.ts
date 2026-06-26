import type { NextFunction, Request, Response } from 'express';
import crypto from 'node:crypto';

export function requestId(req: Request, res: Response, next: NextFunction) {
  const incoming = req.headers['x-request-id'];
  const id = typeof incoming === 'string' && incoming.trim() ? incoming.trim() : crypto.randomUUID();
  res.locals.requestId = id;
  res.setHeader('x-request-id', id);
  next();
}

export function getRequestId(res: Response) {
  return typeof res.locals.requestId === 'string' ? res.locals.requestId : undefined;
}