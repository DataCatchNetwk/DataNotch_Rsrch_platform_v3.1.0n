import { apiFetch } from '@/lib/api';
import type { AppUser } from '@/lib/auth-storage';

export type UserLoginPayload = {
  email: string;
  password: string;
  deviceId?: string;
  deviceName?: string;
};

export type LoginResponse = {
  accessToken: string;
  refreshToken: string;
  expiresIn: number;
  user: AppUser;
};

type LegacyLoginResponse = {
  message: string;
  token: string;
  user: AppUser;
};

export type RefreshResponse = {
  accessToken: string;
  refreshToken: string;
  expiresIn: number;
};

export async function loginUser(payload: UserLoginPayload) {
  const data = await apiFetch<LoginResponse | LegacyLoginResponse>('/api/v1/auth/login', {
    method: 'POST',
    body: {
      identifier: payload.email,
      password: payload.password,
      deviceId: payload.deviceId,
      deviceName: payload.deviceName,
    },
  });

  if ('accessToken' in data) return data;

  return {
    accessToken: data.token,
    refreshToken: '',
    expiresIn: 0,
    user: data.user,
  } satisfies LoginResponse;
}

export async function refreshUserToken(refreshToken: string) {
  return apiFetch<RefreshResponse>('/api/v1/auth/refresh', {
    method: 'POST',
    body: { refreshToken },
  });
}

export async function logoutUser(refreshToken: string, accessToken: string) {
  return apiFetch<{ success: true }>('/api/v1/auth/logout', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${accessToken}`,
    },
    body: { refreshToken },
  });
}

export async function getCurrentUser(accessToken: string) {
  return apiFetch<{ user: AppUser }>('/api/v1/auth/me', {
    method: 'GET',
    headers: {
      Authorization: `Bearer ${accessToken}`,
    },
  });
}

const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL ?? 'http://localhost:3001';

type SsoStartResponse = {
  url?: string;
  message?: string;
};

async function getSsoStart(provider: 'google' | 'microsoft', fallbackMessage: string) {
  const response = await fetch(`${API_BASE_URL}/api/v1/auth/sso/${provider}/start`, {
    method: 'GET',
    credentials: 'include',
    cache: 'no-store',
    redirect: 'manual',
  });

  if (response.status >= 300 && response.status < 400) {
    const location = response.headers.get('location');
    if (location) {
      return { url: location };
    }
  }

  const contentType = response.headers.get('content-type') ?? '';
  let data: SsoStartResponse | null = null;

  if (contentType.includes('application/json')) {
    data = (await response.json()) as SsoStartResponse;
  }

  if (!response.ok) {
    throw new Error(data?.message || fallbackMessage);
  }

  if (data?.url) {
    return { url: data.url };
  }

  return {
    url: `${API_BASE_URL}/api/v1/auth/sso/${provider}/start`,
  };
}

export async function getGoogleSsoStart() {
  return getSsoStart('google', 'Google sign-in is not configured.');
}

export async function getMicrosoftSsoStart() {
  return getSsoStart('microsoft', 'Microsoft sign-in is not configured.');
}
