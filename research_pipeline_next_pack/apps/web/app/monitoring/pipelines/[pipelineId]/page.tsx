import { fetchPipeline } from '@/lib/api/pipelines';
import { PipelineStageGraph } from '@/components/pipelines/pipeline-stage-graph';
import { PipelineLogList } from '@/components/pipelines/pipeline-log-list';
import { PipelineActions } from '@/components/pipelines/pipeline-actions';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

export default async function PipelineDetailPage({
  params,
}: {
  params: Promise<{ pipelineId: string }>;
}) {
  const { pipelineId } = await params;
  const pipeline = await fetchPipeline(pipelineId);

  return (
    <div className="space-y-6 p-6">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <p className="text-sm font-medium uppercase tracking-[0.22em] text-muted-foreground">
            Pipeline Detail
          </p>
          <h1 className="text-3xl font-bold tracking-tight">{pipeline.name}</h1>
          <p className="text-sm text-muted-foreground">
            Dataset {pipeline.datasetId} • Priority {pipeline.priority} • Status {pipeline.status}
          </p>
        </div>

        <PipelineActions pipeline={pipeline} />
      </div>

      <Card className="rounded-2xl">
        <CardHeader>
          <CardTitle>DAG Stage Flow</CardTitle>
        </CardHeader>
        <CardContent>
          <PipelineStageGraph pipeline={pipeline} />
        </CardContent>
      </Card>

      <PipelineLogList logs={pipeline.logs} />
    </div>
  );
}
