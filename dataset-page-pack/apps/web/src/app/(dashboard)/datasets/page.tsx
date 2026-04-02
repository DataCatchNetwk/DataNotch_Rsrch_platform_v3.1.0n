'use client'

import { useEffect, useMemo, useState } from 'react'
import { DatasetHeader } from '@/components/datasets/dataset-header'
import { DatasetFilters } from '@/components/datasets/dataset-filters'
import { DatasetGrid } from '@/components/datasets/dataset-grid'
import { DatasetTable } from '@/components/datasets/dataset-table'
import { DatasetPreviewModal } from '@/components/datasets/dataset-preview-modal'
import { DatasetPullModal } from '@/components/datasets/dataset-pull-modal'
import { getDatasets, toggleDatasetFavorite, pullDatasetToWorkspace } from '@/lib/api/datasets'
import type { DatasetListItem, DatasetQueryState, DatasetViewMode } from '@/components/datasets/types'

const initialQuery: DatasetQueryState = {
  search: '',
  section: 'library',
  visibility: 'all',
  workspaceId: 'all',
  tag: 'all',
  sortBy: 'updatedAt',
  favoritesOnly: false,
}

export default function DatasetsPage() {
  const [viewMode, setViewMode] = useState<DatasetViewMode>('grid')
  const [query, setQuery] = useState<DatasetQueryState>(initialQuery)
  const [items, setItems] = useState<DatasetListItem[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [previewDataset, setPreviewDataset] = useState<DatasetListItem | null>(null)
  const [pullDataset, setPullDataset] = useState<DatasetListItem | null>(null)

  async function load() {
    try {
      setLoading(true)
      setError(null)
      const data = await getDatasets(query)
      setItems(data)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load datasets')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    void load()
  }, [query])

  const stats = useMemo(() => {
    const favorites = items.filter((item) => item.isFavorite).length
    const workspaceLinked = items.filter((item) => item.workspaceCount > 0).length
    const ready = items.filter((item) => item.status === 'READY').length
    return {
      total: items.length,
      favorites,
      workspaceLinked,
      ready,
    }
  }, [items])

  async function handleFavorite(datasetId: string) {
    const next = items.map((item) =>
      item.id === datasetId ? { ...item, isFavorite: !item.isFavorite } : item,
    )
    setItems(next)
    try {
      await toggleDatasetFavorite(datasetId)
    } catch {
      setItems(items)
    }
  }

  async function handlePull(datasetId: string, workspaceId: string) {
    await pullDatasetToWorkspace(datasetId, workspaceId)
    setPullDataset(null)
    await load()
  }

  return (
    <div className="space-y-6 p-6">
      <DatasetHeader
        stats={stats}
        viewMode={viewMode}
        onViewModeChange={setViewMode}
        onRefresh={load}
      />

      <DatasetFilters query={query} onChange={setQuery} />

      {error ? (
        <div className="rounded-2xl border border-red-200 bg-red-50 p-5 text-sm text-red-700">
          {error}
        </div>
      ) : loading ? (
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          {Array.from({ length: 8 }).map((_, index) => (
            <div key={index} className="h-44 animate-pulse rounded-2xl border bg-muted/30" />
          ))}
        </div>
      ) : items.length === 0 ? (
        <div className="rounded-3xl border border-dashed p-10 text-center">
          <h3 className="text-lg font-semibold">No datasets found</h3>
          <p className="mt-2 text-sm text-muted-foreground">
            Adjust your filters, switch sections, or pull from the global catalog.
          </p>
        </div>
      ) : viewMode === 'grid' ? (
        <DatasetGrid
          items={items}
          onPreview={setPreviewDataset}
          onPull={setPullDataset}
          onFavorite={handleFavorite}
        />
      ) : (
        <DatasetTable
          items={items}
          onPreview={setPreviewDataset}
          onPull={setPullDataset}
          onFavorite={handleFavorite}
        />
      )}

      <DatasetPreviewModal
        dataset={previewDataset}
        open={Boolean(previewDataset)}
        onOpenChange={(open) => !open && setPreviewDataset(null)}
        onPull={(dataset) => setPullDataset(dataset)}
        onFavorite={handleFavorite}
      />

      <DatasetPullModal
        dataset={pullDataset}
        open={Boolean(pullDataset)}
        onOpenChange={(open) => !open && setPullDataset(null)}
        onSubmit={handlePull}
      />
    </div>
  )
}
