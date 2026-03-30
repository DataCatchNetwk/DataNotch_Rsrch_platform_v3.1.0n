import { fetchPipelines } from '@/lib/api/pipelines';
import { PipelineMetricsCards } from '@/components/pipelines/pipeline-metrics-cards';
import { PipelineTable } from '@/components/pipelines/pipeline-table';

export default async function PipelineMonitoringPage() {
  const { items, metrics } = await fetchPipelines();

  return (
    <div className="space-y-6 p-6">
      <div>
        <p className="text-sm font-medium uppercase tracking-[0.22em] text-muted-foreground">
          Research Operations
        </p>
        <h1 className="text-3xl font-bold tracking-tight">Pipeline Monitoring Dashboard</h1>
        <p className="text-sm text-muted-foreground">
          Real-time orchestration visibility for ingest, clean, analyze, and report stages.
        </p>
      </div>

      <PipelineMetricsCards metrics={metrics} />
      <PipelineTable items={items} />
    </div>
  );
}
