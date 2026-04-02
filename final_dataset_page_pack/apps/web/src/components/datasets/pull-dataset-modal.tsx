"use client"

import { useState } from "react"
import type { Dataset } from "@/lib/types/dataset"
import { pullDatasetToWorkspace } from "@/lib/api/datasets"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"

export function PullDatasetModal({
  dataset,
  open,
  onOpenChange,
}: {
  dataset: Dataset | null
  open: boolean
  onOpenChange: (open: boolean) => void
}) {
  const [workspaceId, setWorkspaceId] = useState("")
  const [alias, setAlias] = useState("")
  const [loading, setLoading] = useState(false)
  const [message, setMessage] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)

  async function handlePull() {
    if (!dataset || !workspaceId.trim()) return
    setLoading(true)
    setError(null)
    setMessage(null)

    try {
      const result = await pullDatasetToWorkspace({
        datasetId: dataset.id,
        workspaceId,
        alias: alias || undefined,
      })
      setMessage(`Pull job queued: ${result.jobId}`)
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to queue pull job")
    } finally {
      setLoading(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="rounded-2xl">
        <DialogHeader>
          <DialogTitle>Pull Dataset to Workspace</DialogTitle>
          <DialogDescription>
            Create a workspace copy or linked snapshot of this dataset for analysis.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <div>
            <Label htmlFor="workspaceId">Workspace ID</Label>
            <Input
              id="workspaceId"
              value={workspaceId}
              onChange={(e) => setWorkspaceId(e.target.value)}
              placeholder="wrk_123456"
            />
          </div>

          <div>
            <Label htmlFor="alias">Alias in workspace</Label>
            <Input
              id="alias"
              value={alias}
              onChange={(e) => setAlias(e.target.value)}
              placeholder={dataset?.name ?? "Dataset alias"}
            />
          </div>

          {message ? <div className="rounded-xl border p-3 text-sm">{message}</div> : null}
          {error ? <div className="rounded-xl border p-3 text-sm text-red-600">{error}</div> : null}
        </div>

        <DialogFooter>
          <Button variant="outline" className="rounded-xl" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button className="rounded-xl" onClick={handlePull} disabled={loading || !workspaceId.trim()}>
            {loading ? "Queueing..." : "Queue Pull Job"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
