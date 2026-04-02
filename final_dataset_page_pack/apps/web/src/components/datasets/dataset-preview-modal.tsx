"use client"

import { useEffect, useState } from "react"
import type { Dataset, DatasetPreviewResponse } from "@/lib/types/dataset"
import { getDatasetPreview } from "@/lib/api/datasets"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog"

export function DatasetPreviewModal({
  dataset,
  open,
  onOpenChange,
}: {
  dataset: Dataset | null
  open: boolean
  onOpenChange: (open: boolean) => void
}) {
  const [preview, setPreview] = useState<DatasetPreviewResponse | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!dataset || !open) return
    let mounted = true

    async function load() {
      setLoading(true)
      setError(null)
      try {
        const data = await getDatasetPreview(dataset.id)
        if (mounted) setPreview(data)
      } catch (e) {
        if (mounted) setError(e instanceof Error ? e.message : "Failed to load preview")
      } finally {
        if (mounted) setLoading(false)
      }
    }

    void load()
    return () => {
      mounted = false
    }
  }, [dataset, open])

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[85vh] max-w-5xl overflow-hidden rounded-2xl">
        <DialogHeader>
          <DialogTitle>{dataset?.name ?? "Dataset preview"}</DialogTitle>
          <DialogDescription>
            Preview of the first rows and columns before pulling into a workspace.
          </DialogDescription>
        </DialogHeader>

        {loading ? <div className="py-8 text-sm">Loading preview…</div> : null}
        {error ? <div className="py-8 text-sm text-red-600">{error}</div> : null}

        {!loading && !error && preview ? (
          <div className="overflow-auto rounded-xl border">
            <table className="w-full text-sm">
              <thead className="bg-muted/40">
                <tr>
                  {preview.columns.map((column) => (
                    <th key={column} className="whitespace-nowrap px-4 py-3 text-left">
                      {column}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {preview.rows.map((row, rowIndex) => (
                  <tr key={rowIndex} className="border-t">
                    {preview.columns.map((column) => (
                      <td key={column} className="whitespace-nowrap px-4 py-3">
                        {String(row[column] ?? "")}
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : null}
      </DialogContent>
    </Dialog>
  )
}
