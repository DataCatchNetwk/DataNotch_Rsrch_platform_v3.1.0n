export const API_BASE = process.env.NEXT_PUBLIC_COMM_API || 'http://localhost:4100/api';

export async function api(path: string, options: RequestInit = {}) {
  const res = await fetch(`${API_BASE}${path}`, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      'x-user-id': 'demo-admin',
      'x-user-role': 'ADMIN',
      ...(options.headers || {})
    },
    cache: 'no-store'
  });
  if (!res.ok) throw new Error((await res.json()).error || 'Request failed');
  return res.json();
}
