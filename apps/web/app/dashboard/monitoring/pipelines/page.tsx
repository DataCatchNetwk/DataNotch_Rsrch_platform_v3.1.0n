"use client";

import { useEffect, useState } from "react";
import { PipelineMetricsCards } from "@/components/pipelines/pipeline-metrics-cards";
import { PipelineTable } from "@/components/pipelines/pipeline-table";
import {
  getPipelineMonitoringMetrics,
  listPipelineMonitoringRuns,
  type PipelineMonitoringMetrics,
} from "@/src/lib/api/pipelines";
import type { PipelineRun } from "@/src/lib/api/workspaces";
import { usePipelineSocket } from "@/src/lib/hooks/use-pipeline-socket";

const EMPTY_METRICS: PipelineMonitoringMetrics = {
  totalRuns: 0,
  runningRuns: 0,
  queuedRuns: 0,
  failedRuns: 0,
  succeededRuns: 0,
  canceledRuns: 0,
  activeStages: 0,
  recentFailures: 0,
  successRate: 0,
};

export default function MonitoringPipelinesPage() {
  const [runs, setRuns] = useState<PipelineRun[]>([]);
  const [metrics, setMetrics] = useState<PipelineMonitoringMetrics>(EMPTY_METRICS);
  const [error, setError] = useState<string | null>(null);
  const { liveMetrics, setLiveMetrics } = usePipelineSocket();

  useEffect(() => {
    let active = true;

    async function load() {
      try {
        const [runsData, metricsData] = await Promise.all([
          listPipelineMonitoringRuns(80),
          getPipelineMonitoringMetrics(),
        ]);

        if (!active) {
          return;
        }

        setRuns(runsData);
        setMetrics(metricsData);
        setLiveMetrics(metricsData);
      } catch (err) {
        if (!active) {
          return;
        }

        setError(err instanceof Error ? err.message : "Failed to load monitoring dashboard");
      }
    }

    void load();

    return () => {
      active = false;
    };
  }, [setLiveMetrics]);

  return (
    <div className="space-y-6 p-6">
      <div>
        <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">Research Operations</p>
        <h1 className="mt-2 text-3xl font-bold tracking-tight text-slate-900">Pipeline Monitoring Dashboard</h1>
        <p className="mt-1 text-sm text-slate-600">Live orchestration for INGEST to CLEAN to ANALYZE to REPORT stages.</p>
      </div>

      {error ? <div className="rounded-xl border border-rose-200 bg-rose-50 p-4 text-sm text-rose-700">{error}</div> : null}

      <PipelineMetricsCards metrics={liveMetrics ?? metrics} />
      <PipelineTable runs={runs} />
    </div>
  );
}
