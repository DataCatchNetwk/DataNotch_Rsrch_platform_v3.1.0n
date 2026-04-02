"use client"

import type { Dataset } from "@/lib/types/dataset"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Eye, FolderInput, Star } from "lucide-react"
import { formatBytes, formatDate, formatNumber } from "./dataset-utils"

export function DatasetTable({
  datasets,
  onPreview,
  onPull,
  onToggleFavorite,
}: {
  datasets: Dataset[]
  onPreview: (dataset: Dataset) => void
  onPull: (dataset: Dataset) => void
  onToggleFavorite: (dataset: Dataset) => void
}) {
  return (
    <div className="overflow-hidden rounded-2xl border">
      <table className="w-full text-sm">
        <thead className="bg-muted/40">
          <tr className="text-left">
            <th className="px-4 py-3">Dataset</th>
            <th className="px-4 py-3">Domain</th>
            <th className="px-4 py-3">Access</th>
            <th className="px-4 py-3">Rows</th>
            <th className="px-4 py-3">Size</th>
            <th className="px-4 py-3">Updated</th>
            <th className="px-4 py-3">Actions</th>
          </tr>
        </thead>
        <tbody>
          {datasets.map((dataset) => (
            <tr key={dataset.id} className="border-t align-top">
              <td className="px-4 py-4">
                <div className="font-medium">{dataset.name}</div>
                <div className="text-muted-foreground">{dataset.source}</div>
              </td>
              <td className="px-4 py-4">
                <Badge variant="secondary">{dataset.domain}</Badge>
              </td>
              <td className="px-4 py-4">
                <Badge variant="outline">{dataset.accessLevel}</Badge>
              </td>
              <td className="px-4 py-4">{formatNumber(dataset.rowCount)}</td>
              <td className="px-4 py-4">{formatBytes(dataset.sizeBytes)}</td>
              <td className="px-4 py-4">{formatDate(dataset.updatedAt)}</td>
              <td className="px-4 py-4">
                <div className="flex gap-2">
                  <Button size="sm" variant="outline" className="rounded-xl" onClick={() => onPreview(dataset)}>
                    <Eye className="mr-2 h-4 w-4" />
                    Preview
                  </Button>
                  <Button size="sm" className="rounded-xl" onClick={() => onPull(dataset)}>
                    <FolderInput className="mr-2 h-4 w-4" />
                    Pull
                  </Button>
                  <Button size="icon" variant="ghost" className="rounded-xl" onClick={() => onToggleFavorite(dataset)}>
                    <Star className={`h-4 w-4 ${dataset.isFavorite ? "fill-current" : ""}`} />
                  </Button>
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}
