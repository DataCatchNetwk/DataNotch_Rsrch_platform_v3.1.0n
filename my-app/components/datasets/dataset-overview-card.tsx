"use client"

import { format } from "date-fns"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import type { DatasetDetails } from "@/types/dataset-details"

function formatBytes(bytes: number) {
  if (!bytes) return "0 B"
  const units = ["B", "KB", "MB", "GB", "TB"]
  let value = bytes
  let idx = 0
  while (value >= 1024 && idx < units.length - 1) {
    value /= 1024
    idx++
  }
  return `${value.toFixed(value >= 10 ? 0 : 1)} ${units[idx]}`
}

export function DatasetOverviewCard({ dataset }: { dataset: DatasetDetails }) {
  return (
    <Card className="rounded-2xl shadow-sm">
      <CardHeader>
        <CardTitle>Dataset Overview</CardTitle>
      </CardHeader>
      <CardContent className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <div>
          <p className="text-sm text-muted-foreground">Name</p>
          <p className="font-medium">{dataset.name}</p>
        </div>

        <div>
          <p className="text-sm text-muted-foreground">Status</p>
          <Badge>{dataset.status}</Badge>
        </div>

        <div>
          <p className="text-sm text-muted-foreground">Visibility</p>
          <Badge variant="outline">{dataset.visibility}</Badge>
        </div>

        <div>
          <p className="text-sm text-muted-foreground">File Type</p>
          <p className="font-medium">{dataset.fileKind}</p>
        </div>

        <div>
          <p className="text-sm text-muted-foreground">Rows</p>
          <p className="font-medium">{dataset.rowsCount ?? "-"}</p>
        </div>

        <div>
          <p className="text-sm text-muted-foreground">Columns</p>
          <p className="font-medium">{dataset.columnsCount ?? "-"}</p>
        </div>

        <div>
          <p className="text-sm text-muted-foreground">Size</p>
          <p className="font-medium">{formatBytes(dataset.sizeBytes)}</p>
        </div>

        <div>
          <p className="text-sm text-muted-foreground">Created</p>
          <p className="font-medium">{format(new Date(dataset.createdAt), "PPP p")}</p>
        </div>

        <div className="md:col-span-2 xl:col-span-4">
          <p className="text-sm text-muted-foreground">Description</p>
          <p className="text-sm">{dataset.description || "No description provided."}</p>
        </div>
      </CardContent>
    </Card>
  )
}
