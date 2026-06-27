"use client"

import { Database, Loader2, CheckCircle2, HardDrive } from "lucide-react"
import { Card, CardContent } from "@/components/ui/card"
import { Skeleton } from "@/components/ui/skeleton"
import { useDatasetStats } from "@/hooks/use-datasets"

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

function StatCard({
  title,
  value,
  icon,
  helper,
}: {
  title: string
  value: string | number
  icon: React.ReactNode
  helper?: string
}) {
  return (
    <Card className="border-border/60 shadow-sm">
      <CardContent className="flex items-start justify-between p-5">
        <div className="space-y-1">
          <p className="text-sm text-muted-foreground">{title}</p>
          <p className="text-2xl font-semibold tracking-tight">{value}</p>
          {helper ? <p className="text-xs text-muted-foreground">{helper}</p> : null}
        </div>
        <div className="rounded-2xl border bg-muted/40 p-3 text-muted-foreground">{icon}</div>
      </CardContent>
    </Card>
  )
}

export function DatasetStatsCards() {
  const { data, isLoading } = useDatasetStats()

  if (isLoading) {
    return (
      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-5">
        {Array.from({ length: 5 }).map((_, i) => (
          <Skeleton key={i} className="h-32 rounded-2xl" />
        ))}
      </div>
    )
  }

  return (
    <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-5">
      <StatCard title="Total Datasets" value={data?.total ?? 0} icon={<Database className="h-5 w-5" />} />
      <StatCard title="Queued" value={data?.queued ?? 0} icon={<Loader2 className="h-5 w-5" />} />
      <StatCard title="Processing" value={data?.processing ?? 0} icon={<Loader2 className="h-5 w-5" />} />
      <StatCard title="Ready" value={data?.ready ?? 0} icon={<CheckCircle2 className="h-5 w-5" />} />
      <StatCard
        title="Storage Used"
        value={formatBytes(data?.totalStorageBytes ?? 0)}
        icon={<HardDrive className="h-5 w-5" />}
        helper={`${data?.failed ?? 0} failed`}
      />
    </div>
  )
}
