import { useState } from 'react'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import type { DatasetListItem } from './types'

const workspaceOptions = [
  { id: 'ws-hematology', name: 'Hematology Program' },
  { id: 'ws-genomics', name: 'Genomics Discovery Lab' },
  { id: 'ws-endocrine', name: 'Endocrine Outcomes Study' },
]

export function DatasetPullModal({
  dataset,
  open,
  onOpenChange,
  onSubmit,
}: {
  dataset: DatasetListItem | null
  open: boolean
  onOpenChange: (open: boolean) => void
  onSubmit: (datasetId: string, workspaceId: string) => Promise<void>
}) {
  const [workspaceId, setWorkspaceId] = useState('')
  const [submitting, setSubmitting] = useState(false)

  async function submit() {
    if (!dataset || !workspaceId) return
    setSubmitting(true)
    try {
      await onSubmit(dataset.id, workspaceId)
    } finally {
      setSubmitting(false)
      setWorkspaceId('')
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg rounded-3xl">
        <DialogHeader>
          <DialogTitle>Pull dataset to workspace</DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          <div className="rounded-2xl border p-4 text-sm">
            <div className="font-medium">{dataset?.name}</div>
            <div className="mt-1 text-muted-foreground">Select a workspace destination and create a linked workspace dataset copy.</div>
          </div>
          <div className="space-y-2">
            <Label>Workspace</Label>
            <Select value={workspaceId} onValueChange={setWorkspaceId}>
              <SelectTrigger><SelectValue placeholder="Choose workspace" /></SelectTrigger>
              <SelectContent>
                {workspaceOptions.map((workspace) => (
                  <SelectItem key={workspace.id} value={workspace.id}>{workspace.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
            <Button disabled={!workspaceId || submitting} onClick={submit}>Pull Dataset</Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
