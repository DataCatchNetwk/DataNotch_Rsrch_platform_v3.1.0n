import type { NextFunction, Request, Response } from 'express';
import multer from 'multer';
import { ZodError } from 'zod';
import { HttpError } from '../utils/errors.js';
import { getRequestId } from './request-id.js';

export function errorHandler(err: unknown, _req: Request, res: Response, _next: NextFunction): void {
  const requestId = getRequestId(res);

  if (err instanceof ZodError) {
    res.status(400).json({ message: 'Validation failed', errors: err.flatten(), requestId });
    return;
  }

  if (err instanceof HttpError) {
    res.status(err.statusCode).json({ message: err.message, requestId });
    return;
  }

  if (err instanceof multer.MulterError) {
    const message =
      err.code === 'LIMIT_FILE_SIZE'
        ? 'Uploaded dataset exceeds the configured file size limit.'
        : err.code === 'LIMIT_FILE_COUNT'
          ? 'Uploaded dataset contains too many files.'
          : err.message;
    res.status(413).json({ message, code: err.code, requestId });
    return;
  }

  console.error({ requestId, err });
  res.status(500).json({ message: 'Internal server error', requestId });
}
