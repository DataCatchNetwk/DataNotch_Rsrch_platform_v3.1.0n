"use client"

import { useRouter } from "next/navigation"
import { format } from "date-fns"
import {
  Database,
  Download,
  Eye,
  PlayCircle,
  Star,
  Trash2,
} from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardFooter, CardHeader } from "@/components/ui/card"
import type { DatasetItem } from "@/types/dataset"

function formatBytes(bytes: number) {
  if (!bytes) return "0 B"
  const units = ["B", "KB", "MB", "GB"]
  let value = bytes
  let idx = 0
  while (value >= 1024 && idx < units.length - 1) { value /= 1024; idx++ }
  return `${value.toFixed(value >= 10 ? 0 : 1)} ${units[idx]}`
}

function statusColor(status: DatasetItem["status"]) {
  if (status === "READY") return "bg-green-500/10 text-green-700 border-green-300"
  if (status === "FAILED") return "bg-red-500/10 text-red-700 border-red-300"
  if (status === "PROCESSING" || status === "UPLOADING") return "bg-yellow-500/10 text-yellow-700 border-yellow-300"
  return "bg-muted text-muted-foreground"
}

interface Props {
  items: DatasetItem[]
  onAnalyze: (item: DatasetItem) => void
  onDownload: (item: DatasetItem) => void
  onDelete: (item: DatasetItem) => void
}

export function DatasetCardView({ items, onAnalyze, onDownload, onDelete }: Props) {
  const router = useRouter()

  return (
    <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4">
      {items.map((item) => (
        <Card key={item.id} className="flex flex-col rounded-2xl shadow-sm hover:shadow-md transition-shadow">
          <CardHeader className="pb-2">
            <div className="flex items-start justify-between gap-2">
              <div className="flex items-center gap-2 min-w-0">
                <div className="rounded-lg bg-primary/10 p-2 shrink-0">
                  <Database className="h-4 w-4 text-primary" />
                </div>
                <div className="min-w-0">
                  <p className="font-semibold truncate leading-snug">{item.name}</p>
                  <p className="text-xs text-muted-foreground truncate">{item.fileKind}</p>
                </div>
              </div>
              {item.isFavorite ? <Star className="h-4 w-4 fill-yellow-400 text-yellow-400 shrink-0" /> : null}
            </div>
          </CardHeader>

          <CardContent className="flex-1 space-y-3">
            <p className="text-sm text-muted-foreground line-clamp-2">
              {item.description || "No description provided."}
            </p>

            <div className="flex flex-wrap gap-1.5">
              <Badge variant="outline" className={statusColor(item.status)}>{item.status}</Badge>
              <Badge variant="secondary">{item.visibility}</Badge>
              {item.domain ? <Badge variant="outline">{item.domain}</Badge> : null}
            </div>

            {item.tags && item.tags.length > 0 ? (
              <div className="flex flex-wrap gap-1">
                {item.tags.slice(0, 4).map((tag) => (
                  <span key={tag} className="rounded-full border px-2 py-0.5 text-xs text-muted-foreground">{tag}</span>
                ))}
                {item.tags.length > 4 ? <span className="text-xs text-muted-foreground">+{item.tags.length - 4}</span> : null}
              </div>
            ) : null}

            <div className="grid grid-cols-3 gap-1 text-center text-xs">
              <div className="rounded-lg border py-1">
                <p className="font-medium">{item.rowsCount?.toLocaleString() ?? "—"}</p>
                <p className="text-muted-foreground">rows</p>
              </div>
              <div className="rounded-lg border py-1">
                <p className="font-medium">{item.columnsCount ?? "—"}</p>
                <p className="text-muted-foreground">cols</p>
              </div>
              <div className="rounded-lg border py-1">
                <p className="font-medium">{formatBytes(item.sizeBytes)}</p>
                <p className="text-muted-foreground">size</p>
              </div>
            </div>

            {item.sourceName ? (
              <p className="text-xs text-muted-foreground">Source: <span className="font-medium text-foreground">{item.sourceName}</span></p>
            ) : null}

            <p className="text-xs text-muted-foreground">
              {format(new Date(item.createdAt), "MMM d, yyyy")}
            </p>
          </CardContent>

          <CardFooter className="flex gap-2 flex-wrap pt-3">
            <Button size="sm" className="flex-1 gap-1" onClick={() => router.push(`/dashboard/datasets/${item.id}`)}>
              <Eye className="h-3.5 w-3.5" />
              View
            </Button>
            <Button size="sm" variant="outline" className="gap-1" onClick={() => onAnalyze(item)}>
              <PlayCircle className="h-3.5 w-3.5" />
            </Button>
            <Button size="sm" variant="outline" className="gap-1" onClick={() => onDownload(item)}>
              <Download className="h-3.5 w-3.5" />
            </Button>
            <Button size="sm" variant="outline" className="gap-1 text-destructive hover:text-destructive" onClick={() => onDelete(item)}>
              <Trash2 className="h-3.5 w-3.5" />
            </Button>
          </CardFooter>
        </Card>
      ))}
    </div>
  )
}
