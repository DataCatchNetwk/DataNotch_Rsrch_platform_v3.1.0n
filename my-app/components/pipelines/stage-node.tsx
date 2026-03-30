"use client";

import { Badge } from "@/components/ui/badge";
import type { PipelineStep } from "@/src/lib/api/workspaces";

export function StageNode({ step }: { step: PipelineStep }) {
  const tone =
    step.status === "SUCCEEDED"
      ? "border-emerald-200 bg-emerald-50"
      : step.status === "RUNNING"
        ? "border-blue-200 bg-blue-50"
        : step.status === "FAILED"
          ? "border-rose-200 bg-rose-50"
          : "border-slate-200 bg-white";

  return (
    <div className={`rounded-xl border p-4 ${tone}`}>
      <div className="flex items-center justify-between gap-3">
        <div>
          <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">{step.type}</p>
          <p className="text-sm font-medium text-slate-900">{step.name}</p>
        </div>
        <Badge variant="outline" className="rounded-full">
          {step.status}
        </Badge>
      </div>
      <div className="mt-3 text-sm text-slate-700">{Math.round(step.progressPercent)}%</div>
      {step.failureReason ? <div className="mt-2 text-xs text-rose-700">{step.failureReason}</div> : null}
    </div>
  );
}
