import { Eye, Heart, Download, GitBranch, Lock, Database } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardFooter, CardHeader } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import type { DatasetListItem } from './types'

export function DatasetGrid({
  items,
  onPreview,
  onPull,
  onFavorite,
}: {
  items: DatasetListItem[]
  onPreview: (dataset: DatasetListItem) => void
  onPull: (dataset: DatasetListItem) => void
  onFavorite: (datasetId: string) => void
}) {
  return (
    <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4">
      {items.map((item) => (
        <Card key={item.id} className="rounded-3xl">
          <CardHeader className="space-y-3">
            <div className="flex items-start justify-between gap-3">
              <div>
                <h3 className="line-clamp-1 text-lg font-semibold">{item.name}</h3>
                <p className="mt-1 text-xs text-muted-foreground">Owned by {item.ownerName}</p>
              </div>
              <Button size="icon" variant="ghost" onClick={() => onFavorite(item.id)}>
                <Heart className={`h-4 w-4 ${item.isFavorite ? 'fill-current' : ''}`} />
              </Button>
            </div>
            <p className="line-clamp-3 text-sm text-muted-foreground">{item.description}</p>
            <div className="flex flex-wrap gap-2">
              <Badge variant="secondary">{item.section}</Badge>
              <Badge variant="outline">{item.visibility}</Badge>
              <Badge variant="outline">{item.status}</Badge>
            </div>
          </CardHeader>

          <CardContent className="space-y-3 text-sm">
            <div className="grid grid-cols-2 gap-3">
              <div className="rounded-2xl border p-3">
                <div className="flex items-center gap-2 text-muted-foreground"><Database className="h-4 w-4" /> Records</div>
                <div className="mt-1 font-medium">{item.recordCount.toLocaleString()}</div>
              </div>
              <div className="rounded-2xl border p-3">
                <div className="flex items-center gap-2 text-muted-foreground"><GitBranch className="h-4 w-4" /> Version</div>
                <div className="mt-1 font-medium">{item.lineageVersion}</div>
              </div>
              <div className="rounded-2xl border p-3">
                <div className="flex items-center gap-2 text-muted-foreground"><Download className="h-4 w-4" /> Size</div>
                <div className="mt-1 font-medium">{item.sizeLabel}</div>
              </div>
              <div className="rounded-2xl border p-3">
                <div className="flex items-center gap-2 text-muted-foreground"><Lock className="h-4 w-4" /> Governance</div>
                <div className="mt-1 line-clamp-1 font-medium">{item.governanceSummary}</div>
              </div>
            </div>
            <div className="flex flex-wrap gap-2">
              {item.tags.slice(0, 4).map((tag) => (
                <Badge key={tag} variant="secondary">#{tag}</Badge>
              ))}
            </div>
          </CardContent>

          <CardFooter className="flex gap-2">
            <Button className="flex-1" variant="outline" onClick={() => onPreview(item)}>
              <Eye className="mr-2 h-4 w-4" /> Preview
            </Button>
            <Button className="flex-1" onClick={() => onPull(item)}>
              Pull
            </Button>
          </CardFooter>
        </Card>
      ))}
    </div>
  )
}
