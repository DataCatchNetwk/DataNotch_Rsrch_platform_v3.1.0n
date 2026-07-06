const rawApiBase =
  process.env.NEXT_PUBLIC_API_BASE_URL?.trim() ||
  process.env.NEXT_PUBLIC_API_URL?.trim();

export function getApiBaseUrl() {
  if (rawApiBase) {
    return rawApiBase.replace(/\/+$/, '');
  }

  if (process.env.NODE_ENV !== 'production') {
    return 'http://127.0.0.1:3001';
  }

  if (typeof window === 'undefined') {
    return 'http://127.0.0.1:3001';
  }

  throw new Error('NEXT_PUBLIC_API_BASE_URL is required in production.');
}

export function apiUrl(path: string) {
  if (/^https?:\/\//i.test(path)) {
    return path;
  }

  const cleanPath = path.startsWith('/') ? path : `/${path}`;
  return `${getApiBaseUrl()}${cleanPath}`;
}

export function apiPathUrl(path: string) {
  const base = getApiBaseUrl();
  const cleanPath = path.startsWith('/') ? path : `/${path}`;

  if (cleanPath.startsWith('/api/')) {
    return apiUrl(cleanPath);
  }

  return base.endsWith('/api')
    ? `${base}${cleanPath}`
    : `${base}/api${cleanPath}`;
}
