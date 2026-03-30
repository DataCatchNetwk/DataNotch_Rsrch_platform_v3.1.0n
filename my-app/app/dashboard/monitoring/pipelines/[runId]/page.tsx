"use client";

import Link from "next/link";
import { useEffect, useMemo, useState, useTransition } from "react";
import { useParams } from "next/navigation";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { PipelineStageGraph } from "@/components/pipelines/pipeline-stage-graph";
import { PipelineLogList } from "@/components/pipelines/pipeline-log-list";
import {
  createPipelineEventStream,
  getPipelineRun,
  retryPipelineRunFromStage,
  tailPipelineRunLiveLog,
  type PipelineStreamTailEvent,
} from "@/src/lib/api/pipelines";
import type { PipelineRun } from "@/src/lib/api/workspaces";
import { usePipelineSocket } from "@/src/lib/hooks/use-pipeline-socket";

export default function MonitoringPipelineDetailPage() {
  const params = useParams();
  const runId = String(params.runId);
  const [run, setRun] = useState<PipelineRun | null>(null);
  const [liveTail, setLiveTail] = useState<PipelineStreamTailEvent[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();
  const { liveRun } = usePipelineSocket(runId);

  useEffect(() => {
    let active = true;

    async function load() {
      try {
        const payload = await getPipelineRun(runId);
        if (active) {
          setRun(payload);
        }
      } catch (err) {
        if (active) {
          setError(err instanceof Error ? err.message : "Failed to load pipeline run");
        }
      }
    }

    void load();

    const stream = createPipelineEventStream(runId);
    stream.addEventListener("pipeline", (event) => {
      if (!active) {
        return;
      }

      try {
        const payload = JSON.parse((event as MessageEvent<string>).data) as PipelineRun;
        setRun(payload);
        setError(null);
      } catch {
        setError("Failed to parse pipeline stream payload");
      }
    });

    stream.onerror = () => {
      if (active) {
        setError((current) => current ?? "SSE stream disconnected; using last known state.");
      }
    };

    return () => {
      active = false;
      stream.close();
    };
  }, [runId]);

  useEffect(() => {
    let active = true;

    const loadTail = async () => {
      try {
        const events = await tailPipelineRunLiveLog(runId, 80);
        if (active) {
          setLiveTail(events);
        }
      } catch {
        // Keep UI resilient when stream tail is unavailable.
      }
    };

    void loadTail();
    const interval = setInterval(() => {
      void loadTail();
    }, 2000);

    return () => {
      active = false;
      clearInterval(interval);
    };
  }, [runId]);

  useEffect(() => {
    if (liveRun?.id === runId) {
      setRun(liveRun);
    }
  }, [liveRun, runId]);

  const failedStage = useMemo(
    () => run?.steps.find((step) => step.status === "FAILED" || step.status === "CANCELED"),
    [run],
  );

  const retryFromFailure = () => {
    if (!failedStage) {
      return;
    }

    startTransition(async () => {
      try {
        const retried = await retryPipelineRunFromStage(runId, {
          stepOrder: failedStage.order,
          reason: `Retry from failed stage ${failedStage.order}`,
        });
        setRun(retried);
        setError(null);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Failed to retry pipeline stage");
      }
    });
  };

  return (
    <div className="space-y-6 p-6">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <Link className="text-sm font-medium text-slate-500 hover:text-slate-900" href="/dashboard/monitoring/pipelines">
            Back to monitoring
          </Link>
          <h1 className="mt-2 text-3xl font-bold tracking-tight text-slate-900">{run?.name ?? "Pipeline Run"}</h1>
          <p className="mt-1 text-sm text-slate-600">Real-time graph and event log for this pipeline.</p>
        </div>

        <div className="flex items-center gap-2">
          <Badge className="rounded-full" variant="outline">{run?.status ?? "Loading"}</Badge>
          <Badge className="rounded-full border-blue-200 bg-blue-50 text-blue-700" variant="outline">
            {Math.round(run?.progressPercent ?? 0)}%
          </Badge>
          {failedStage ? (
            <Button disabled={pending} onClick={retryFromFailure}>
              {pending ? "Retrying..." : `Retry from Step ${failedStage.order}`}
            </Button>
          ) : null}
        </div>
      </div>

      {error ? <div className="rounded-xl border border-rose-200 bg-rose-50 p-4 text-sm text-rose-700">{error}</div> : null}

      {run ? (
        <>
          <Card className="rounded-2xl border-slate-200 bg-white shadow-sm">
            <CardHeader>
              <CardTitle>Stage Graph</CardTitle>
            </CardHeader>
            <CardContent>
              <PipelineStageGraph run={run} />
            </CardContent>
          </Card>

          <PipelineLogList events={run.events ?? []} />

          <Card className="rounded-2xl border-slate-200 bg-white shadow-sm">
            <CardHeader>
              <CardTitle>Event Log Tail</CardTitle>
            </CardHeader>
            <CardContent>
              <PipelineLogList
                events={liveTail.map((event) => ({
                  id: event.streamId,
                  eventType: event.eventType,
                  level: event.level,
                  message: event.message,
                  createdAt: event.createdAt,
                }))}
              />
            </CardContent>
          </Card>
        </>
      ) : (
        <Card className="rounded-2xl border-slate-200 bg-white shadow-sm">
          <CardContent className="p-6 text-sm text-slate-500">Loading pipeline details...</CardContent>
        </Card>
      )}
    </div>
  );
}
