"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import type { DatasetQualitySummary } from "@/types/dataset-details"

function QualityBar({ score }: { score: number }) {
  const pct = Math.min(100, Math.max(0, score))
  const color = pct >= 80 ? "bg-green-500" : pct >= 50 ? "bg-yellow-500" : "bg-red-500"
  return (
    <div className="h-2 w-full rounded-full bg-muted overflow-hidden">
      <div className={`h-full rounded-full transition-all ${color}`} style={{ width: `${pct}%` }} />
    </div>
  )
}

function statusBadge(status: DatasetQualitySummary["qualityStatus"]) {
  if (status === "GOOD") return <Badge className="bg-green-500/10 text-green-700 border-green-300">GOOD</Badge>
  if (status === "WARNING") return <Badge className="bg-yellow-500/10 text-yellow-700 border-yellow-300">WARNING</Badge>
  return <Badge className="bg-red-500/10 text-red-700 border-red-300">CRITICAL</Badge>
}

export function DatasetQualityCard({ quality }: { quality: DatasetQualitySummary }) {
  return (
    <Card className="rounded-2xl shadow-sm">
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle>Data Quality</CardTitle>
        {statusBadge(quality.qualityStatus)}
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Completeness score bar */}
        <div className="space-y-1.5">
          <div className="flex items-center justify-between text-sm">
            <span className="text-muted-foreground">Completeness score</span>
            <span className="font-semibold">{quality.completenessScore.toFixed(1)}%</span>
          </div>
          <QualityBar score={quality.completenessScore} />
        </div>

        {/* Stats grid */}
        <div className="grid grid-cols-3 gap-3 text-center">
          <div className="rounded-xl border p-3">
            <p className="text-xl font-bold text-yellow-600">{quality.missingValues.toLocaleString()}</p>
            <p className="text-xs text-muted-foreground mt-0.5">Missing values</p>
          </div>
          <div className="rounded-xl border p-3">
            <p className="text-xl font-bold text-orange-600">{quality.duplicateRows.toLocaleString()}</p>
            <p className="text-xs text-muted-foreground mt-0.5">Duplicate rows</p>
          </div>
          <div className="rounded-xl border p-3">
            <p className="text-xl font-bold text-red-600">{quality.invalidRows.toLocaleString()}</p>
            <p className="text-xs text-muted-foreground mt-0.5">Invalid rows</p>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
