import { Badge } from "@/components/ui/badge"
import type { AnalysisJobStatus } from "@/types/analysis"

const statusToVariant: Record<AnalysisJobStatus, "default" | "secondary" | "destructive" | "outline"> = {
  QUEUED: "secondary",
  RUNNING: "default",
  SUCCEEDED: "outline",
  FAILED: "destructive",
  CANCELLED: "secondary",
}

export function JobStatusBadge({ status }: { status: AnalysisJobStatus }) {
  return <Badge variant={statusToVariant[status]}>{status}</Badge>
}
