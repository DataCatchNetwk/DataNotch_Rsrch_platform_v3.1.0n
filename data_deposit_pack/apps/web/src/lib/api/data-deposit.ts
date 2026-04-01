import type { DepositDataset, DepositPreview } from "@/lib/types/data-deposit";

const API_BASE = process.env.NEXT_PUBLIC_API_BASE_URL ?? "http://localhost:4000";

async function parse<T>(res: Response): Promise<T> {
  if (!res.ok) throw new Error(await res.text() || "Request failed");
  return res.json();
}

export async function listDepositDatasets(params?: {
  search?: string;
  domain?: string;
  featured?: boolean;
}) {
  const qs = new URLSearchParams();
  if (params?.search) qs.set("search", params.search);
  if (params?.domain) qs.set("domain", params.domain);
  if (params?.featured) qs.set("featured", "true");

  const res = await fetch(`${API_BASE}/api/v1/datasets/deposit/public?${qs.toString()}`, {
    credentials: "include",
    cache: "no-store",
  });
  return parse<DepositDataset[]>(res);
}

export async function previewDepositDataset(datasetId: string) {
  const res = await fetch(`${API_BASE}/api/v1/datasets/deposit/${datasetId}/preview`, {
    credentials: "include",
    cache: "no-store",
  });
  return parse<DepositPreview>(res);
}

export async function pullDepositDataset(datasetId: string, body: {
  workspaceId: string;
  selectedFields?: string[];
  filters?: Record<string, unknown>;
}) {
  const res = await fetch(`${API_BASE}/api/v1/datasets/deposit/${datasetId}/pull`, {
    method: "POST",
    credentials: "include",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  return parse(res);
}

export async function toggleDepositFavorite(datasetId: string, isFavorite: boolean) {
  const res = await fetch(`${API_BASE}/api/v1/datasets/deposit/${datasetId}/favorite`, {
    method: isFavorite ? "DELETE" : "POST",
    credentials: "include",
  });
  return parse<{ ok: true }>(res);
}
