'use client';

import type { PipelineState } from '@/lib/types/pipeline';
import { StageNode } from './stage-node';

export function PipelineStageGraph({ pipeline }: { pipeline: PipelineState }) {
  return (
    <div className="grid gap-4 md:grid-cols-4">
      {pipeline.stages.map((stage, index) => (
        <div key={stage.name} className="relative">
          <StageNode stage={stage} />
          {index < pipeline.stages.length - 1 ? (
            <div className="hidden md:block absolute top-1/2 -right-2 z-10 h-0.5 w-4 bg-border" />
          ) : null}
        </div>
      ))}
    </div>
  );
}
