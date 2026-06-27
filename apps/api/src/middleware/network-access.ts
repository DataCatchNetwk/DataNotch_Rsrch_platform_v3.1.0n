import type { NextFunction, Request, Response } from 'express';
import { env } from '../config/env.js';
import { HttpError } from '../utils/errors.js';

type IpRiskResponse = {
  ip?: string;
  is_vpn?: boolean;
  vpn?: boolean;
  is_proxy?: boolean;
  proxy?: boolean;
  is_tor?: boolean;
  tor?: boolean;
  is_datacenter?: boolean;
  datacenter?: boolean;
  security?: {
    vpn?: boolean;
    proxy?: boolean;
    tor?: boolean;
    relay?: boolean;
    hosting?: boolean;
  };
};

function toBoolean(value: unknown): boolean {
  return value === true;
}

function normalizeIp(rawIp: string | null | undefined): string | null {
  if (!rawIp) return null;
  const trimmed = rawIp.trim();
  if (!trimmed) return null;
  if (trimmed.startsWith('::ffff:')) return trimmed.slice(7);
  return trimmed;
}

function getClientIp(req: Request): string | null {
  const forwardedFor = req.headers['x-forwarded-for'];
  if (typeof forwardedFor === 'string' && forwardedFor.length > 0) {
    const firstForwardedIp = forwardedFor.split(',')[0]?.trim();
    const normalizedForwarded = normalizeIp(firstForwardedIp);
    if (normalizedForwarded) return normalizedForwarded;
  }

  return normalizeIp(req.ip) ?? normalizeIp(req.socket.remoteAddress);
}

function isPrivateOrLocalIp(ip: string): boolean {
  if (ip === '::1' || ip === 'localhost' || ip === '127.0.0.1') return true;

  if (ip.includes(':')) {
    const lower = ip.toLowerCase();
    return lower.startsWith('fc') || lower.startsWith('fd') || lower.startsWith('fe80');
  }

  const parts = ip.split('.').map((part) => Number(part));
  if (parts.length !== 4 || parts.some((part) => Number.isNaN(part) || part < 0 || part > 255)) {
    return false;
  }

  const [a, b] = parts;
  if (a === 10 || a === 127) return true;
  if (a === 192 && b === 168) return true;
  if (a === 172 && b >= 16 && b <= 31) return true;

  return false;
}

function isBlockedNetwork(data: IpRiskResponse): boolean {
  const vpn =
    toBoolean(data.is_vpn) ||
    toBoolean(data.vpn) ||
    toBoolean(data.security?.vpn) ||
    toBoolean(data.security?.relay);
  const proxy = toBoolean(data.is_proxy) || toBoolean(data.proxy) || toBoolean(data.security?.proxy);
  const tor = toBoolean(data.is_tor) || toBoolean(data.tor) || toBoolean(data.security?.tor);
  const datacenter =
    toBoolean(data.is_datacenter) || toBoolean(data.datacenter) || toBoolean(data.security?.hosting);

  return vpn || proxy || tor || datacenter;
}

export async function assertTrustedNetwork(req: Request) {
  if (!env.AUTH_NETWORK_BLOCK_ENABLED) {
    return;
  }

  const clientIp = getClientIp(req);

  if (clientIp && isPrivateOrLocalIp(clientIp)) {
    return;
  }

  const endpoint = clientIp
    ? `${env.AUTH_NETWORK_CHECK_URL}?q=${encodeURIComponent(clientIp)}`
    : env.AUTH_NETWORK_CHECK_URL;

  try {
    const response = await fetch(endpoint, {
      method: 'GET',
      cache: 'no-store',
      signal: AbortSignal.timeout(env.AUTH_NETWORK_CHECK_TIMEOUT_MS),
    });

    if (!response.ok) {
      if (env.AUTH_NETWORK_FAIL_CLOSED) {
        throw new HttpError(503, 'Unable to verify network security. Please try again shortly.');
      }
      return;
    }

    const data = (await response.json()) as IpRiskResponse;
    if (isBlockedNetwork(data)) {
      throw new HttpError(
        403,
        'Access denied: VPN/proxy/Tor or datacenter network detected. Disconnect and try again.'
      );
    }
  } catch (error) {
    if (error instanceof HttpError) {
      throw error;
    }

    if (env.AUTH_NETWORK_FAIL_CLOSED) {
      throw new HttpError(503, 'Unable to verify network security. Please try again shortly.');
    }
  }
}

export async function enforceTrustedNetwork(req: Request, _res: Response, next: NextFunction) {
  try {
    await assertTrustedNetwork(req);
    next();
  } catch (error) {
    next(error);
  }
}
