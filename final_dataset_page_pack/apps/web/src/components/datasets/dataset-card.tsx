"use client"

import type { Dataset } from "@/lib/types/dataset"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Database, Eye, FolderInput, Star } from "lucide-react"
import { formatBytes, formatDate, formatNumber } from "./dataset-utils"

export function DatasetCard({
  dataset,
  onPreview,
  onPull,
  onToggleFavorite,
}: {
  dataset: Dataset
  onPreview: (dataset: Dataset) => void
  onPull: (dataset: Dataset) => void
  onToggleFavorite: (dataset: Dataset) => void
}) {
  return (
    <Card className="rounded-2xl shadow-sm transition hover:shadow-md">
      <CardHeader className="space-y-3">
        <div className="flex items-start justify-between gap-3">
          <div className="flex min-w-0 items-center gap-3">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border bg-muted/40">
              <Database className="h-5 w-5" />
            </div>
            <div className="min-w-0">
              <CardTitle className="truncate text-base">{dataset.name}</CardTitle>
              <p className="truncate text-sm text-muted-foreground">{dataset.source}</p>
            </div>
          </div>

          <Button
            type="button"
            variant="ghost"
            size="icon"
            className="rounded-xl"
            onClick={() => onToggleFavorite(dataset)}
          >
            <Star className={`h-4 w-4 ${dataset.isFavorite ? "fill-current" : ""}`} />
          </Button>
        </div>

        <div className="flex flex-wrap gap-2">
          <Badge variant="secondary">{dataset.domain}</Badge>
          <Badge variant="outline">{dataset.fileType}</Badge>
          <Badge variant="outline">{dataset.accessLevel}</Badge>
        </div>
      </CardHeader>

      <CardContent className="space-y-4">
        <p className="line-clamp-3 text-sm text-muted-foreground">{dataset.description}</p>

        <div className="grid grid-cols-2 gap-3 text-sm">
          <div className="rounded-xl border p-3">
            <div className="text-muted-foreground">Rows</div>
            <div className="mt-1 font-medium">{formatNumber(dataset.rowCount)}</div>
          </div>
          <div className="rounded-xl border p-3">
            <div className="text-muted-foreground">Size</div>
            <div className="mt-1 font-medium">{formatBytes(dataset.sizeBytes)}</div>
          </div>
          <div className="rounded-xl border p-3">
            <div className="text-muted-foreground">Updated</div>
            <div className="mt-1 font-medium">{formatDate(dataset.updatedAt)}</div>
          </div>
          <div className="rounded-xl border p-3">
            <div className="text-muted-foreground">Owner</div>
            <div className="mt-1 truncate font-medium">{dataset.ownerName || "Catalog"}</div>
          </div>
        </div>

        {dataset.tags?.length ? (
          <div className="flex flex-wrap gap-2">
            {dataset.tags.slice(0, 4).map((tag) => (
              <span key={tag} className="rounded-full border px-2 py-1 text-xs text-muted-foreground">
                {tag}
              </span>
            ))}
          </div>
        ) : null}
      </CardContent>

      <CardFooter className="flex gap-2">
        <Button type="button" variant="outline" className="flex-1 rounded-xl" onClick={() => onPreview(dataset)}>
          <Eye className="mr-2 h-4 w-4" />
          Preview
        </Button>
        <Button type="button" className="flex-1 rounded-xl" onClick={() => onPull(dataset)}>
          <FolderInput className="mr-2 h-4 w-4" />
          Pull
        </Button>
      </CardFooter>
    </Card>
  )
}
