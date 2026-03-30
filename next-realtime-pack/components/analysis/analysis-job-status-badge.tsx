"use client"

import { Badge } from "@/components/ui/badge"
import type { AnalysisJobStatus } from "@/types/analysis"

export function AnalysisJobStatusBadge({ status }: { status: AnalysisJobStatus }) {
  const variant =
    status === "SUCCEEDED"
      ? "default"
      : status === "FAILED"
      ? "destructive"
      : status === "CANCELLED"
      ? "secondary"
      : "outline"

  return <Badge variant={variant}>{status}</Badge>
}
