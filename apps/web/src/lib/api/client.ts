import { apiPathUrl } from "@/lib/api-base";

const TOKEN_KEY = "auth_token";

type RequestOptions = RequestInit & {
  json?: unknown;
};

function getStoredToken() {
  if (typeof window === "undefined") {
    return null;
  }

  try {
    return window.localStorage.getItem(TOKEN_KEY) ?? window.sessionStorage.getItem(TOKEN_KEY);
  } catch {
    return null;
  }
}

export async function apiRequest<T>(path: string, options: RequestOptions = {}): Promise<T> {
  const { json, headers, ...rest } = options;
  const isFormData = typeof FormData !== "undefined" && json instanceof FormData;
  const token = getStoredToken();
  const requestUrl = apiPathUrl(path);

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
