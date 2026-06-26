import type { NextFunction, Request, Response } from 'express';
import { HttpError } from '../utils/errors.js';

type Bucket = { count: number; resetAt: number };

const buckets = new Map<string, Bucket>();
const windowMs = Number(process.env.RATE_LIMIT_WINDOW_MS ?? 60_000);
const defaultLimit = Number(process.env.RATE_LIMIT_MAX ?? 600);
const authLimit = Number(process.env.AUTH_RATE_LIMIT_MAX ?? 40);

function keyFor(req: Request) {
  const forwarded = req.headers['x-forwarded-for'];
  const ip = typeof forwarded === 'string' ? forwarded.split(',')[0]?.trim() : req.ip;
  return `${ip ?? req.socket.remoteAddress ?? 'unknown'}:${req.path}`;
}

function limitFor(req: Request) {
  return req.path.includes('/auth/login') || req.path.includes('/auth/register') || req.path.includes('/forgot-password')
    ? authLimit
    : defaultLimit;
}

export function rateLimit(req: Request, res: Response, next: NextFunction) {
  if ((process.env.RATE_LIMIT_ENABLED ?? 'true').toLowerCase() === 'false') {
    next();
    return;
  }

  const now = Date.now();
  const key = keyFor(req);
  const limit = limitFor(req);
  const current = buckets.get(key);
  const bucket = !current || current.resetAt <= now ? { count: 0, resetAt: now + windowMs } : current;
  bucket.count += 1;
  buckets.set(key, bucket);

  res.setHeader('x-rate-limit-limit', String(limit));
  res.setHeader('x-rate-limit-remaining', String(Math.max(0, limit - bucket.count)));
  res.setHeader('x-rate-limit-reset', new Date(bucket.resetAt).toISOString());

  if (bucket.count > limit) {
    next(new HttpError(429, 'Too many requests. Please slow down and try again shortly.'));
    return;
  }

  if (buckets.size > 10000) {
    for (const [entryKey, entry] of buckets) {
      if (entry.resetAt <= now) buckets.delete(entryKey);
    }
  }

  next();
}