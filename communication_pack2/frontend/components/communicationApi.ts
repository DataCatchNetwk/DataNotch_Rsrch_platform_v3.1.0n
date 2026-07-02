export const API = process.env.NEXT_PUBLIC_COMM_API || 'http://localhost:4100';
export const ADMIN_ID = 'admin-demo';
export const USER_ID = 'user-demo';

export async function api(path: string, options: RequestInit = {}, userId = ADMIN_ID) {
  const res = await fetch(`${API}/api/communication${path}`, {
    ...options,
    headers: { 'Content-Type': 'application/json', 'x-user-id': userId, ...(options.headers || {}) }
  });
  if (!res.ok) throw new Error(await res.text());
  return res.json();
}
