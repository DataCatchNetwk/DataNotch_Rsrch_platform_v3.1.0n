"use client"

import * as React from "react"
import { Activity, AlertCircle, Clock3, FolderCog } from "lucide-react"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { AnalysisJobFiltersBar } from "@/components/analysis/analysis-job-filters"
import { AnalysisJobsTable } from "@/components/analysis/analysis-jobs-table"
import { useAnalysisJobs } from "@/hooks/use-analysis-jobs"
import type { AnalysisJobFilters } from "@/types/analysis"

const defaultFilters: AnalysisJobFilters = {
  search: "",
  status: "ALL",
  page: 1,
  pageSize: 10,
  sortBy: "createdAt",
  sortOrder: "desc",
}

function StatCard({ title, value, icon }: { title: string; value: number; icon: React.ReactNode }) {
  return (
    <Card className="shadow-sm">
      <CardContent className="flex items-center justify-between p-5">
        <div>
          <p className="text-sm text-muted-foreground">{title}</p>
          <p className="text-2xl font-semibold">{value}</p>
        </div>
        <div className="rounded-2xl border bg-muted/40 p-3 text-muted-foreground">{icon}</div>
      </CardContent>
    </Card>
  )
}

export function AnalysisJobsPageView() {
  const [filters, setFilters] = React.useState<AnalysisJobFilters>(defaultFilters)
  const { data, isLoading, isError, error, refetch } = useAnalysisJobs(filters)

  const items = data?.items ?? []
  const total = data?.total ?? 0
  const page = data?.page ?? filters.page ?? 1
  const pageSize = data?.pageSize ?? filters.pageSize ?? 10

  const queued = items.filter((i) => i.status === "QUEUED").length
  const running = items.filter((i) => i.status === "RUNNING").length
  const succeeded = items.filter((i) => i.status === "SUCCEEDED").length
  const failed = items.filter((i) => i.status === "FAILED").length

  return (
    <div className="space-y-6 p-6">
      <div>
        <h1 className="text-3xl font-semibold tracking-tight">Analysis Jobs</h1>
        <p className="text-sm text-muted-foreground">
          Monitor queued, running, and completed research workflows in one place.
        </p>
      </div>

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <StatCard title="Queued" value={queued} icon={<Clock3 className="h-5 w-5" />} />
        <StatCard title="Running" value={running} icon={<Activity className="h-5 w-5" />} />
        <StatCard title="Succeeded" value={succeeded} icon={<FolderCog className="h-5 w-5" />} />
        <StatCard title="Failed" value={failed} icon={<AlertCircle className="h-5 w-5" />} />
      </div>

      <AnalysisJobFiltersBar filters={filters} onChange={setFilters} onReset={() => setFilters(defaultFilters)} />

      {isError ? (
        <Card className="border-destructive/30">
          <CardContent className="flex flex-col items-center gap-3 p-12 text-center">
            <AlertCircle className="h-6 w-6 text-destructive" />
            <div>
              <p className="font-semibold">Unable to load analysis jobs</p>
              <p className="text-sm text-muted-foreground">{(error as Error)?.message}</p>
            </div>
            <Button onClick={() => refetch()}>Retry</Button>
          </CardContent>
        </Card>
      ) : (
        <AnalysisJobsTable
          items={items}
          isLoading={isLoading}
          page={page}
          pageSize={pageSize}
          total={total}
          onPageChange={(nextPage) => setFilters((prev) => ({ ...prev, page: nextPage }))}
        />
      )}
    </div>
  )
}
