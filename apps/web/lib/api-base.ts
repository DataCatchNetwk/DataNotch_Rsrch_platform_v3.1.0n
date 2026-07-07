const rawApiBase =
  process.env.NEXT_PUBLIC_API_BASE_URL?.trim() ||
  process.env.NEXT_PUBLIC_API_URL?.trim();

const apiPathPattern = /^\/?api(?:\/|$)/i;

function asUrl(base: string) {
  return new URL(base.endsWith('/') ? base : `${base}/`);
}

function ensureLeadingSlash(path: string) {
  return path.startsWith('/') ? path : `/${path}`;
}

function stripTrailingSlash(path: string) {
  return path.replace(/\/+$/, '');
}

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

  const base = asUrl(getApiBaseUrl());
  const cleanPath = ensureLeadingSlash(path);

  if (apiPathPattern.test(cleanPath)) {
    return new URL(cleanPath, base.origin).href;
  }

  return new URL(cleanPath.replace(/^\/+/, ''), base).href;
}

export function apiPathUrl(path: string) {
  if (/^https?:\/\//i.test(path)) {
    return path;
  }

  const base = asUrl(getApiBaseUrl());
  let cleanPath = ensureLeadingSlash(path);

  if (apiPathPattern.test(cleanPath)) {
    return apiUrl(cleanPath);
  }

  let apiBasePath = stripTrailingSlash(base.pathname);
  if (!apiPathPattern.test(apiBasePath)) {
    apiBasePath = `${apiBasePath}/api`;
  }

  const baseVersion = apiBasePath.match(/\/(v\d+)$/i)?.[1];
  const pathVersion = cleanPath.match(/^\/(v\d+)(?:\/|$)/i)?.[1];
  if (baseVersion && pathVersion?.toLowerCase() === baseVersion.toLowerCase()) {
    cleanPath = cleanPath.slice(pathVersion.length + 1) || '/';
  }

  return new URL(`${stripTrailingSlash(apiBasePath)}${cleanPath}`, base.origin).href;
}
