'use client';

import { cn } from '@/lib/utils';
import type { PipelineStageState } from '@/lib/types/pipeline';

export function StageNode({ stage }: { stage: PipelineStageState }) {
  const tone =
    stage.status === 'COMPLETED'
      ? 'border-green-500/40 bg-green-500/10'
      : stage.status === 'RUNNING'
      ? 'border-blue-500/40 bg-blue-500/10'
      : stage.status === 'FAILED'
      ? 'border-red-500/40 bg-red-500/10'
      : 'border-border bg-background';

  return (
    <div className={cn('rounded-2xl border p-4 shadow-sm', tone)}>
      <div className="flex items-center justify-between gap-3">
        <div>
          <p className="text-xs font-medium tracking-[0.18em] text-muted-foreground">{stage.name}</p>
          <p className="text-sm font-semibold">{stage.status}</p>
        </div>
        <div className="text-right">
          <p className="text-xl font-bold">{stage.progress}%</p>
          <p className="text-xs text-muted-foreground">Attempts: {stage.attempts}</p>
        </div>
      </div>

      {stage.error ? <p className="mt-3 text-xs text-red-600">{stage.error}</p> : null}
    </div>
  );
}
