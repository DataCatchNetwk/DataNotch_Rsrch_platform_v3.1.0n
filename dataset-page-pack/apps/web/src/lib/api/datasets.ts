import type { DatasetListItem, DatasetQueryState } from '@/components/datasets/types'

const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL ?? 'http://localhost:4000/api/v1'

function buildQuery(query: DatasetQueryState) {
  const params = new URLSearchParams()
  if (query.search) params.set('search', query.search)
  if (query.section !== 'all') params.set('section', query.section)
  if (query.visibility !== 'all') params.set('visibility', query.visibility)
  if (query.workspaceId !== 'all') params.set('workspaceId', query.workspaceId)
  if (query.tag !== 'all') params.set('tag', query.tag)
  params.set('sortBy', query.sortBy)
  if (query.favoritesOnly) params.set('favoritesOnly', 'true')
  return params.toString()
}

export async function getDatasets(query: DatasetQueryState): Promise<DatasetListItem[]> {
  const res = await fetch(`${API_BASE_URL}/datasets?${buildQuery(query)}`, {
    credentials: 'include',
    cache: 'no-store',
  })

  if (!res.ok) {
    throw new Error('Unable to fetch datasets')
  }

  return res.json()
}

export async function toggleDatasetFavorite(datasetId: string) {
  const res = await fetch(`${API_BASE_URL}/datasets/${datasetId}/favorite`, {
    method: 'POST',
    credentials: 'include',
  })

  if (!res.ok) throw new Error('Unable to update favorite')
  return res.json()
}

export async function pullDatasetToWorkspace(datasetId: string, workspaceId: string) {
  const res = await fetch(`${API_BASE_URL}/datasets/${datasetId}/pull`, {
    method: 'POST',
    credentials: 'include',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ workspaceId }),
  })

  if (!res.ok) throw new Error('Unable to pull dataset')
  return res.json()
}
