"use client"

import { useEffect, useMemo, useState } from "react"
import { listDatasets, toggleFavorite } from "@/lib/api/datasets"
import type { Dataset } from "@/lib/types/dataset"
import { DatasetFilters } from "@/components/datasets/dataset-filters"
import { DatasetCard } from "@/components/datasets/dataset-card"
import { DatasetTable } from "@/components/datasets/dataset-table"
import { DatasetPreviewModal } from "@/components/datasets/dataset-preview-modal"
import { PullDatasetModal } from "@/components/datasets/pull-dataset-modal"

export default function DatasetsPage() {
  const [datasets, setDatasets] = useState<Dataset[]>([])
  const [query, setQuery] = useState("")
  const [domain, setDomain] = useState("ALL")
  const [accessLevel, setAccessLevel] = useState("ALL")
  const [favoritesOnly, setFavoritesOnly] = useState(false)
  const [view, setView] = useState<"grid" | "table">("grid")
  const [loading, setLoading] = useState(true)
  const [previewDataset, setPreviewDataset] = useState<Dataset | null>(null)
  const [pullDataset, setPullDataset] = useState<Dataset | null>(null)
  const [error, setError] = useState<string | null>(null)

  async function load() {
    setLoading(true)
    setError(null)
    try {
      const result = await listDatasets({
        query,
        domain,
        accessLevel,
        favoritesOnly,
      })
      setDatasets(result.items)
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to load datasets")
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    const handle = setTimeout(() => {
      void load()
    }, 250)
    return () => clearTimeout(handle)
  }, [query, domain, accessLevel, favoritesOnly])

  async function handleToggleFavorite(dataset: Dataset) {
    const previous = datasets
    setDatasets((current) =>
      current.map((item) =>
        item.id === dataset.id ? { ...item, isFavorite: !item.isFavorite } : item
      )
    )

    try {
      await toggleFavorite(dataset.id)
    } catch {
      setDatasets(previous)
    }
  }

  const emptyState = useMemo(() => {
    if (loading) return "Loading datasets..."
    if (error) return error
    return "No datasets matched your current filters."
  }, [loading, error])

  return (
    <div className="space-y-6 p-6">
      <DatasetFilters
        query={query}
        setQuery={setQuery}
        domain={domain}
        setDomain={setDomain}
        accessLevel={accessLevel}
        setAccessLevel={setAccessLevel}
        favoritesOnly={favoritesOnly}
        setFavoritesOnly={setFavoritesOnly}
        view={view}
        setView={setView}
        onRefresh={() => void load()}
      />

      {datasets.length === 0 ? (
        <div className="rounded-2xl border border-dashed p-10 text-center text-sm text-muted-foreground">
          {emptyState}
        </div>
      ) : view === "grid" ? (
        <div className="grid gap-4 md:grid-cols-2 2xl:grid-cols-3">
          {datasets.map((dataset) => (
            <DatasetCard
              key={dataset.id}
              dataset={dataset}
              onPreview={setPreviewDataset}
              onPull={setPullDataset}
              onToggleFavorite={handleToggleFavorite}
            />
          ))}
        </div>
      ) : (
        <DatasetTable
          datasets={datasets}
          onPreview={setPreviewDataset}
          onPull={setPullDataset}
          onToggleFavorite={handleToggleFavorite}
        />
      )}

      <DatasetPreviewModal
        dataset={previewDataset}
        open={!!previewDataset}
        onOpenChange={(open) => {
          if (!open) setPreviewDataset(null)
        }}
      />

      <PullDatasetModal
        dataset={pullDataset}
        open={!!pullDataset}
        onOpenChange={(open) => {
          if (!open) setPullDataset(null)
        }}
      />
    </div>
  )
}
