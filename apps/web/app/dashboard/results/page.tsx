'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import { BarChart3, CheckCircle2, Clock, Download, FileText, Timer, Workflow } from 'lucide-react';

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { ResearchChartStudio, type ResearchChartRecord } from '@/components/visualizations/research-chart-studio';
import { getAnalysisJob, getAnalysisJobDownloadUrl, type AnalysisJobDetails } from '@/src/lib/api/analysis-jobs-api-client';

function formatDate(value?: string | null) {
  if (!value) return '--';
  return new Intl.DateTimeFormat('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
  }).format(new Date(value));
}

function formatRuntimeMinutes(value?: number | null) {
  if (value == null) return '--';
  if (value < 1) return `${Math.round(value * 60)} sec`;
  if (value >= 60) {
    const hours = Math.floor(value / 60);
    const minutes = Math.round(value % 60);
    return `${hours}h ${minutes}m`;
  }
  return `${Math.round(value)} min`;
}

function statusBadgeClass(status?: string | null) {
  switch (status) {
    case 'QUEUED':
      return 'bg-slate-100 text-slate-700 border-slate-200';
    case 'RUNNING':
      return 'bg-blue-50 text-blue-700 border-blue-200';
    case 'SUCCEEDED':
      return 'bg-emerald-50 text-emerald-700 border-emerald-200';
    case 'FAILED':
      return 'bg-red-50 text-red-700 border-red-200';
    case 'CANCELLED':
      return 'bg-amber-50 text-amber-700 border-amber-200';
    default:
      return 'bg-slate-100 text-slate-700 border-slate-200';
  }
}

function resultRecords(job: AnalysisJobDetails | null): ResearchChartRecord[] {
  if (!job) return [];

  const logCount = job.logs?.length ?? 0;
  const artifactCount = job.artifactIds?.length ?? 0;
  const runtime = job.runtimeMinutes ?? job.queue?.queuedMinutes ?? 1;

  return [
    {
      id: `${job.id}-progress`,
      label: 'Progress',
      group: job.workspaceName,
      status: job.status,
      value: job.progressPercent,
      secondaryValue: artifactCount * 18,
      runtimeMinutes: runtime,
      artifacts: artifactCount || 1,
      latitude: 39,
      longitude: -77,
    },
    {
      id: `${job.id}-runtime`,
      label: 'Runtime',
      group: job.workspaceName,
      status: job.status,
      value: Math.max(10, 100 - Math.round(runtime)),
      secondaryValue: Math.min(100, Math.round(runtime * 4)),
      runtimeMinutes: runtime,
      artifacts: Math.max(1, Math.round(runtime / 2)),
      latitude: 34,
      longitude: -118,
    },
    {
      id: `${job.id}-artifacts`,
      label: 'Artifacts',
      group: job.templateName,
      status: job.status,
      value: Math.min(100, Math.max(10, artifactCount * 20)),
      secondaryValue: job.progressPercent,
      runtimeMinutes: Math.max(1, artifactCount * 3),
      artifacts: artifactCount || 1,
      latitude: 41,
      longitude: -73,
    },
    {
      id: `${job.id}-logs`,
      label: 'Logs',
      group: job.templateName,
      status: logCount > 0 ? 'SUCCEEDED' : job.status,
      value: Math.min(100, Math.max(12, logCount * 12)),
      secondaryValue: Math.max(10, 100 - logCount * 4),
      runtimeMinutes: Math.max(1, logCount),
      artifacts: Math.max(1, Math.ceil(logCount / 2)),
      latitude: 33,
      longitude: -84,
    },
  ];
}

export default function ResultsPage() {
  const searchParams = useSearchParams();
  const jobId = searchParams.get('jobId');
  const [job, setJob] = useState<AnalysisJobDetails | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!jobId) {
      setJob(null);
      setError(null);
      setLoading(false);
      return;
    }

    let cancelled = false;
    setLoading(true);
    setError(null);

    void getAnalysisJob(jobId)
      .then((result) => {
        if (!cancelled) {
          setJob(result);
        }
      })
      .catch((err) => {
        if (!cancelled) {
          setError(err instanceof Error ? err.message : 'Unable to load result context.');
          setJob(null);
        }
      })
      .finally(() => {
        if (!cancelled) {
          setLoading(false);
        }
      });

    return () => {
      cancelled = true;
    };
  }, [jobId]);

  return (
    <div className="space-y-8 p-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">Results</h1>
        <p className="mt-1 text-sm text-slate-500">
          View outputs and findings from completed analysis jobs, models, and pipeline runs.
        </p>
      </div>

      {jobId ? (
        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div>
              <p className="text-xs font-medium uppercase tracking-wide text-slate-500">Selected Job</p>
              <div className="mt-1 flex flex-wrap items-center gap-2">
                <h2 className="text-lg font-semibold text-slate-900">{job?.title ?? jobId}</h2>
                <Badge className={statusBadgeClass(job?.status)}>{job?.status ?? 'UNKNOWN'}</Badge>
              </div>
              <p className="mt-1 text-sm text-slate-500">
                {loading
                  ? 'Loading result context...'
                  : error
                    ? error
                    : `Dataset: ${job?.dataset?.name ?? 'N/A'} · Workspace: ${job?.workspaceName ?? 'N/A'}`}
              </p>
            </div>
            <div className="flex flex-wrap gap-2">
              <Button asChild variant="outline">
                <Link href={`/dashboard/analysis/jobs/${jobId}`}>View Job</Link>
              </Button>
              <Button
                variant="outline"
                disabled={!job || job.status !== 'SUCCEEDED'}
                onClick={() => window.open(getAnalysisJobDownloadUrl(jobId), '_blank', 'noopener,noreferrer')}
              >
                <Download className="mr-2 h-4 w-4" />
                Download Output
              </Button>
            </div>
          </div>
        </div>
      ) : null}

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {[
          { icon: BarChart3, label: 'Total Results', value: job ? '1' : '0', color: 'text-indigo-600 bg-indigo-50' },
          { icon: CheckCircle2, label: 'Successful', value: job?.status === 'SUCCEEDED' ? '1' : '0', color: 'text-emerald-600 bg-emerald-50' },
          { icon: Clock, label: 'Processing', value: job && (job.status === 'QUEUED' || job.status === 'RUNNING') ? '1' : '0', color: 'text-amber-600 bg-amber-50' },
          { icon: Download, label: 'Ready to Export', value: job?.status === 'SUCCEEDED' ? '1' : '0', color: 'text-violet-600 bg-violet-50' },
        ].map(({ icon: Icon, label, value, color }) => (
          <div key={label} className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
            <div className={`inline-flex h-10 w-10 items-center justify-center rounded-xl ${color}`}>
              <Icon className="h-5 w-5" />
            </div>
            <p className="mt-3 text-xs font-medium uppercase tracking-wide text-slate-500">{label}</p>
            <p className="mt-1 text-xl font-semibold text-slate-900">{value}</p>
          </div>
        ))}
      </div>

      <ResearchChartStudio
        title="Result Visualization"
        description="Review the selected result package across interactive chart modes and export-ready analytical views."
        records={resultRecords(job)}
        initialMode="radar"
      />

      {job ? (
        <div className="grid gap-6 lg:grid-cols-2">
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Execution Summary</CardTitle>
              <CardDescription>Core run metadata and timing for this result package.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid gap-3 sm:grid-cols-2">
                <div className="rounded-xl border p-3">
                  <p className="text-xs text-slate-500">Submitted</p>
                  <p className="mt-1 text-sm font-medium text-slate-900">{formatDate(job.createdAt)}</p>
                </div>
                <div className="rounded-xl border p-3">
                  <p className="text-xs text-slate-500">Started</p>
                  <p className="mt-1 text-sm font-medium text-slate-900">{formatDate(job.startedAt)}</p>
                </div>
                <div className="rounded-xl border p-3">
                  <p className="text-xs text-slate-500">Finished</p>
                  <p className="mt-1 text-sm font-medium text-slate-900">{formatDate(job.finishedAt)}</p>
                </div>
                <div className="rounded-xl border p-3">
                  <p className="text-xs text-slate-500">Runtime</p>
                  <p className="mt-1 flex items-center gap-2 text-sm font-medium text-slate-900">
                    <Timer className="h-4 w-4 text-slate-500" />
                    {formatRuntimeMinutes(job.runtimeMinutes)}
                  </p>
                </div>
              </div>

              <Separator />

              <div className="space-y-2">
                <p className="text-xs font-medium uppercase tracking-wide text-slate-500">Queue</p>
                <div className="rounded-xl border p-3">
                  <p className="flex items-center gap-2 text-sm font-medium text-slate-900">
                    <Workflow className="h-4 w-4 text-slate-500" />
                    {job.queue?.queueName ?? 'Unavailable'}
                  </p>
                  <p className="mt-1 text-xs text-slate-600">{job.queue?.note ?? 'Queue data not available for this job.'}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-base">Inputs & Parameters</CardTitle>
              <CardDescription>Captured request parameters used to generate this result.</CardDescription>
            </CardHeader>
            <CardContent>
              {!job.parameters || Object.keys(job.parameters).length === 0 ? (
                <p className="text-sm text-slate-500">No parameter payload was recorded for this run.</p>
              ) : (
                <div className="space-y-2">
                  {Object.entries(job.parameters).map(([key, value]) => (
                    <div key={key} className="flex items-center justify-between rounded-xl border px-3 py-2">
                      <span className="text-sm font-medium text-slate-700">{key}</span>
                      <span className="text-sm text-slate-600">{String(value)}</span>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          <Card className="lg:col-span-2">
            <CardHeader>
              <CardTitle className="text-base">Recent Execution Logs</CardTitle>
              <CardDescription>Latest events captured for this analysis job.</CardDescription>
            </CardHeader>
            <CardContent>
              {(job.logs ?? []).length === 0 ? (
                <p className="text-sm text-slate-500">No logs available yet.</p>
              ) : (
                <div className="max-h-80 space-y-2 overflow-auto rounded-xl border bg-slate-50 p-3">
                  {job.logs.slice(-25).map((log) => (
                    <div key={log.id} className="font-mono text-xs text-slate-700">
                      [{new Date(log.timestamp).toLocaleTimeString()}] {log.level}: {log.message}
                    </div>
                  ))}
                </div>
              )}

              <div className="mt-4 flex flex-wrap gap-2">
                <Button variant="outline" onClick={() => window.open(getAnalysisJobDownloadUrl(job.id), '_blank', 'noopener,noreferrer')}>
                  <FileText className="mr-2 h-4 w-4" />
                  Download Output Package
                </Button>
                <Button asChild variant="outline">
                  <Link href={`/dashboard/analysis/jobs/${job.id}`}>Open Full Job Console</Link>
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      ) : null}

      <div className="rounded-2xl border border-dashed border-slate-300 bg-slate-50 p-12 text-center">
        <BarChart3 className="mx-auto h-10 w-10 text-slate-400" />
        <p className="mt-3 text-sm font-semibold text-slate-700">{job ? 'Result packaging is available from this job.' : 'No results yet'}</p>
        <p className="mt-1 text-xs text-slate-500">
          {job
            ? 'Use the actions above to review the job details or download the packaged output.'
            : 'Run an analysis job or pipeline to see its output results here.'}
        </p>
      </div>
    </div>
  );
}
