"use client"

import { useEffect, useState } from 'react'
import { getDepositPreview } from '@/lib/api/data-deposit'
import type { DepositPreview } from '@/lib/types/data-deposit'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'

export function DataPreviewModal({
  datasetId,
  open,
  onOpenChange,
}: {
  datasetId: string | null
  open: boolean
  onOpenChange: (open: boolean) => void
}) {
  const [preview, setPreview] = useState<DepositPreview | null>(null)
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    if (!datasetId || !open) return
    setLoading(true)
    getDepositPreview(datasetId)
      .then(setPreview)
      .finally(() => setLoading(false))
  }, [datasetId, open])

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl rounded-2xl">
        <DialogHeader>
          <DialogTitle>{preview?.name ?? 'Dataset Preview'}</DialogTitle>
        </DialogHeader>

        {loading ? <div>Loading preview...</div> : null}

        {preview ? (
          <div className="space-y-4">
            <p className="text-sm text-muted-foreground">{preview.description}</p>
            <div className="grid gap-3 md:grid-cols-3">
              <div className="rounded-xl border p-3 text-sm">Rows: {preview.rowCount ?? '-'}</div>
              <div className="rounded-xl border p-3 text-sm">Columns: {preview.columnCount ?? '-'}</div>
              <div className="rounded-xl border p-3 text-sm">Published: {preview.lastPublishedAt ? new Date(preview.lastPublishedAt).toLocaleDateString() : '-'}</div>
            </div>
            <div className="overflow-auto rounded-xl border">
              <pre className="p-4 text-xs">{JSON.stringify(preview.sampleRowsJson ?? [], null, 2)}</pre>
            </div>
          </div>
        ) : null}
      </DialogContent>
    </Dialog>
  )
}
