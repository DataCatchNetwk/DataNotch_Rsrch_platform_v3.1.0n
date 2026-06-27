import type { Request, Response } from 'express';
import {
  createApplication,
  listApplicationsForAdmin,
  getApplicationDetail,
  reviewApplication,
  requestMoreInfo,
  type UploadedFiles,
} from '../services/researcher-application.service.js';

export async function submitApplication(req: Request, res: Response) {
  const files = req.files as UploadedFiles | undefined;
  const result = await createApplication(req.body, files ?? {});
  res.status(201).json(result);
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
