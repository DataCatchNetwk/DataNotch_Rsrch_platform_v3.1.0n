import type { Request, Response } from 'express';
import { createHealthData, getHealthDataById, listHealthData } from '../services/health-data.service.js';

export async function list(req: Request, res: Response) {
  const result = await listHealthData();
  res.json({ data: result });
}

export async function getById(req: Request, res: Response) {
  const result = await getHealthDataById(req.params.id);
  res.json({ data: result });
}

export async function create(req: Request, res: Response) {
  const result = await createHealthData(req.user!.id, req.body);
  res.status(201).json({ message: 'Health data created', data: result });
}
