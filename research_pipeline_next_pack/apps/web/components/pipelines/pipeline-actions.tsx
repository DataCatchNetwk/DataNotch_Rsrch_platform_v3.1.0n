'use client';

import { useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import type { PipelineState, PipelineStageName } from '@/lib/types/pipeline';
import { retryPipelineStage } from '@/lib/api/pipelines';

export function PipelineActions({ pipeline }: { pipeline: PipelineState }) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();

  const failedStage = pipeline.stages.find((stage) => stage.status === 'FAILED');

  const retry = (stage: PipelineStageName) => {
    startTransition(async () => {
      await retryPipelineStage(pipeline.id, stage);
      router.refresh();
    });
  };

  return (
    <div className="flex flex-wrap gap-3">
      {failedStage ? (
        <Button disabled={pending} onClick={() => retry(failedStage.name)}>
          {pending ? 'Retrying…' : `Retry from ${failedStage.name}`}
        </Button>
      ) : null}
      <Button variant="outline" onClick={() => router.refresh()}>
        Refresh
      </Button>
    </div>
  );
}
