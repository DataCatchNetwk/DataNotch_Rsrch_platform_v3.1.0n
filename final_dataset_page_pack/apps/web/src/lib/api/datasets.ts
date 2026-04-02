import type {
  Dataset,
  DatasetListResponse,
  DatasetPreviewResponse,
  PullDatasetInput,
} from "@/lib/types/dataset"

const API_BASE = process.env.NEXT_PUBLIC_API_BASE_URL ?? "http://localhost:4000"

async function jsonOrThrow<T>(res: Response): Promise<T> {
  if (!res.ok) {
    const text = await res.text()
    throw new Error(text || "Request failed")
  }
  return res.json()
}

export async function listDatasets(params?: {
  query?: string
  domain?: string
  accessLevel?: string
  favoritesOnly?: boolean
  page?: number
  pageSize?: number
}) {
  const qs = new URLSearchParams()
  if (params?.query) qs.set("query", params.query)
  if (params?.domain && params.domain !== "ALL") qs.set("domain", params.domain)
  if (params?.accessLevel && params.accessLevel !== "ALL") qs.set("accessLevel", params.accessLevel)
  if (params?.favoritesOnly) qs.set("favoritesOnly", "true")
  qs.set("page", String(params?.page ?? 1))
  qs.set("pageSize", String(params?.pageSize ?? 12))

  const res = await fetch(`${API_BASE}/api/v1/datasets/deposit?${qs.toString()}`, {
    credentials: "include",
    cache: "no-store",
  })
  return jsonOrThrow<DatasetListResponse>(res)
}

export async function getDatasetPreview(datasetId: string) {
  const res = await fetch(`${API_BASE}/api/v1/datasets/deposit/${datasetId}/preview`, {
    credentials: "include",
    cache: "no-store",
  })
  return jsonOrThrow<DatasetPreviewResponse>(res)
}

export async function toggleFavorite(datasetId: string) {
  const res = await fetch(`${API_BASE}/api/v1/datasets/deposit/${datasetId}/favorite`, {
    method: "POST",
    credentials: "include",
  })
  return jsonOrThrow<Dataset>(res)
}

export async function pullDatasetToWorkspace(payload: PullDatasetInput) {
  const res = await fetch(`${API_BASE}/api/v1/datasets/deposit/${payload.datasetId}/pull`, {
    method: "POST",
    credentials: "include",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  })
  return jsonOrThrow<{ jobId: string; status: string }>(res)
}
