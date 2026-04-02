import { prisma } from '../db/prisma.js';
import { PipelinesOrchestrator } from '../pipelines/orchestrator.js';
import { WorkersService } from './workers.service.js';
import { EvaluateProcessor } from './processors/evaluate.processor.js';
import { ExportProcessor } from './processors/export.processor.js';
import { IngestProcessor } from './processors/ingest.processor.js';
import { PublishProcessor } from './processors/publish.processor.js';
import { ReportProcessor } from './processors/report.processor.js';
import { TrainProcessor } from './processors/train.processor.js';
import { TransformProcessor } from './processors/transform.processor.js';
import { PullJobProcessor } from './processors/pull-job.processor.js';
import { CohortBuildProcessor } from './processors/cohort-build.processor.js';
import { FeatureMaterializationProcessor } from './processors/feature-materialization.processor.js';
import { startQueueEvents } from './queue-events.js';

export async function startWorkers() {
  await prisma.$connect();
  await startQueueEvents();

  const workersService = new WorkersService(prisma);
  const orchestrator = new PipelinesOrchestrator(prisma, workersService);

  const workers = [
    new IngestProcessor(prisma, orchestrator).start(),
    new TransformProcessor(prisma, orchestrator).start(),
    new TrainProcessor(prisma, orchestrator).start(),
    new EvaluateProcessor(prisma, orchestrator).start(),
    new ReportProcessor(prisma, orchestrator).start(),
    new ExportProcessor(prisma, orchestrator).start(),
    new PublishProcessor(prisma, orchestrator).start(),
    new PullJobProcessor(prisma).start(),
    new CohortBuildProcessor(prisma).start(),
    new FeatureMaterializationProcessor(prisma).start(),
  ];

  workers.forEach((worker) => {
    worker.on('error', (error) => {
      console.error(`Worker ${worker.name} failed`, error);
    });
  });

  return workers;
}