"use client"

import { ColumnDef } from "@tanstack/react-table"
import { MoreHorizontal, Eye, Trash2, PlayCircle, Download } from "lucide-react"
import { format } from "date-fns"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import type { DatasetItem } from "@/types/dataset"

function formatBytes(bytes: number) {
  if (!bytes) return "0 B"
  const units = ["B", "KB", "MB", "GB", "TB"]
  let value = bytes
  let unitIndex = 0

  while (value >= 1024 && unitIndex < units.length - 1) {
    value /= 1024
    unitIndex++
  }

  return `${value.toFixed(value >= 10 ? 0 : 1)} ${units[unitIndex]}`
}

function statusVariant(status: DatasetItem["status"]): "default" | "secondary" | "destructive" | "outline" {
  switch (status) {
    case "READY":
      return "default"
    case "PROCESSING":
    case "UPLOADING":
    case "QUEUED":
      return "secondary"
    case "FAILED":
      return "destructive"
    default:
      return "outline"
  }
}

export function getDatasetColumns(actions: {
  onView: (row: DatasetItem) => void
  onAnalyze: (row: DatasetItem) => void
  onDownload: (row: DatasetItem) => void
  onDelete: (row: DatasetItem) => void
}): ColumnDef<DatasetItem>[] {
  return [
    {
      accessorKey: "name",
      header: "Dataset",
      cell: ({ row }) => {
        const item = row.original
        return (
          <div className="min-w-[240px]">
            <div className="font-medium">{item.name}</div>
            <div className="line-clamp-1 text-xs text-muted-foreground">{item.description || "No description provided"}</div>
          </div>
        )
      },
    },
    {
      accessorKey: "fileKind",
      header: "Type",
    },
    {
      accessorKey: "visibility",
      header: "Visibility",
      cell: ({ row }) => <Badge variant="outline">{row.original.visibility}</Badge>,
    },
    {
      accessorKey: "status",
      header: "Status",
      cell: ({ row }) => <Badge variant={statusVariant(row.original.status)}>{row.original.status}</Badge>,
    },
    {
      accessorKey: "sizeBytes",
      header: "Size",
      cell: ({ row }) => formatBytes(row.original.sizeBytes),
    },
    {
      id: "shape",
      header: "Shape",
      cell: ({ row }) => {
        const item = row.original
        return (
          <span className="text-sm text-muted-foreground">
            {item.rowsCount ?? "-"} rows / {item.columnsCount ?? "-"} cols
          </span>
        )
      },
    },
    {
      accessorKey: "createdAt",
      header: "Created",
      cell: ({ row }) => format(new Date(row.original.createdAt), "MMM d, yyyy"),
    },
    {
      id: "actions",
      header: "",
      cell: ({ row }) => {
        const item = row.original
        return (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon">
                <MoreHorizontal className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>

            <DropdownMenuContent align="end" className="w-48">
              <DropdownMenuItem onClick={() => actions.onView(item)}>
                <Eye className="mr-2 h-4 w-4" />
                View details
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => actions.onAnalyze(item)}>
                <PlayCircle className="mr-2 h-4 w-4" />
                Start analysis
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => actions.onDownload(item)}>
                <Download className="mr-2 h-4 w-4" />
                Download
              </DropdownMenuItem>
              <DropdownMenuItem
                onClick={() => actions.onDelete(item)}
                className="text-destructive focus:text-destructive"
              >
                <Trash2 className="mr-2 h-4 w-4" />
                Delete dataset
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        )
      },
    },
  ]
}
