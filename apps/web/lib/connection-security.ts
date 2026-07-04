export type ConnectionSecurityStatus = 'secure' | 'insecure' | 'local-dev';

const LOCAL_HOSTS = new Set(['localhost', '127.0.0.1', '::1']);

function isLocalHost(hostname: string): boolean {
  return LOCAL_HOSTS.has(hostname.toLowerCase());
}

export function evaluateConnectionSecurity(): ConnectionSecurityStatus {
  if (typeof window === 'undefined') return 'insecure';

  const pageUrl = new URL(window.location.href);
  const apiBase = process.env.NEXT_PUBLIC_API_BASE_URL ?? process.env.NEXT_PUBLIC_API_URL ?? window.location.origin;

  let apiUrl: URL;
  try {
    apiUrl = new URL(apiBase);
  } catch {
    apiUrl = new URL(window.location.origin);
  }

  const localDev = isLocalHost(pageUrl.hostname) && isLocalHost(apiUrl.hostname);
  if (localDev) return 'local-dev';

  const pageSecure = pageUrl.protocol === 'https:';
  const apiSecure = apiUrl.protocol === 'https:';

  return pageSecure && apiSecure ? 'secure' : 'insecure';
}
