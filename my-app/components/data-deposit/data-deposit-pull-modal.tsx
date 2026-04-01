"use client";

import { useMemo, useState } from 'react';

import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import type { DepositDatasetSummary, PullToWorkspacePayload } from '@/src/lib/api/data-deposit';
import type { Workspace } from '@/src/lib/api/workspaces';

export function DataDepositPullModal({
  open,
  onOpenChange,
  dataset,
  workspaces,
  onSubmit,
}: {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  dataset: DepositDatasetSummary | null;
  workspaces: Workspace[];
  onSubmit: (payload: PullToWorkspacePayload) => Promise<void>;
}) {
  const [workspaceId, setWorkspaceId] = useState('');
  const [mode, setMode] = useState<'COPY' | 'VIRTUAL_VIEW'>('COPY');
  const [rowLimit, setRowLimit] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const workspaceOptions = useMemo(
    () => workspaces.map((workspace) => ({ id: workspace.id, name: workspace.name })),
    [workspaces],
  );

  async function handleSubmit() {
    if (!workspaceId) return;

    setSubmitting(true);

    try {
      await onSubmit({
        workspaceId,
        mode,
        rowLimit: rowLimit ? Number(rowLimit) : undefined,
      });
      onOpenChange(false);
      setWorkspaceId('');
      setRowLimit('');
      setMode('COPY');
    } finally {
      setSubmitting(false);
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
          <Select value={workspaceId} onValueChange={setWorkspaceId}>
            <SelectTrigger>
              <SelectValue placeholder="Select workspace" />
            </SelectTrigger>
            <SelectContent>
              {workspaceOptions.length ? (
                workspaceOptions.map((workspace) => (
                  <SelectItem key={workspace.id} value={workspace.id}>
                    {workspace.name}
                  </SelectItem>
                ))
              ) : (
                <SelectItem value="__empty" disabled>
                  No available workspaces
                </SelectItem>
              )}
            </SelectContent>
          </Select>

          <Input
            placeholder="Or paste workspace ID"
            value={workspaceId}
            onChange={(event) => setWorkspaceId(event.target.value)}
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
            onChange={(event) => setRowLimit(event.target.value)}
          />
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button onClick={() => void handleSubmit()} disabled={submitting || !workspaceId}>
            {submitting ? 'Queueing...' : 'Queue Pull Job'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
