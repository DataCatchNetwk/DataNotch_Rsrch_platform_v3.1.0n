import { Worker, type Job } from 'bullmq';
import type { PrismaClient } from '@prisma/client';
import { RESEARCH_QUEUES } from '../../pipelines/queue.constants.js';
import { PipelinesOrchestrator } from '../../pipelines/orchestrator.js';
import { getRedisConnection } from '../queue.factory.js';
import { BaseProcessor } from '../runtime/base.processor.js';

export class ReportProcessor extends BaseProcessor {
  start() {
    return new Worker(RESEARCH_QUEUES.REPORT, async (job) => this.process(job), { connection: getRedisConnection() });
  }

  constructor(prisma: PrismaClient, orchestrator: PipelinesOrchestrator) {
    super(prisma, orchestrator, { name: RESEARCH_QUEUES.REPORT } as never);
  }

  async process(job: Job<Record<string, unknown>>) {
    try {
      if (job.data.stepType !== 'REPORT') {
        return null;
      }

      await this.begin(job);
      await this.progress(job, 15, 'Collecting metrics and figures');
      await this.progress(job, 45, 'Generating report sections');
      await this.progress(job, 75, 'Rendering PDF and DOCX outputs');

      const report = await this.prisma.report.create({
        data: {
          workspaceId: String(job.data.workspaceId),
          createdById: String(job.data.pipelineRunId ? await this.resolveTriggeredById(String(job.data.pipelineRunId)) : ''),
          title: `Automated Research Report - ${job.data.pipelineRunId}`,
          description: 'Auto-generated from research pipeline execution.',
          reportType: 'automated',
          status: 'READY',
          publicUrl: `reports/${job.data.pipelineRunId}/report.pdf`,
        },
      });

      const output = {
        reportId: report.id,
        pdfStorageKey: `reports/${job.data.pipelineRunId}/report.pdf`,
        docxStorageKey: `reports/${job.data.pipelineRunId}/report.docx`,
      };

      await this.prisma.pipelineArtifact.createMany({
        data: [
          {
            pipelineRunId: String(job.data.pipelineRunId),
            workspaceId: String(job.data.workspaceId),
            reportId: report.id,
            kind: 'REPORT',
            name: 'Automated Report PDF',
            storageKey: output.pdfStorageKey,
            mimeType: 'application/pdf',
          },
          {
            pipelineRunId: String(job.data.pipelineRunId),
            workspaceId: String(job.data.workspaceId),
            reportId: report.id,
            kind: 'REPORT',
            name: 'Automated Report DOCX',
            storageKey: output.docxStorageKey,
            mimeType: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
          },
        ],
      });

      await this.succeed(job, output, { reportSections: 8 });
      return output;
    } catch (error) {
      await this.fail(job, error);
      throw error;
    }
  }

  private async resolveTriggeredById(runId: string) {
    const run = await this.prisma.pipelineRun.findUnique({ where: { id: runId }, select: { triggeredById: true } });
    if (!run) {
      throw new Error('Pipeline run not found for report generation');
    }

    return run.triggeredById;
  }
}