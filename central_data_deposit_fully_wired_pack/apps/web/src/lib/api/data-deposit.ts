import type {
  DepositDatasetDetail,
  DepositDatasetSummary,
  DepositPreviewResponse,
  PullToWorkspacePayload,
} from '@/lib/types/data-deposit'

const API_BASE = process.env.NEXT_PUBLIC_API_BASE_URL ?? 'http://localhost:4000'

async function jsonOrThrow<T>(res: Response): Promise<T> {
  if (!res.ok) {
    const text = await res.text()
    throw new Error(text || 'Request failed')
  }
  return res.json()
}

export async function listDepositDatasets(params?: {
  search?: string
  domain?: string
  accessibility?: string
  favoritesOnly?: boolean
  page?: number
  pageSize?: number
}) {
  const qs = new URLSearchParams()
  if (params?.search) qs.set('search', params.search)
  if (params?.domain) qs.set('domain', params.domain)
  if (params?.accessibility) qs.set('accessibility', params.accessibility)
  if (params?.favoritesOnly) qs.set('favoritesOnly', 'true')
  if (params?.page) qs.set('page', String(params.page))
  if (params?.pageSize) qs.set('pageSize', String(params.pageSize))

  const res = await fetch(`${API_BASE}/api/v1/datasets/deposit?${qs.toString()}`, {
    credentials: 'include',
    cache: 'no-store',
  })
  return jsonOrThrow<{ items: DepositDatasetSummary[]; total: number }>(res)
}

export async function getDepositDataset(id: string) {
  const res = await fetch(`${API_BASE}/api/v1/datasets/deposit/${id}`, {
    credentials: 'include',
    cache: 'no-store',
  })
  return jsonOrThrow<DepositDatasetDetail>(res)
}

export async function previewDepositDataset(id: string) {
  const res = await fetch(`${API_BASE}/api/v1/datasets/deposit/${id}/preview`, {
    credentials: 'include',
    cache: 'no-store',
  })
  return jsonOrThrow<DepositPreviewResponse>(res)
}

export async function pullDepositDataset(id: string, body: PullToWorkspacePayload) {
  const res = await fetch(`${API_BASE}/api/v1/datasets/deposit/${id}/pull`, {
    method: 'POST',
    credentials: 'include',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  })
  return jsonOrThrow<{ jobId: string; status: string }>(res)
}

export async function toggleFavoriteDataset(id: string, favorite: boolean) {
  const res = await fetch(`${API_BASE}/api/v1/datasets/deposit/${id}/favorite`, {
    method: 'POST',
    credentials: 'include',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ favorite }),
  })
  return jsonOrThrow<{ ok: true }>(res)
}
