"use client"

import * as React from "react"
import { AlertTriangle, CheckCircle2, Loader2 } from "lucide-react"
import { uploadDatasetWithProgress } from "@/lib/api/dataset-details"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Progress } from "@/components/ui/progress"
import { Button } from "@/components/ui/button"

export function DatasetUploadProgressDialog({
  open,
  onOpenChange,
  file,
  payload,
  onCompleted,
}: {
  open: boolean
  onOpenChange: (open: boolean) => void
  file: File | null
  payload: {
    name: string
    description?: string
    visibility: "PRIVATE" | "TEAM" | "PUBLIC" | "RESTRICTED"
    workspaceId?: string
  } | null
  onCompleted?: (result: unknown) => void
}) {
  const [progress, setProgress] = React.useState(0)
  const [stage, setStage] = React.useState<"IDLE" | "UPLOADING" | "PROCESSING" | "DONE" | "FAILED">("IDLE")
  const [error, setError] = React.useState<string | null>(null)

  React.useEffect(() => {
    async function run() {
      if (!open || !file || !payload) return
      try {
        setError(null)
        setStage("UPLOADING")
        setProgress(0)

        const result = await uploadDatasetWithProgress(
          {
            file,
            name: payload.name,
            description: payload.description,
            visibility: payload.visibility,
            workspaceId: payload.workspaceId,
          },
          (percent) => {
            setProgress(percent)
          }
        )

        setStage("PROCESSING")
        setProgress(100)

        await new Promise((resolve) => setTimeout(resolve, 900))

        setStage("DONE")
        onCompleted?.(result)
      } catch (e) {
        setStage("FAILED")
        setError((e as Error).message)
      }
    }

    run()
  }, [open, file, payload, onCompleted])

  const isDone = stage === "DONE"
  const isFailed = stage === "FAILED"

  return (
    <Dialog
      open={open}
      onOpenChange={(next) =>
        !stage || isDone || isFailed ? onOpenChange(next) : null
      }
    >
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Uploading Dataset</DialogTitle>
          <DialogDescription>
            Your file is being transferred and registered in the research pipeline.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-5 py-2">
          <div className="rounded-2xl border bg-muted/30 p-4">
            <div className="mb-2 flex items-center justify-between">
              <span className="text-sm font-medium">
                {stage === "UPLOADING" && "Uploading file"}
                {stage === "PROCESSING" && "Processing dataset"}
                {stage === "DONE" && "Upload complete"}
                {stage === "FAILED" && "Upload failed"}
                {stage === "IDLE" && "Preparing upload"}
              </span>
              <span className="text-sm text-muted-foreground">{progress}%</span>
            </div>
            <Progress value={progress} />
          </div>

          <div className="flex items-center gap-3 rounded-xl border p-4">
            {stage === "DONE" ? (
              <CheckCircle2 className="h-5 w-5 text-green-600" />
            ) : isFailed ? (
              <AlertTriangle className="h-5 w-5 text-destructive" />
            ) : (
              <Loader2 className="h-5 w-5 animate-spin" />
            )}

            <div>
              <p className="font-medium">{file?.name ?? "Dataset file"}</p>
              <p className="text-sm text-muted-foreground">
                {error || "Please keep this window open until the operation completes."}
              </p>
            </div>
          </div>

          {(isDone || isFailed) && (
            <Button className="w-full" onClick={() => onOpenChange(false)}>
              Close
            </Button>
          )}
        </div>
      </DialogContent>
    </Dialog>
  )
}
