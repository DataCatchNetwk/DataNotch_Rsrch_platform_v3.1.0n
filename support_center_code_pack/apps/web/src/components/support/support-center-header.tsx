"use client"

import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Search, RefreshCcw } from "lucide-react"

export function SupportCenterHeader({
  search,
  setSearch,
  onRefresh,
}: {
  search: string
  setSearch: (v: string) => void
  onRefresh: () => void
}) {
  return (
    <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Support Center</h1>
        <p className="text-sm text-muted-foreground">
          Review tickets, triage issues, respond faster, and monitor SLA health.
        </p>
      </div>

      <div className="flex gap-2">
        <div className="relative min-w-[260px]">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9"
            placeholder="Search ticket, subject, requester..."
          />
        </div>
        <Button variant="outline" onClick={onRefresh}>
          <RefreshCcw className="mr-2 h-4 w-4" />
          Refresh
        </Button>
      </div>
    </div>
  )
}
