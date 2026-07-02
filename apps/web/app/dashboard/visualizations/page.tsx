'use client';

import { useEffect, useMemo, useState } from 'react';
import { AreaChart, BarChart3, DatabaseZap, PieChart, TrendingUp } from 'lucide-react';

import { ResearchChartStudio, type ResearchChartRecord } from '@/components/visualizations/research-chart-studio';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import { listAnalysisJobs, type AnalysisJobsPageItem } from '@/src/lib/api/analysis-jobs-api-client';

function recordsFromJobs(jobs: AnalysisJobsPageItem[]): ResearchChartRecord[] {
  return jobs.map((job, index) => ({
    id: job.id,
    label: job.title.replace(/^Automated research pipeline for dataset\s*/i, '').slice(0, 28) || `Job ${index + 1}`,
    group: job.workspaceName,
    status: job.status,
    value: job.progressPercent,
    secondaryValue: Math.max(10, (job.artifactIds?.length ?? 0) * 18),
    runtimeMinutes: job.runtimeMinutes ?? job.queue?.queuedMinutes ?? 1,
    artifacts: job.artifactIds?.length ?? 1,
    latitude: 28 + index * 3.8,
    longitude: -118 + index * 10.5,
  }));
}

export default function VisualizationsPage() {
  const [jobs, setJobs] = useState<AnalysisJobsPageItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadJobs = () => {
    setLoading(true);
    setError(null);
    void listAnalysisJobs({ pageSize: 25, sortBy: 'LAST_UPDATED', includeArchived: false })
      .then((response) => setJobs(response.items))
      .catch((err) => setError(err instanceof Error ? err.message : 'Unable to load visualization data.'))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    loadJobs();
  }, []);

  const chartRecords = useMemo(() => recordsFromJobs(jobs), [jobs]);
  const succeeded = jobs.filter((job) => job.status === 'SUCCEEDED').length;

  return (
    <div className="space-y-8 p-6">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Visualizations</h1>
          <p className="mt-1 text-sm text-slate-500">
            Build interactive charts, dashboards, and visual insights from research jobs and outputs.
          </p>
        </div>
        <Button variant="outline" onClick={loadJobs} disabled={loading}>
          <DatabaseZap className="mr-2 h-4 w-4" />
          {loading ? 'Refreshing...' : 'Refresh Live Data'}
        </Button>
      </div>

      {error ? (
        <Alert className="border-amber-200 bg-amber-50 text-amber-900">
          <AlertTitle>Live data unavailable</AlertTitle>
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      ) : null}

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {[
          { icon: BarChart3, label: 'Charts', value: '13', color: 'text-indigo-600 bg-indigo-50' },
          { icon: PieChart, label: 'Live Jobs', value: String(jobs.length), color: 'text-violet-600 bg-violet-50' },
          { icon: AreaChart, label: 'Succeeded', value: String(succeeded), color: 'text-fuchsia-600 bg-fuchsia-50' },
          { icon: TrendingUp, label: 'Artifacts', value: String(jobs.reduce((sum, job) => sum + (job.artifactIds?.length ?? 0), 0)), color: 'text-emerald-600 bg-emerald-50' },
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

      <div className="grid gap-4 xl:grid-cols-[1fr_1.1fr]">
        <div className="rounded-2xl border-0 bg-white p-5 shadow-sm">
          <h2 className="text-lg font-semibold text-slate-900">Visualization Contract</h2>
          <p className="mt-1 text-sm text-slate-500">Unified chart lifecycle contract from analytics outputs into publication and presentation visuals.</p>
          <div className="mt-3 space-y-3">
            <div className="rounded-xl border border-blue-200 bg-blue-50 p-3">
              <p className="text-xs font-semibold uppercase tracking-wide text-blue-700">Input Contract</p>
              <p className="mt-1 text-sm text-blue-950">Analysis metrics, model artifacts, cohort slices, geospatial fields, and explainability signals.</p>
            </div>
            <div className="rounded-xl border border-emerald-200 bg-emerald-50 p-3">
              <p className="text-xs font-semibold uppercase tracking-wide text-emerald-700">Output Contract</p>
              <p className="mt-1 text-sm text-emerald-950">Figure-ready visuals, dashboard tiles, and exportable chart payloads with lineage context.</p>
            </div>
          </div>
        </div>

        <div className="rounded-2xl border-0 bg-white p-5 shadow-sm">
          <h2 className="text-lg font-semibold text-slate-900">Visualization Delivery Modules</h2>
          <p className="mt-1 text-sm text-slate-500">Use these routes to keep visual outputs consistent with Reports and Downloads.</p>
          <div className="mt-3 flex flex-wrap gap-2">
            <Button asChild variant="outline">
              <Link href="/dashboard/results">Results Workspace</Link>
            </Button>
            <Button asChild variant="outline">
              <Link href="/dashboard/reports">Reports</Link>
            </Button>
            <Button asChild variant="outline">
              <Link href="/dashboard/downloads">Downloads</Link>
            </Button>
          </div>
        </div>
      </div>

      <ResearchChartStudio
        title="Research Visualization Studio"
        description="Switch between bubble, radar, fire, area, histogram, donut, funnel, waterfall, sankey, map, and heat map views."
        records={chartRecords}
        initialMode="bubble"
      />
    </div>
  );
}
