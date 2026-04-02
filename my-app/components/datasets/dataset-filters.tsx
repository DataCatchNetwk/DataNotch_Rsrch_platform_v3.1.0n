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
import { Grid2X2, LayoutList, RotateCcw, Search } from "lucide-react"

const DOMAINS = [
  "HEALTH", "SOCIAL", "CLIMATE", "ECONOMIC", "DEMOGRAPHIC",
  "EDUCATION", "ENVIRONMENT", "MOBILITY", "GENOMICS", "IMAGING",
  "WEARABLE", "SURVEY", "OTHER",
]

const SOURCES = ["CDC", "WHO", "NIH", "UPLOAD", "API", "MANUAL", "OTHER"]

interface Props {
  filters: DatasetFilters
  onChange: (next: DatasetFilters) => void
  onReset: () => void
  viewMode?: "table" | "grid"
  onViewModeChange?: (mode: "table" | "grid") => void
}

export function DatasetFiltersBar({ filters, onChange, onReset, viewMode = "table", onViewModeChange }: Props) {
  return (
    <div className="rounded-2xl border bg-card p-4 shadow-sm">
      {/* Row 1 */}
      <div className="flex flex-wrap items-end gap-3">
        {/* Search */}
        <div className="relative min-w-[200px] flex-[3]">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            value={filters.search ?? ""}
            onChange={(e) => onChange({ ...filters, page: 1, search: e.target.value })}
            placeholder="Search datasets by name, description, owner..."
            className="pl-9"
          />
        </div>

        {/* Visibility */}
        <div className="min-w-[140px] flex-1">
          <Select
            value={filters.visibility ?? "ALL"}
            onValueChange={(value) => onChange({ ...filters, page: 1, visibility: value as DatasetFilters["visibility"] })}
          >
            <SelectTrigger><SelectValue placeholder="Visibility" /></SelectTrigger>
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
            onValueChange={(value) => onChange({ ...filters, page: 1, status: value as DatasetFilters["status"] })}
          >
            <SelectTrigger><SelectValue placeholder="Status" /></SelectTrigger>
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
            onValueChange={(value) => onChange({ ...filters, page: 1, fileKind: value as DatasetFilters["fileKind"] })}
          >
            <SelectTrigger><SelectValue placeholder="File type" /></SelectTrigger>
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
      </div>

      {/* Row 2 — domain, source, tags, dates */}
      <div className="mt-3 flex flex-wrap items-end gap-3">
        {/* Domain */}
        <div className="min-w-[150px] flex-1">
          <Select
            value={filters.domain ?? "ALL"}
            onValueChange={(value) => onChange({ ...filters, page: 1, domain: value === "ALL" ? undefined : value })}
          >
            <SelectTrigger><SelectValue placeholder="Domain" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="ALL">All domains</SelectItem>
              {DOMAINS.map((d) => <SelectItem key={d} value={d}>{d.charAt(0) + d.slice(1).toLowerCase()}</SelectItem>)}
            </SelectContent>
          </Select>
        </div>

        {/* Source */}
        <div className="min-w-[140px] flex-1">
          <Select
            value={filters.source ?? "ALL"}
            onValueChange={(value) => onChange({ ...filters, page: 1, source: value === "ALL" ? undefined : value })}
          >
            <SelectTrigger><SelectValue placeholder="Source" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="ALL">All sources</SelectItem>
              {SOURCES.map((s) => <SelectItem key={s} value={s}>{s.charAt(0) + s.slice(1).toLowerCase()}</SelectItem>)}
            </SelectContent>
          </Select>
        </div>

        {/* Tags */}
        <div className="min-w-[160px] flex-[2]">
          <Input
            value={filters.tags ?? ""}
            onChange={(e) => onChange({ ...filters, page: 1, tags: e.target.value || undefined })}
            placeholder="Filter by tags (comma-separated)"
          />
        </div>

        {/* Sort */}
        <div className="min-w-[160px] flex-1">
          <Select
            value={filters.sortBy ?? "createdAt"}
            onValueChange={(value) => onChange({ ...filters, page: 1, sortBy: value as DatasetFilters["sortBy"] })}
          >
            <SelectTrigger><SelectValue placeholder="Sort by" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="createdAt">Newest first</SelectItem>
              <SelectItem value="name">Name A→Z</SelectItem>
              <SelectItem value="sizeBytes">Largest first</SelectItem>
              <SelectItem value="updatedAt">Recently updated</SelectItem>
              <SelectItem value="popularity">Most popular</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Date from */}
        <div className="flex min-w-[155px] flex-none flex-col gap-1">
          <label className="px-0.5 text-xs font-medium text-muted-foreground">From</label>
          <Input type="date" value={filters.dateFrom ?? ""} onChange={(e) => onChange({ ...filters, page: 1, dateFrom: e.target.value })} className="w-full" />
        </div>

        {/* Date to */}
        <div className="flex min-w-[155px] flex-none flex-col gap-1">
          <label className="px-0.5 text-xs font-medium text-muted-foreground">To</label>
          <Input type="date" value={filters.dateTo ?? ""} onChange={(e) => onChange({ ...filters, page: 1, dateTo: e.target.value })} className="w-full" />
        </div>
      </div>

      <div className="mt-3 flex items-center justify-between">
        {/* View mode toggle */}
        {onViewModeChange ? (
          <div className="flex rounded-lg border overflow-hidden">
            <button
              type="button"
              onClick={() => onViewModeChange("table")}
              className={`flex items-center gap-1.5 px-3 py-1.5 text-sm transition ${viewMode === "table" ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:bg-muted/40"}`}
            >
              <LayoutList className="h-4 w-4" />
              Table
            </button>
            <button
              type="button"
              onClick={() => onViewModeChange("grid")}
              className={`flex items-center gap-1.5 px-3 py-1.5 text-sm transition ${viewMode === "grid" ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:bg-muted/40"}`}
            >
              <Grid2X2 className="h-4 w-4" />
              Grid
            </button>
          </div>
        ) : <span />}

        <Button variant="outline" onClick={onReset} className="gap-2">
          <RotateCcw className="h-4 w-4" />
          Reset filters
        </Button>
      </div>
    </div>
  )
}
