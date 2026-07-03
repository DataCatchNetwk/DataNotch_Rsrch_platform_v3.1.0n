import { Queue, Worker, JobsOptions } from 'bullmq';
import IORedis from 'ioredis';
import fs from 'node:fs/promises';
import path from 'node:path';
import { prisma } from '../database/prisma';
import { parseCsv, profileRows, cleanRows, toCsv } from '../preparation/cleaning-engine';

const connection = new IORedis(process.env.REDIS_URL || 'redis://localhost:6379', { maxRetriesPerRequest: null });
export const preparationQueue = new Queue('data-preparation', { connection });

export async function enqueuePreparation(datasetId: string, options?: JobsOptions) {
  return preparationQueue.add('prepare-dataset', { datasetId }, { attempts: 3, backoff: { type: 'exponential', delay: 3000 }, ...options });
}

async function setStage(workflowId: string, stage: string, status: 'RUNNING'|'COMPLETED'|'FAILED', metricsJson?: any, error?: string) {
  await prisma.preparationStageRun.upsert({
    where: { workflowId_stage: { workflowId, stage } as any },
    create: { workflowId, stage, status, startedAt: status === 'RUNNING' ? new Date() : undefined, finishedAt: status !== 'RUNNING' ? new Date() : undefined, metricsJson, error },
    update: { status, finishedAt: status !== 'RUNNING' ? new Date() : undefined, metricsJson, error },
  });
}

export function startPreparationWorker() {
  return new Worker('data-preparation', async job => {
    const { datasetId } = job.data as { datasetId: string };
    const workflow = await prisma.preparationWorkflow.findFirst({ where: { datasetId }, orderBy: { createdAt: 'desc' } });
    if (!workflow) throw new Error('Preparation workflow missing');

    try {
      await prisma.preparationWorkflow.update({ where: { id: workflow.id }, data: { status: 'RUNNING', currentStage: 'RAW_REGISTERED' }});
      await prisma.dataset.update({ where: { id: datasetId }, data: { status: 'RAW_REGISTERED' }});
      const raw = await prisma.datasetAsset.findFirstOrThrow({ where: { datasetId, kind: 'RAW' }});

      await setStage(workflow.id, 'PROFILING', 'RUNNING');
      await prisma.dataset.update({ where: { id: datasetId }, data: { status: 'PROFILING' }});
      const text = await fs.readFile(raw.path, 'utf8');
      const rows = parseCsv(text);
      const profile = profileRows(rows);
      const profilePath = path.join(path.dirname(raw.path), 'profile-report.json');
      await fs.writeFile(profilePath, JSON.stringify(profile, null, 2));
      await prisma.datasetAsset.create({ data: { datasetId, kind: 'PROFILE_REPORT', filename: 'profile-report.json', path: profilePath, mimeType: 'application/json' }});
      await prisma.dataset.update({ where: { id: datasetId }, data: { status: 'PROFILED', rowCount: profile.rowCount, columnCount: profile.columnCount, qualityScore: profile.qualityScore }});
      await setStage(workflow.id, 'PROFILING', 'COMPLETED', profile);

      await setStage(workflow.id, 'CLEANING', 'RUNNING');
      await prisma.dataset.update({ where: { id: datasetId }, data: { status: 'CLEANING' }});
      const cleaned = cleanRows(rows);
      const cleanedCsv = toCsv(cleaned);
      const cleanedPath = path.join(path.dirname(raw.path), 'cleaned.csv');
      await fs.writeFile(cleanedPath, cleanedCsv);
      await prisma.datasetAsset.create({ data: { datasetId, kind: 'CLEANED', filename: 'cleaned.csv', path: cleanedPath, mimeType: 'text/csv', sizeBytes: Buffer.byteLength(cleanedCsv) }});
      await prisma.dataset.update({ where: { id: datasetId }, data: { status: 'CLEANED' }});
      await setStage(workflow.id, 'CLEANING', 'COMPLETED', { outputRows: cleaned.length });

      await setStage(workflow.id, 'VALIDATING', 'RUNNING');
      await prisma.dataset.update({ where: { id: datasetId }, data: { status: 'VALIDATING' }});
      const finalProfile = profileRows(cleaned);
      await setStage(workflow.id, 'VALIDATING', 'COMPLETED', finalProfile);
      await prisma.dataset.update({ where: { id: datasetId }, data: { status: 'READY_FOR_ANALYSIS', qualityScore: finalProfile.qualityScore, rowCount: finalProfile.rowCount, columnCount: finalProfile.columnCount }});
      await prisma.preparationWorkflow.update({ where: { id: workflow.id }, data: { status: 'COMPLETED', currentStage: 'READY_FOR_ANALYSIS' }});
    } catch (err: any) {
      await prisma.dataset.update({ where: { id: datasetId }, data: { status: 'FAILED' }});
      await prisma.preparationWorkflow.update({ where: { id: workflow.id }, data: { status: 'FAILED', error: err.message }});
      throw err;
    }
  }, { connection });
}
