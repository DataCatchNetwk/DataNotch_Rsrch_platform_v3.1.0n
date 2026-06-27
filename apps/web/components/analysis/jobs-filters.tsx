"use client"

import { Input } from "@/components/ui/input"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import type { AnalysisJobStatus } from "@/types/analysis"

const statuses: Array<AnalysisJobStatus | "ALL"> = [
  "ALL",
  "QUEUED",
  "RUNNING",
  "SUCCEEDED",
  "FAILED",
  "CANCELLED",
]

export function JobsFilters({
  search,
  status,
  onSearch,
  onStatus,
}: {
  search: string
  status: AnalysisJobStatus | "ALL"
  onSearch: (value: string) => void
  onStatus: (value: AnalysisJobStatus | "ALL") => void
}) {
  return (
    <div className="grid gap-3 sm:grid-cols-2">
      <Input
        placeholder="Search jobs"
        value={search}
        onChange={(event) => onSearch(event.target.value)}
      />
      <Select value={status} onValueChange={(value) => onStatus(value as AnalysisJobStatus | "ALL")}>
        <SelectTrigger>
          <SelectValue placeholder="Status" />
        </SelectTrigger>
        <SelectContent>
          {statuses.map((item) => (
            <SelectItem key={item} value={item}>
              {item}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  )
}
