import type { Request, Response } from 'express';
import { forgotPassword, getCurrentUser, getSsoAuthorizationUrl, getSsoConfigurationStatus, loginUser, registerAdminUser, registerUser, resetPassword } from '../services/auth.service.js';

export async function register(req: Request, res: Response) {
  const result = await registerUser(req.body);
  res.status(201).json(result);
}

export async function login(req: Request, res: Response) {
  const result = await loginUser(req.body, {
    userAgent: req.get('user-agent') ?? undefined,
    ipAddress:
      req.ip ??
      (typeof req.headers['x-forwarded-for'] === 'string'
        ? req.headers['x-forwarded-for'].split(',')[0]?.trim()
        : undefined),
  });
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

export async function ssoConfiguration(_req: Request, res: Response) {
  res.json(getSsoConfigurationStatus());
}

export async function startSso(req: Request, res: Response) {
  const provider = req.params.provider as 'google' | 'microsoft';
  console.log('Google ID:', Boolean(process.env.GOOGLE_OAUTH_CLIENT_ID));
  console.log('Microsoft ID:', Boolean(process.env.MICROSOFT_OAUTH_CLIENT_ID));
  const authorizationUrl = getSsoAuthorizationUrl(provider);
  res.json({ url: authorizationUrl });
}

export async function completeSso(_req: Request, res: Response) {
  res.status(501).json({ message: 'SSO callback is not implemented yet for this deployment.' });
}
