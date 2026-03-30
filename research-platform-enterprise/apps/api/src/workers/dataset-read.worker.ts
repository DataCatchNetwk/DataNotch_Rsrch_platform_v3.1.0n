import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { S3StorageService } from '../storage/s3-storage.service';
import { FileReaderRegistry } from './readers/file-reader.registry';

@Injectable()
export class DatasetReadWorker {
  private readonly logger = new Logger(DatasetReadWorker.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly storage: S3StorageService,
    private readonly readers: FileReaderRegistry,
  ) {}

  async process(datasetId: string) {
    const dataset = await this.prisma.dataset.findUnique({
      where: { id: datasetId },
      include: {
        files: { where: { kind: 'ORIGINAL' }, orderBy: { createdAt: 'desc' }, take: 1 },
        jobs: { orderBy: { createdAt: 'desc' }, take: 1 },
      },
    });

    if (!dataset || !dataset.files.length || !dataset.jobs.length) return;

    const source = dataset.files[0];
    const job = dataset.jobs[0];

    await this.prisma.analysisJob.update({
      where: { id: job.id },
      data: { status: 'RUNNING', stage: 'READ', progress: 10, startedAt: new Date() },
    });

    const buffer = await this.storage.getObjectBuffer(source.storageKey);
    const reader = this.readers.resolve(source.originalFilename || 'dataset.csv', source.mimeType || undefined);
    const result = await reader.read(buffer);

    const previewKey = `datasets/${datasetId}/derived/preview.json`;
    const profileKey = `datasets/${datasetId}/derived/profile.json`;
    const previewBody = Buffer.from(JSON.stringify(result.previewRows, null, 2));
    const profileBody = Buffer.from(JSON.stringify(result, null, 2));

    await this.storage.putObject({ key: previewKey, body: previewBody, contentType: 'application/json' });
    await this.storage.putObject({ key: profileKey, body: profileBody, contentType: 'application/json' });

    await this.prisma.$transaction(async (tx) => {
      await tx.dataset.update({
        where: { id: datasetId },
        data: {
          rowCount: result.rowCount,
          columnCount: result.columnCount,
          schemaJson: result.columns as any,
          profileJson: result.profile as any,
          status: 'SUCCEEDED',
        },
      });

      await tx.artifact.createMany({
        data: [
          {
            datasetId,
            jobId: job.id,
            kind: 'PREVIEW_JSON',
            title: 'Dataset Preview',
            storageKey: previewKey,
            bucket: process.env.STORAGE_BUCKET || 'research-platform',
            mimeType: 'application/json',
            extension: 'json',
            sizeBytes: BigInt(previewBody.byteLength),
          },
          {
            datasetId,
            jobId: job.id,
            kind: 'PROFILE_JSON',
            title: 'Dataset Profile',
            storageKey: profileKey,
            bucket: process.env.STORAGE_BUCKET || 'research-platform',
            mimeType: 'application/json',
            extension: 'json',
            sizeBytes: BigInt(profileBody.byteLength),
          },
        ],
      });

      await tx.analysisJob.update({
        where: { id: job.id },
        data: {
          status: 'SUCCEEDED',
          stage: 'PROFILE',
          progress: 100,
          completedAt: new Date(),
          outputJson: { rowCount: result.rowCount, columnCount: result.columnCount } as any,
        },
      });
    });

    this.logger.log(`Dataset ${datasetId} processed successfully.`);
  }
}
