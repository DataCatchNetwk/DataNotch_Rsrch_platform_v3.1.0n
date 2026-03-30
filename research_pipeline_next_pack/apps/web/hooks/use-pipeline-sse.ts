'use client';

import { useEffect, useState } from 'react';
import type { PipelineState } from '@/lib/types/pipeline';

const API = process.env.NEXT_PUBLIC_API_BASE_URL ?? 'http://localhost:4000';

export function usePipelineSse(pipelineId: string, initial?: PipelineState | null) {
  const [pipeline, setPipeline] = useState<PipelineState | null>(initial ?? null);

  useEffect(() => {
    const source = new EventSource(`${API}/api/pipelines/stream/${pipelineId}`);
    source.onmessage = (event) => {
      const parsed = JSON.parse(event.data) as PipelineState;
      setPipeline(parsed);
    };
    return () => source.close();
  }, [pipelineId]);

  return pipeline;
}
