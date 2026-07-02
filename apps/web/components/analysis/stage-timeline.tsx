import { CheckCircle2, Circle, Loader2, XCircle } from "lucide-react"

import { cn } from "@/lib/utils"
import type { AnalysisJobStage } from "@/types/analysis"

function iconFor(status: AnalysisJobStage["status"]) {
  if (status === "DONE") return <CheckCircle2 className="h-4 w-4 text-emerald-600" />
  if (status === "RUNNING") return <Loader2 className="h-4 w-4 animate-spin text-blue-600" />
  if (status === "FAILED") return <XCircle className="h-4 w-4 text-red-600" />
  return <Circle className="h-4 w-4 text-muted-foreground" />
}

export function StageTimeline({ stages }: { stages?: AnalysisJobStage[] | null }) {
  const safeStages = Array.isArray(stages) ? stages : []

  if (!safeStages.length) {
    return (
      <div className="rounded-lg border border-dashed bg-muted/30 p-4 text-sm text-muted-foreground">
        Stage timeline will appear when this analysis job reports pipeline stage metadata.
      </div>
    )
  }

  return (
    <ol className="space-y-3">
      {safeStages.map((stage, index) => (
        <li
          key={stage.key ?? `${stage.label}-${index}`}
          className={cn(
            "rounded-lg border p-3",
            stage.status === "RUNNING" && "border-blue-200 bg-blue-50/50",
            stage.status === "FAILED" && "border-red-200 bg-red-50/50"
          )}
        >
          <div className="flex items-center justify-between gap-3">
            <div className="flex items-center gap-2">
              {iconFor(stage.status)}
              <p className="text-sm font-medium">{stage.label}</p>
            </div>
            <span className="text-xs text-muted-foreground">{stage.status}</span>
          </div>
          {typeof stage.progressPercent === "number" ? (
            <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-muted">
              <div className="h-full bg-primary" style={{ width: `${stage.progressPercent}%` }} />
            </div>
          ) : null}
        </li>
      ))}
    </ol>
  )
}
