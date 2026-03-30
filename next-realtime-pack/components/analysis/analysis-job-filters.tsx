"use client"

import { Search, RotateCcw } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import type { AnalysisJobFilters } from "@/types/analysis"

export function AnalysisJobFiltersBar({
  filters,
  onChange,
  onReset,
}: {
  filters: AnalysisJobFilters
  onChange: (filters: AnalysisJobFilters) => void
  onReset: () => void
}) {
  return (
    <div className="rounded-2xl border bg-card p-4 shadow-sm">
      <div className="grid gap-3 lg:grid-cols-12">
        <div className="relative lg:col-span-7">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            value={filters.search ?? ""}
            onChange={(e) =>
              onChange({
                ...filters,
                page: 1,
                search: e.target.value,
              })
            }
            placeholder="Search by job title, template, dataset, or owner"
            className="pl-9"
          />
        </div>

        <div className="lg:col-span-3">
          <Select
            value={filters.status ?? "ALL"}
            onValueChange={(value) =>
              onChange({
                ...filters,
                page: 1,
                status: value as AnalysisJobFilters["status"],
              })
            }
          >
            <SelectTrigger>
              <SelectValue placeholder="Status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="ALL">All statuses</SelectItem>
              <SelectItem value="QUEUED">Queued</SelectItem>
              <SelectItem value="RUNNING">Running</SelectItem>
              <SelectItem value="SUCCEEDED">Succeeded</SelectItem>
              <SelectItem value="FAILED">Failed</SelectItem>
              <SelectItem value="CANCELLED">Cancelled</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="lg:col-span-2 flex justify-end">
          <Button variant="outline" onClick={onReset} className="gap-2 w-full lg:w-auto">
            <RotateCcw className="h-4 w-4" />
            Reset
          </Button>
        </div>
      </div>
    </div>
  )
}
