import type { NextFunction, Request, Response } from 'express';

export function securityHeaders(_req: Request, res: Response, next: NextFunction) {
  res.setHeader('x-content-type-options', 'nosniff');
  res.setHeader('x-frame-options', 'DENY');
  res.setHeader('referrer-policy', 'no-referrer');
  res.setHeader('permissions-policy', 'camera=(self), microphone=(self), geolocation=()');
  res.setHeader('cross-origin-resource-policy', 'same-site');
  if (process.env.NODE_ENV === 'production') {
    res.setHeader('strict-transport-security', 'max-age=15552000; includeSubDomains');
  }
  next();
}