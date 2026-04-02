import { Eye, Heart } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import type { DatasetListItem } from './types'

export function DatasetTable({
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
    <div className="overflow-hidden rounded-3xl border bg-background shadow-sm">
      <div className="overflow-x-auto">
        <table className="min-w-full text-sm">
          <thead className="bg-muted/40 text-left">
            <tr>
              <th className="px-4 py-3 font-medium">Dataset</th>
              <th className="px-4 py-3 font-medium">Section</th>
              <th className="px-4 py-3 font-medium">Visibility</th>
              <th className="px-4 py-3 font-medium">Records</th>
              <th className="px-4 py-3 font-medium">Version</th>
              <th className="px-4 py-3 font-medium">Updated</th>
              <th className="px-4 py-3 font-medium">Actions</th>
            </tr>
          </thead>
          <tbody>
            {items.map((item) => (
              <tr key={item.id} className="border-t">
                <td className="px-4 py-4">
                  <div className="font-medium">{item.name}</div>
                  <div className="line-clamp-1 text-xs text-muted-foreground">{item.description}</div>
                </td>
                <td className="px-4 py-4"><Badge variant="secondary">{item.section}</Badge></td>
                <td className="px-4 py-4"><Badge variant="outline">{item.visibility}</Badge></td>
                <td className="px-4 py-4">{item.recordCount.toLocaleString()}</td>
                <td className="px-4 py-4">{item.lineageVersion}</td>
                <td className="px-4 py-4">{new Date(item.updatedAt).toLocaleDateString()}</td>
                <td className="px-4 py-4">
                  <div className="flex items-center gap-2">
                    <Button size="sm" variant="outline" onClick={() => onPreview(item)}>
                      <Eye className="mr-2 h-4 w-4" /> Preview
                    </Button>
                    <Button size="sm" onClick={() => onPull(item)}>
                      Pull
                    </Button>
                    <Button size="icon" variant="ghost" onClick={() => onFavorite(item.id)}>
                      <Heart className={`h-4 w-4 ${item.isFavorite ? 'fill-current' : ''}`} />
                    </Button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}
