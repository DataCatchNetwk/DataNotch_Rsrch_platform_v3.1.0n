import type { Request, Response } from 'express';
import { Prisma } from '@prisma/client';
import {
  createApplication,
  listApplicationsForAdmin,
  getApplicationDetail,
  reviewApplication,
  requestMoreInfo,
  type UploadedFiles,
} from '../services/researcher-application.service.js';
import { getRequestId } from '../middleware/request-id.js';
import { HttpError } from '../utils/errors.js';

function errorType(error: unknown) {
  if (error instanceof Prisma.PrismaClientKnownRequestError) {
    return `PrismaClientKnownRequestError:${error.code}`;
  }

  if (error instanceof Prisma.PrismaClientValidationError) {
    return 'PrismaClientValidationError';
  }

  if (error instanceof HttpError) {
    return `HttpError:${error.statusCode}`;
  }

  return error instanceof Error ? error.name : typeof error;
}

export async function submitApplication(req: Request, res: Response) {
  const requestId = getRequestId(res);

  try {
    const files = req.files as UploadedFiles | undefined;
    const result = await createApplication(req.body, files ?? {}, { requestId, route: req.path, method: req.method });
    res.status(201).json({ ...result, requestId });
  } catch (error) {
    const status = error instanceof HttpError ? error.statusCode : 500;
    console.error('[researcher-registration] failed', {
      requestId,
      route: req.path,
      method: req.method,
      errorType: errorType(error),
      stack: process.env.NODE_ENV === 'production' ? undefined : error instanceof Error ? error.stack : undefined,
    });

    res.status(status).json({
      error: 'REGISTRATION_FAILED',
      message:
        error instanceof HttpError && status < 500
          ? error.message
          : 'Unable to submit registration application.',
      requestId,
    });
  }
}

export async function listApplications(req: Request, res: Response) {
  const { page, limit, search, reviewStatus, sortDirection } = req.query;
  const result = await listApplicationsForAdmin({
    page: page ? Number(page) : undefined,
    limit: limit ? Number(limit) : undefined,
    search: search as string | undefined,
    reviewStatus: reviewStatus as string | undefined,
    sortDirection: sortDirection === 'asc' ? 'asc' : 'desc',
  });
  res.json(result);
}

export async function getApplicationById(req: Request, res: Response) {
  const result = await getApplicationDetail(req.params.id!);
  res.json(result);
}

export async function reviewApplicationById(req: Request, res: Response) {
  const reviewerUserId = req.user?.id ?? 'system-admin';
  const result = await reviewApplication(req.params.id!, req.body, reviewerUserId);
  res.json(result);
}

export async function requestMoreInfoById(req: Request, res: Response) {
  const reviewerUserId = req.user?.id ?? 'system-admin';
  const result = await requestMoreInfo(req.params.id!, req.body, reviewerUserId);
  res.json(result);
}
