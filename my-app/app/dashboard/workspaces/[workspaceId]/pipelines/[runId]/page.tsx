"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { createPipelineEventStream, getPipelineRun, type PipelineRun } from "@/src/lib/api/pipelines";

function formatTime(value?: string | null) {
  if (!value) {
    return "Pending";
  }

  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? value : date.toLocaleString();
}

function ProgressBar({ value }: { value: number }) {
  return (
    <progress
      className="h-2 w-full overflow-hidden rounded-full [&::-webkit-progress-bar]:bg-slate-100 [&::-webkit-progress-value]:bg-indigo-500 [&::-moz-progress-bar]:bg-indigo-500"
      max={100}
      value={Math.max(0, Math.min(100, Math.round(value)))}
    />
  );
}

export default function PipelineRunPage() {
  const params = useParams();
  const workspaceId = String(params.workspaceId);
  const runId = String(params.runId);

  const [run, setRun] = useState<PipelineRun | null>(null);
  const [error, setError] = useState<string | null>(null);

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
        setError("Failed to parse pipeline event stream");
      }
    });

    stream.onerror = () => {
      if (active) {
        setError((current) => current ?? "Live stream disconnected; showing last known state.");
      }
    };

    return () => {
      active = false;
      stream.close();
    };
  }, [runId]);

  return (
    <div className="min-h-screen bg-slate-50">
      <div className="mx-auto max-w-7xl px-6 py-8">
        <div className="space-y-6">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <Link href={`/dashboard/workspaces/${workspaceId}`} className="text-sm font-medium text-slate-500 hover:text-slate-900">
                Back to workspace
              </Link>
              <h1 className="mt-2 text-3xl font-bold tracking-tight text-slate-900">{run?.name ?? "Pipeline Run"}</h1>
              <p className="mt-1 text-sm text-slate-600">Live orchestration, worker progress, events, and generated artifacts.</p>
            </div>

            <div className="flex flex-wrap items-center gap-2">
              <Badge variant="outline" className="rounded-full">{run?.status ?? "Loading"}</Badge>
              <Badge variant="outline" className="rounded-full border-blue-200 bg-blue-50 text-blue-700">
                {Math.round(run?.progressPercent ?? 0)}%
              </Badge>
            </div>
          </div>

          {error ? (
            <Card className="rounded-2xl border-rose-200 bg-rose-50 shadow-sm">
              <CardContent className="p-4 text-sm text-rose-700">{error}</CardContent>
            </Card>
          ) : null}

          <Card className="rounded-2xl border-slate-200 bg-white shadow-sm">
            <CardHeader>
              <CardTitle>Overall Progress</CardTitle>
              <CardDescription>
                Started {formatTime(run?.startedAt)} • Completed {formatTime(run?.completedAt)}
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <ProgressBar value={run?.progressPercent ?? 0} />
              <p className="text-sm text-slate-600">Overall progress: {Math.round(run?.progressPercent ?? 0)}%</p>
            </CardContent>
          </Card>

          <div className="grid gap-6 lg:grid-cols-2">
            <Card className="rounded-2xl border-slate-200 bg-white shadow-sm">
              <CardHeader>
                <CardTitle>Pipeline Steps</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {run?.steps?.map((step) => (
                  <div key={step.id} className="space-y-3 rounded-xl border border-slate-200 p-4">
                    <div className="flex items-center justify-between gap-3">
                      <div className="font-medium text-slate-900">{step.order}. {step.name}</div>
                      <Badge variant="outline" className="rounded-full">{step.status}</Badge>
                    </div>
                    <ProgressBar value={step.progressPercent} />
                    {step.failureReason ? <p className="text-sm text-rose-600">{step.failureReason}</p> : null}
                  </div>
                )) ?? <div className="text-sm text-slate-500">No steps available.</div>}
              </CardContent>
            </Card>

            <Card className="rounded-2xl border-slate-200 bg-white shadow-sm">
              <CardHeader>
                <CardTitle>Live Event Feed</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="max-h-130 space-y-3 overflow-y-auto pr-1">
                  {run?.events?.length ? run.events.map((event) => (
                    <div key={event.id} className="rounded-xl border border-slate-200 p-3">
                      <div className="flex items-center justify-between gap-2">
                        <Badge variant="secondary" className="rounded-full">{event.level}</Badge>
                        <span className="text-xs text-slate-500">{formatTime(event.createdAt)}</span>
                      </div>
                      <div className="mt-2 text-sm font-medium text-slate-900">{event.eventType}</div>
                      <div className="text-sm text-slate-600">{event.message}</div>
                    </div>
                  )) : <div className="text-sm text-slate-500">No events yet.</div>}
                </div>
              </CardContent>
            </Card>
          </div>

          <Card className="rounded-2xl border-slate-200 bg-white shadow-sm">
            <CardHeader>
              <CardTitle>Generated Artifacts</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {run?.artifacts?.length ? run.artifacts.map((artifact) => (
                <div key={artifact.id} className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-slate-200 p-4">
                  <div>
                    <div className="font-medium text-slate-900">{artifact.name}</div>
                    <div className="text-sm text-slate-500">{artifact.kind} • {artifact.storageKey}</div>
                  </div>
                  <Button asChild variant="outline" className="rounded-xl border-slate-200">
                    <Link href={`/dashboard/workspaces/${workspaceId}`}>Back to workspace</Link>
                  </Button>
                </div>
              )) : (
                <div className="text-sm text-slate-500">No artifacts yet.</div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}