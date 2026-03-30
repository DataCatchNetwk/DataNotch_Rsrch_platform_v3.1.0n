'use client';

import { useEffect, useState } from 'react';
import { io } from 'socket.io-client';
import type { PipelineMetrics, PipelineState } from '@/lib/types/pipeline';

const SOCKET_URL = process.env.NEXT_PUBLIC_SOCKET_URL ?? 'http://localhost:4000';

export function usePipelineSocket(pipelineId?: string) {
  const [pipeline, setPipeline] = useState<PipelineState | null>(null);
  const [metrics, setMetrics] = useState<PipelineMetrics | null>(null);

  useEffect(() => {
    const socket = io(`${SOCKET_URL}/pipelines`);

    if (pipelineId) {
      socket.on(`pipeline:${pipelineId}`, (next: PipelineState) => setPipeline(next));
    }

    socket.on('pipelines:metrics', (next: PipelineMetrics) => setMetrics(next));

    return () => {
      socket.disconnect();
    };
  }, [pipelineId]);

  return { pipeline, metrics };
}
