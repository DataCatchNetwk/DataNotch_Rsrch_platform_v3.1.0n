"use client"

import { CheckCircle2, Clock3, Loader2, XCircle } from "lucide-react"
import { format } from "date-fns"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Progress } from "@/components/ui/progress"
import type { AnalysisJobStage } from "@/types/analysis"

function StageIcon({ status }: { status: AnalysisJobStage["status"] }) {
  if (status === "DONE") return <CheckCircle2 className="h-4 w-4 text-green-600" />
  if (status === "FAILED") return <XCircle className="h-4 w-4 text-destructive" />
  if (status === "RUNNING") return <Loader2 className="h-4 w-4 animate-spin" />
  return <Clock3 className="h-4 w-4 text-muted-foreground" />
}

export function AnalysisStageTimeline({ stages }: { stages: AnalysisJobStage[] }) {
  return (
    <Card className="rounded-2xl shadow-sm">
      <CardHeader>
        <CardTitle>Pipeline Stages</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {stages.length ? (
          stages.map((stage) => (
            <div key={stage.key} className="rounded-xl border p-4">
              <div className="flex items-center justify-between gap-3">
                <div className="flex items-center gap-2">
                  <StageIcon status={stage.status} />
                  <div>
                    <p className="font-medium">{stage.label}</p>
                    <p className="text-xs text-muted-foreground">{stage.status}</p>
                  </div>
                </div>
                <div className="text-right text-xs text-muted-foreground">
                  {stage.startedAt ? <div>Started {format(new Date(stage.startedAt), "PPP p")}</div> : null}
                  {stage.completedAt ? <div>Finished {format(new Date(stage.completedAt), "PPP p")}</div> : null}
                </div>
              </div>
              <div className="mt-3">
                <Progress value={stage.progressPercent ?? (stage.status === "DONE" ? 100 : 0)} />
              </div>
            </div>
          ))
        ) : (
          <p className="text-sm text-muted-foreground">No stage timeline available.</p>
        )}
      </CardContent>
    </Card>
  )
}
