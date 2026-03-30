const RAW_API_BASE =
  process.env.NEXT_PUBLIC_API_BASE_URL ??
  process.env.NEXT_PUBLIC_API_URL ??
  "http://localhost:4000";

const API_BASE = RAW_API_BASE.replace(/\/+$/, "");
const TOKEN_KEY = "auth_token";

type RequestOptions = RequestInit & {
  json?: unknown;
};

function getStoredToken() {
  if (typeof window === "undefined") {
    return null;
  }

  try {
    return window.localStorage.getItem(TOKEN_KEY);
  } catch {
    return null;
  }
}

export async function apiRequest<T>(path: string, options: RequestOptions = {}): Promise<T> {
  const { json, headers, ...rest } = options;
  const isFormData = typeof FormData !== "undefined" && json instanceof FormData;
  const token = getStoredToken();
  const normalizedPath = path.startsWith("/") ? path : `/${path}`;
  const requestUrl = normalizedPath.startsWith("/api/")
    ? `${API_BASE}${normalizedPath}`
    : API_BASE.endsWith("/api")
      ? `${API_BASE}${normalizedPath}`
      : `${API_BASE}/api${normalizedPath}`;

  const response = await fetch(requestUrl, {
    ...rest,
    credentials: "include",
    cache: "no-store",
    headers: {
      ...(isFormData ? {} : { "Content-Type": "application/json" }),
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...(headers ?? {}),
    },
    body:
      json === undefined
        ? rest.body
        : isFormData
          ? (json as FormData)
          : JSON.stringify(json),
  });

  if (!response.ok) {
    let message = "Request failed";
    try {
      const data = await response.json();
      message =
        data?.message && Array.isArray(data.message)
          ? data.message.join(", ")
          : data?.message || message;
    } catch {
      try {
        message = await response.text();
      } catch {
        // noop
      }
    }
    throw new Error(message);
  }

  if (response.status === 204) {
    return undefined as T;
  }

  return response.json();
}