"use client";

import type { PipelineRun } from "@/src/lib/api/workspaces";
import { StageNode } from "./stage-node";

export function PipelineStageGraph({ run }: { run: PipelineRun }) {
  return (
    <div className="grid gap-4 md:grid-cols-4">
      {run.steps.map((step, index) => (
        <div className="relative" key={step.id}>
          <StageNode step={step} />
          {index < run.steps.length - 1 ? (
            <div className="absolute -right-2 top-1/2 z-10 hidden h-0.5 w-4 -translate-y-1/2 bg-slate-300 md:block" />
          ) : null}
        </div>
      ))}
    </div>
  );
}
