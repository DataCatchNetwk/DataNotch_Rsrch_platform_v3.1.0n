"use client";

import { useEffect, useState } from "react";
import type { PipelineRun } from "@/src/lib/api/workspaces";
import type { PipelineMonitoringMetrics } from "@/src/lib/api/pipelines";
import { connectPipelineSocket } from "@/src/lib/api/pipelines";

export function usePipelineSocket(runId?: string) {
  const [liveRun, setLiveRun] = useState<PipelineRun | null>(null);
  const [liveMetrics, setLiveMetrics] = useState<PipelineMonitoringMetrics | null>(null);

  useEffect(() => {
    const socket = connectPipelineSocket(runId);

    if (runId) {
      socket.on(`pipeline:${runId}`, (next: PipelineRun) => {
        setLiveRun(next);
      });
    }

    socket.on("pipelines:metrics", (next: Record<string, number>) => {
      setLiveMetrics((current) => {
        if (!current) {
          return {
            totalRuns: Object.values(next).reduce((sum, value) => sum + value, 0),
            runningRuns: next.RUNNING ?? 0,
            queuedRuns: next.QUEUED ?? 0,
            failedRuns: next.FAILED ?? 0,
            succeededRuns: next.SUCCEEDED ?? 0,
            canceledRuns: next.CANCELED ?? 0,
            activeStages: 0,
            recentFailures: 0,
            successRate: 0,
          };
        }

        const totalRuns = Object.values(next).reduce((sum, value) => sum + value, 0);
        const succeededRuns = next.SUCCEEDED ?? current.succeededRuns;
        return {
          ...current,
          totalRuns,
          runningRuns: next.RUNNING ?? current.runningRuns,
          queuedRuns: next.QUEUED ?? current.queuedRuns,
          failedRuns: next.FAILED ?? current.failedRuns,
          succeededRuns,
          canceledRuns: next.CANCELED ?? current.canceledRuns,
          successRate: totalRuns ? Number(((succeededRuns / totalRuns) * 100).toFixed(1)) : current.successRate,
        };
      });
    });

    return () => {
      if (runId) {
        socket.emit("pipelines:unsubscribe", { runId });
      }
      socket.disconnect();
    };
  }, [runId]);

  return { liveRun, liveMetrics, setLiveMetrics };
}
