import type { Request, Response } from 'express';
import { forgotPassword, getCurrentUser, loginUser, registerAdminUser, registerUser, resetPassword } from '../services/auth.service.js';

export async function register(req: Request, res: Response) {
  const result = await registerUser(req.body);
  res.status(201).json(result);
}

export async function login(req: Request, res: Response) {
  const result = await loginUser(req.body);
  res.json(result);
}

export async function registerAdmin(req: Request, res: Response) {
  const result = await registerAdminUser(req.body);
  res.status(201).json(result);
}

export async function forgot(req: Request, res: Response) {
  const result = await forgotPassword(req.body.email);
  res.json(result);
}

export async function reset(req: Request, res: Response) {
  const result = await resetPassword(req.body);
  res.json(result);
}

export async function me(req: Request, res: Response) {
  const result = await getCurrentUser(req.user!.id);
  res.json({ user: result });
}
