"use client"

import { useState } from 'react'
import type { DepositDatasetSummary } from '@/lib/types/data-deposit'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'

export function DataDepositPullModal({
  open,
  onOpenChange,
  dataset,
  onSubmit,
}: {
  open: boolean
  onOpenChange: (v: boolean) => void
  dataset: DepositDatasetSummary | null
  onSubmit: (payload: { workspaceId: string; mode: 'COPY' | 'VIRTUAL_VIEW'; rowLimit?: number }) => Promise<void>
}) {
  const [workspaceId, setWorkspaceId] = useState('')
  const [mode, setMode] = useState<'COPY' | 'VIRTUAL_VIEW'>('COPY')
  const [rowLimit, setRowLimit] = useState('')
  const [submitting, setSubmitting] = useState(false)

  async function handleSubmit() {
    if (!workspaceId) return
    setSubmitting(true)
    try {
      await onSubmit({
        workspaceId,
        mode,
        rowLimit: rowLimit ? Number(rowLimit) : undefined,
      })
      onOpenChange(false)
      setWorkspaceId('')
      setRowLimit('')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="rounded-2xl">
        <DialogHeader>
          <DialogTitle>Pull to Workspace</DialogTitle>
          <DialogDescription>
            Import or virtually attach <span className="font-medium">{dataset?.name}</span> to a workspace.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <Input
            placeholder="Workspace ID"
            value={workspaceId}
            onChange={(e) => setWorkspaceId(e.target.value)}
          />

          <Select value={mode} onValueChange={(value: 'COPY' | 'VIRTUAL_VIEW') => setMode(value)}>
            <SelectTrigger>
              <SelectValue placeholder="Select pull mode" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="COPY">Copy into workspace</SelectItem>
              <SelectItem value="VIRTUAL_VIEW">Virtual view</SelectItem>
            </SelectContent>
          </Select>

          <Input
            placeholder="Optional row limit"
            value={rowLimit}
            onChange={(e) => setRowLimit(e.target.value)}
          />
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button onClick={handleSubmit} disabled={submitting || !workspaceId}>
            {submitting ? 'Queueing...' : 'Queue Pull Job'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
