const RAW_API_BASE = process.env.NEXT_PUBLIC_API_BASE_URL ?? process.env.NEXT_PUBLIC_API_URL ?? 'http://127.0.0.1:3001';
const API_BASE = RAW_API_BASE.replace(/\/+$/, '');

type RequestOptions = {
  method?: string;
  body?: unknown;
  token?: string;
  headers?: Record<string, string>;
};

export async function apiFetch<T = unknown>(path: string, opts: RequestOptions = {}): Promise<T> {
  const headers: Record<string, string> = { 'Content-Type': 'application/json', ...(opts.headers ?? {}) };
  if (opts.token && !headers['Authorization']) headers['Authorization'] = `Bearer ${opts.token}`;

  let url = path;
  if (!/^https?:\/\//i.test(path)) {
    if (path.startsWith('/api/')) {
      url = `${API_BASE}${path}`;
    } else {
      const normalizedPath = path.startsWith('/') ? path : `/${path}`;
      url = API_BASE.endsWith('/api') ? `${API_BASE}${normalizedPath}` : `${API_BASE}/api${normalizedPath}`;
    }
  }

  const body =
    opts.body === undefined
      ? undefined
      : typeof opts.body === 'string'
        ? opts.body
        : JSON.stringify(opts.body);

  let res: Response;
  try {
    res = await fetch(url, {
      method: opts.method ?? 'GET',
      headers,
      body,
    });
  } catch (error) {
    const message =
      error instanceof Error && error.message
        ? `Unable to reach the API at ${API_BASE}. Start the server and database, then try again.`
        : 'Unable to reach the API. Start the server and try again.';
    throw new ApiError(0, message, { cause: error, url });
  }

  const data = await res.json().catch(() => ({}));

  if (!res.ok) {
    const message = (data as { message?: string }).message ?? `Request failed (${res.status})`;
    throw new ApiError(res.status, message, data);
  }

  return data as T;
}

export class ApiError extends Error {
  status: number;
  data: unknown;
  constructor(status: number, message: string, data: unknown) {
    super(message);
    this.status = status;
    this.data = data;
  }
}
