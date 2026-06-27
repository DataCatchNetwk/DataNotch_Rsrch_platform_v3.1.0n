import { apiRequest } from "./client";

export type RequestComment = {
  id: string;
  createdAt: string;
  content?: string;
};

export type RequestItem = {
  id: string;
  title: string;
  status: string;
  updatedAt: string;
  comments?: RequestComment[];
};

export type ListRequestsParams = {
  page?: string;
  limit?: string;
};

type RequestsEnvelope = {
  items?: RequestItem[];
  total?: number;
  page?: number;
  limit?: number;
};

const EMPTY_RESPONSE: Required<RequestsEnvelope> = {
  items: [],
  total: 0,
  page: 1,
  limit: 50,
};

export async function listRequests(params: ListRequestsParams = {}) {
  const search = new URLSearchParams();
  if (params.page) search.set("page", params.page);
  if (params.limit) search.set("limit", params.limit);
  const suffix = search.toString() ? `?${search.toString()}` : "";

  const candidates = [`/requests${suffix}`, `/v1/requests${suffix}`];

  for (const path of candidates) {
    try {
      const data = await apiRequest<RequestsEnvelope>(path);
      return {
        items: data.items ?? [],
        total: data.total ?? 0,
        page: data.page ?? Number(params.page ?? "1"),
        limit: data.limit ?? Number(params.limit ?? "50"),
      };
    } catch {
      // Try the next known route variant.
    }
  }

  return EMPTY_RESPONSE;
}
