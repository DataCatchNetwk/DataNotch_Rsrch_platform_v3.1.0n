"use client";

import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";

type Props = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSubmit: (payload: { name: string; description?: string }) => Promise<void>;
  busy?: boolean;
};

export function CreateWorkspaceDialog({
  open,
  onOpenChange,
  onSubmit,
  busy = false,
}: Props) {
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [localError, setLocalError] = useState<string | null>(null);

  async function handleSubmit() {
    setLocalError(null);

    if (!name.trim()) {
      setLocalError("Workspace name is required.");
      return;
    }

    try {
      await onSubmit({
        name: name.trim(),
        description: description.trim() || undefined,
      });
      setName("");
      setDescription("");
      onOpenChange(false);
    } catch (err) {
      setLocalError(err instanceof Error ? err.message : "Failed to create workspace");
    }
  }

  function handleClose(nextOpen: boolean) {
    onOpenChange(nextOpen);
    if (!nextOpen) {
      setLocalError(null);
    }
  }

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-140 rounded-2xl">
        <DialogHeader>
          <DialogTitle>Create Workspace</DialogTitle>
          <DialogDescription>
            Start a new collaborative environment for members, datasets, analysis, and reports.
          </DialogDescription>
        </DialogHeader>

        <div className="grid gap-4 py-2">
          <div className="space-y-2">
            <Label htmlFor="workspace-name">Workspace name</Label>
            <Input
              id="workspace-name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Cardio Risk Study"
              className="rounded-xl"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="workspace-description">Description</Label>
            <Textarea
              id="workspace-description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Briefly describe the research scope, collaboration goal, or data focus."
              className="min-h-32.5 rounded-xl"
            />
          </div>

          {localError ? (
            <div className="rounded-xl border border-rose-200 bg-rose-50 px-3 py-2 text-sm text-rose-700">
              {localError}
            </div>
          ) : null}
        </div>

        <DialogFooter className="gap-2 sm:justify-end">
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
            className="rounded-xl"
            disabled={busy}
          >
            Cancel
          </Button>
          <Button
            onClick={() => void handleSubmit()}
            disabled={busy}
            className="rounded-xl bg-linear-to-r from-indigo-500 to-violet-600 text-white"
          >
            {busy ? "Creating..." : "Create Workspace"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
