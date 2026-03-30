"use client"

import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import type { DatasetFilters } from "@/types/dataset"
import { Search, RotateCcw } from "lucide-react"

interface Props {
  filters: DatasetFilters
  onChange: (next: DatasetFilters) => void
  onReset: () => void
}

export function DatasetFiltersBar({ filters, onChange, onReset }: Props) {
  return (
    <div className="rounded-2xl border bg-card p-4 shadow-sm">
      <div className="flex flex-wrap items-end gap-3">
        {/* Search — grows to fill available space */}
        <div className="relative min-w-[200px] flex-[3]">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            value={filters.search ?? ""}
            onChange={(e) =>
              onChange({ ...filters, page: 1, search: e.target.value })
            }
            placeholder="Search datasets by name, description, owner..."
            className="pl-9"
          />
        </div>

        {/* Visibility */}
        <div className="min-w-[140px] flex-1">
          <Select
            value={filters.visibility ?? "ALL"}
            onValueChange={(value) =>
              onChange({ ...filters, page: 1, visibility: value as DatasetFilters["visibility"] })
            }
          >
            <SelectTrigger>
              <SelectValue placeholder="Visibility" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="ALL">All visibility</SelectItem>
              <SelectItem value="PRIVATE">Private</SelectItem>
              <SelectItem value="TEAM">Team</SelectItem>
              <SelectItem value="PUBLIC">Public</SelectItem>
              <SelectItem value="RESTRICTED">Restricted</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Status */}
        <div className="min-w-[130px] flex-1">
          <Select
            value={filters.status ?? "ALL"}
            onValueChange={(value) =>
              onChange({ ...filters, page: 1, status: value as DatasetFilters["status"] })
            }
          >
            <SelectTrigger>
              <SelectValue placeholder="Status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="ALL">All status</SelectItem>
              <SelectItem value="QUEUED">Queued</SelectItem>
              <SelectItem value="UPLOADING">Uploading</SelectItem>
              <SelectItem value="PROCESSING">Processing</SelectItem>
              <SelectItem value="READY">Ready</SelectItem>
              <SelectItem value="FAILED">Failed</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* File type */}
        <div className="min-w-[140px] flex-1">
          <Select
            value={filters.fileKind ?? "ALL"}
            onValueChange={(value) =>
              onChange({ ...filters, page: 1, fileKind: value as DatasetFilters["fileKind"] })
            }
          >
            <SelectTrigger>
              <SelectValue placeholder="File type" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="ALL">All file types</SelectItem>
              <SelectItem value="CSV">CSV</SelectItem>
              <SelectItem value="XLSX">XLSX</SelectItem>
              <SelectItem value="JSON">JSON</SelectItem>
              <SelectItem value="TSV">TSV</SelectItem>
              <SelectItem value="ZIP">ZIP</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Date from */}
        <div className="flex min-w-[168px] flex-none flex-col gap-1">
          <label className="px-0.5 text-xs font-medium text-muted-foreground">
            From
          </label>
          <Input
            type="date"
            value={filters.dateFrom ?? ""}
            onChange={(e) =>
              onChange({ ...filters, page: 1, dateFrom: e.target.value })
            }
            className="w-full"
          />
        </div>

        {/* Date to */}
        <div className="flex min-w-[168px] flex-none flex-col gap-1">
          <label className="px-0.5 text-xs font-medium text-muted-foreground">
            To
          </label>
          <Input
            type="date"
            value={filters.dateTo ?? ""}
            onChange={(e) =>
              onChange({ ...filters, page: 1, dateTo: e.target.value })
            }
            className="w-full"
          />
        </div>
      </div>

      <div className="mt-3 flex items-center justify-end">
        <Button variant="outline" onClick={onReset} className="gap-2">
          <RotateCcw className="h-4 w-4" />
          Reset filters
        </Button>
      </div>
    </div>
  )
}
