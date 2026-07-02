"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { ArrowRight, Play, RefreshCcw, RotateCcw, XCircle } from "lucide-react";
import {
  cancelPipelineRun,
  getPipelineMonitoringMetrics,
  listPipelineMonitoringRuns,
  retryPipelineRunFromFailedStage,
  resumePipelineRun,
  type PipelineMonitoringMetrics,
} from "@/src/lib/api/pipelines";
import type { PipelineRun } from "@/src/lib/api/workspaces";
import { usePipelineSocket } from "@/src/lib/hooks/use-pipeline-socket";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";

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
  const [busyId, setBusyId] = useState<string | null>(null);
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

  async function runAction(runId: string, action: "resume" | "retry" | "cancel") {
    setBusyId(runId);
    setError(null);
    try {
      if (action === "resume") {
        await resumePipelineRun(runId, "Resume requested from runtime monitoring");
      }
      if (action === "retry") {
        await retryPipelineRunFromFailedStage(runId, { reason: "Retry requested from runtime monitoring" });
      }
      if (action === "cancel") {
        await cancelPipelineRun(runId, "Cancelled from runtime monitoring");
      }
      const [runsData, metricsData] = await Promise.all([
        listPipelineMonitoringRuns(80),
        getPipelineMonitoringMetrics(),
      ]);
      setRuns(runsData);
      setMetrics(metricsData);
      setLiveMetrics(metricsData);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to run pipeline action");
    } finally {
      setBusyId(null);
    }
  }

  const effectiveMetrics = liveMetrics ?? metrics;

  return (
    <main className="min-h-screen bg-slate-50 p-8">
      <div className="mx-auto max-w-7xl space-y-6">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <p className="text-sm font-semibold uppercase tracking-[0.2em] text-slate-500">Research Operations</p>
            <h1 className="mt-2 text-4xl font-bold tracking-tight text-slate-900">Runtime Monitoring</h1>
            <p className="mt-1 text-sm text-slate-600">Control pipelines across ingest, cleaning, harmonization, modeling, and reporting stages.</p>
          </div>
          <Button variant="outline" onClick={() => window.location.reload()}>
            <RefreshCcw className="mr-2 h-4 w-4" />
            Refresh
          </Button>
        </div>

        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-5">
          <MetricCard label="Total" value={String(effectiveMetrics.totalRuns)} />
          <MetricCard label="Running" value={String(effectiveMetrics.runningRuns)} />
          <MetricCard label="Queued" value={String(effectiveMetrics.queuedRuns)} />
          <MetricCard label="Failed" value={String(effectiveMetrics.failedRuns)} />
          <MetricCard label="Success" value={`${effectiveMetrics.successRate}%`} />
        </div>

        {error ? <div className="rounded-xl border border-rose-200 bg-rose-50 p-4 text-sm text-rose-700">{error}</div> : null}

        <Card className="rounded-2xl border-slate-200 bg-white shadow-sm">
          <CardContent className="p-5">
            <h2 className="mb-4 text-xl font-semibold text-slate-900">Pipeline Runs</h2>
            <div className="overflow-x-auto">
              <table className="w-full min-w-225 text-sm">
                <thead>
                  <tr className="border-b text-left text-slate-500">
                    <th className="py-3">Run</th>
                    <th>Workspace</th>
                    <th>Status</th>
                    <th>Progress</th>
                    <th>Current Step</th>
                    <th>Updated</th>
                    <th className="text-right">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {runs.map((run) => (
                    <tr key={run.id} className="border-b align-middle">
                      <td className="py-4 font-medium text-slate-900">{run.name}</td>
                      <td className="text-slate-600">{run.workspaceId}</td>
                      <td className="text-slate-700">{run.status}</td>
                      <td>
                        <div className="w-40 rounded-full bg-slate-100">
                          <div className={`h-2 rounded-full bg-indigo-600 ${progressClass(run.progressPercent)}`} />
                        </div>
                      </td>
                      <td className="text-slate-600">{run.steps.find((step) => step.status === "RUNNING")?.name ?? "-"}</td>
                      <td className="text-slate-500">{new Date(run.updatedAt).toLocaleString()}</td>
                      <td>
                        <div className="flex items-center justify-end gap-1">
                          <IconAction
                            title="Resume"
                            onClick={() => void runAction(run.id, "resume")}
                            disabled={busyId === run.id}
                            icon={<Play className="h-4 w-4" />}
                          />
                          <IconAction
                            title="Retry"
                            onClick={() => void runAction(run.id, "retry")}
                            disabled={busyId === run.id}
                            icon={<RotateCcw className="h-4 w-4" />}
                          />
                          <IconAction
                            title="Cancel"
                            onClick={() => void runAction(run.id, "cancel")}
                            disabled={busyId === run.id}
                            icon={<XCircle className="h-4 w-4" />}
                          />
                          <Button asChild variant="ghost" size="icon" title="Open run">
                            <Link href={`/dashboard/monitoring/pipelines/${run.id}`}>
                              <ArrowRight className="h-4 w-4" />
                            </Link>
                          </Button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      </div>
    </main>
  );
}

function MetricCard({ label, value }: { label: string; value: string }) {
  return (
    <Card className="rounded-2xl border-slate-200 bg-white shadow-sm">
      <CardContent className="p-5">
        <p className="text-sm text-slate-500">{label}</p>
        <p className="text-3xl font-bold text-slate-900">{value}</p>
      </CardContent>
    </Card>
  );
}

function IconAction({
  title,
  icon,
  disabled,
  onClick,
}: {
  title: string;
  icon: React.ReactNode;
  disabled?: boolean;
  onClick: () => void;
}) {
  return (
    <Button type="button" variant="ghost" size="icon" title={title} disabled={disabled} onClick={onClick}>
      {icon}
    </Button>
  );
}

function progressClass(value: number) {
  if (value <= 10) return "w-1/12";
  if (value <= 20) return "w-1/6";
  if (value <= 30) return "w-1/4";
  if (value <= 40) return "w-1/3";
  if (value <= 50) return "w-5/12";
  if (value <= 60) return "w-1/2";
  if (value <= 70) return "w-7/12";
  if (value <= 80) return "w-2/3";
  if (value <= 90) return "w-3/4";
  if (value < 100) return "w-5/6";
  return "w-full";
}
