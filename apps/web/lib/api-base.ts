const rawApiBase = process.env.NEXT_PUBLIC_API_BASE_URL?.trim();

export function getApiBaseUrl() {
  if (rawApiBase) {
    return rawApiBase.replace(/\/+$/, '');
  }

  if (process.env.NODE_ENV !== 'production') {
    return 'http://127.0.0.1:3001';
  }

  throw new Error('NEXT_PUBLIC_API_BASE_URL is required in production.');
}
