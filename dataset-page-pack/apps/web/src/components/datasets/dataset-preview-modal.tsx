import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import type { DatasetListItem } from './types'

export function DatasetPreviewModal({
  dataset,
  open,
  onOpenChange,
  onPull,
  onFavorite,
}: {
  dataset: DatasetListItem | null
  open: boolean
  onOpenChange: (open: boolean) => void
  onPull: (dataset: DatasetListItem) => void
  onFavorite: (datasetId: string) => void
}) {
  if (!dataset) return null

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl rounded-3xl">
        <DialogHeader>
          <DialogTitle>{dataset.name}</DialogTitle>
        </DialogHeader>
        <div className="space-y-4 text-sm">
          <p className="text-muted-foreground">{dataset.description}</p>
          <div className="flex flex-wrap gap-2">
            <Badge variant="secondary">{dataset.section}</Badge>
            <Badge variant="outline">{dataset.visibility}</Badge>
            <Badge variant="outline">{dataset.status}</Badge>
            <Badge variant="outline">Version {dataset.lineageVersion}</Badge>
          </div>
          <div className="grid gap-4 md:grid-cols-2">
            <div className="rounded-2xl border p-4">
              <h4 className="font-medium">Sample columns</h4>
              <ul className="mt-3 space-y-2 text-muted-foreground">
                {dataset.sampleColumns.map((column) => (
                  <li key={column}>{column}</li>
                ))}
              </ul>
            </div>
            <div className="rounded-2xl border p-4">
              <h4 className="font-medium">Governance summary</h4>
              <p className="mt-3 text-muted-foreground">{dataset.governanceSummary}</p>
              <div className="mt-4 grid grid-cols-2 gap-3">
                <div>
                  <div className="text-xs text-muted-foreground">Records</div>
                  <div className="font-medium">{dataset.recordCount.toLocaleString()}</div>
                </div>
                <div>
                  <div className="text-xs text-muted-foreground">Files</div>
                  <div className="font-medium">{dataset.fileCount}</div>
                </div>
                <div>
                  <div className="text-xs text-muted-foreground">Workspaces</div>
                  <div className="font-medium">{dataset.workspaceCount}</div>
                </div>
                <div>
                  <div className="text-xs text-muted-foreground">Size</div>
                  <div className="font-medium">{dataset.sizeLabel}</div>
                </div>
              </div>
            </div>
          </div>

          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={() => onFavorite(dataset.id)}>Favorite</Button>
            <Button onClick={() => onPull(dataset)}>Pull to Workspace</Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
