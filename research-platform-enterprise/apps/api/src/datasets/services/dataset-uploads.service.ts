import { ForbiddenException, Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { S3StorageService } from '../../storage/s3-storage.service';
import { QueueService } from '../../queue/queue.service';
import { InitiateUploadDto } from '../dto/initiate-upload.dto';
import { RequestPartUrlDto } from '../dto/request-part-url.dto';
import { CompleteUploadDto } from '../dto/complete-upload.dto';

@Injectable()
export class DatasetUploadsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly storage: S3StorageService,
    private readonly queue: QueueService,
  ) {}

  private async assertDatasetAccess(datasetId: string, userId: string) {
    const dataset = await this.prisma.dataset.findUnique({ where: { id: datasetId } });
    if (!dataset) throw new NotFoundException('Dataset not found');

    const member = await this.prisma.workspaceMember.findFirst({
      where: { workspaceId: dataset.workspaceId, userId },
    });
    if (!member && dataset.ownerId !== userId) throw new ForbiddenException('No access to dataset');
    return dataset;
  }

  async initiate(datasetId: string, userId: string, dto: InitiateUploadDto) {
    await this.assertDatasetAccess(datasetId, userId);
    const uploadKey = `datasets/${datasetId}/uploads/${Date.now()}-${dto.filename}`;
    const multipart = await this.storage.initiateMultipartUpload({
      key: uploadKey,
      contentType: dto.mimeType,
      metadata: { datasetId, uploadedBy: userId },
    });

    return this.prisma.multipartUpload.create({
      data: {
        datasetId,
        initiatedById: userId,
        uploadKey,
        bucket: multipart.bucket,
        originalFilename: dto.filename,
        mimeType: dto.mimeType,
        totalParts: dto.totalParts,
        totalSizeBytes: dto.totalSizeBytes ? BigInt(dto.totalSizeBytes) : undefined,
      },
    });
  }

  async getPartUrl(datasetId: string, uploadId: string, userId: string, dto: RequestPartUrlDto) {
    await this.assertDatasetAccess(datasetId, userId);
    const upload = await this.prisma.multipartUpload.findUnique({ where: { id: uploadId } });
    if (!upload || upload.datasetId !== datasetId) throw new NotFoundException('Upload not found');
    return {
      partNumber: dto.partNumber,
      url: await this.storage.getMultipartPartUploadUrl({ key: upload.uploadKey, uploadId: upload.id, partNumber: dto.partNumber }),
    };
  }

  async markPartComplete(datasetId: string, uploadId: string, userId: string, part: { partNumber: number; etag: string; sizeBytes?: number; checksumSha256?: string; }) {
    await this.assertDatasetAccess(datasetId, userId);
    const upload = await this.prisma.multipartUpload.findUnique({ where: { id: uploadId } });
    if (!upload || upload.datasetId !== datasetId) throw new NotFoundException('Upload not found');

    await this.prisma.multipartUploadPart.upsert({
      where: { uploadId_partNumber: { uploadId, partNumber: part.partNumber } },
      create: {
        uploadId,
        partNumber: part.partNumber,
        etag: part.etag,
        sizeBytes: part.sizeBytes ? BigInt(part.sizeBytes) : undefined,
        checksumSha256: part.checksumSha256,
        uploadedAt: new Date(),
      },
      update: {
        etag: part.etag,
        sizeBytes: part.sizeBytes ? BigInt(part.sizeBytes) : undefined,
        checksumSha256: part.checksumSha256,
        uploadedAt: new Date(),
      },
    });

    await this.prisma.multipartUpload.update({ where: { id: uploadId }, data: { status: 'UPLOADING' } });
    return { ok: true };
  }

  async complete(datasetId: string, uploadId: string, userId: string, dto: CompleteUploadDto) {
    const dataset = await this.assertDatasetAccess(datasetId, userId);
    const upload = await this.prisma.multipartUpload.findUnique({ where: { id: uploadId } });
    if (!upload || upload.datasetId !== datasetId) throw new NotFoundException('Upload not found');

    await this.storage.completeMultipartUpload({
      key: upload.uploadKey,
      uploadId: upload.id,
      parts: dto.parts.map((p) => ({ partNumber: p.partNumber, etag: p.etag })),
    });

    await this.prisma.$transaction(async (tx) => {
      await tx.multipartUpload.update({
        where: { id: uploadId },
        data: { status: 'COMPLETED', completedAt: new Date() },
      });

      await tx.dataset.update({
        where: { id: datasetId },
        data: {
          originalFilename: upload.originalFilename,
          mimeType: upload.mimeType,
          sizeBytes: upload.totalSizeBytes,
          status: 'QUEUED',
        },
      });

      await tx.datasetFile.create({
        data: {
          datasetId,
          kind: 'ORIGINAL',
          storageKey: upload.uploadKey,
          bucket: upload.bucket,
          originalFilename: upload.originalFilename,
          mimeType: upload.mimeType,
          sizeBytes: upload.totalSizeBytes ?? BigInt(0),
          createdById: userId,
        },
      });

      await tx.analysisJob.create({
        data: {
          datasetId,
          createdById: userId,
          type: 'DATASET_INGESTION',
          status: 'QUEUED',
          stage: 'READ',
          progress: 0,
          inputJson: { uploadId, storageKey: upload.uploadKey, originalFilename: upload.originalFilename, workspaceId: dataset.workspaceId } as any,
        },
      });
    });

    await this.queue.enqueueDatasetRead(datasetId);
    return { ok: true };
  }

  async abort(datasetId: string, uploadId: string, userId: string) {
    await this.assertDatasetAccess(datasetId, userId);
    const upload = await this.prisma.multipartUpload.findUnique({ where: { id: uploadId } });
    if (!upload || upload.datasetId !== datasetId) throw new NotFoundException('Upload not found');

    await this.storage.abortMultipartUpload({ key: upload.uploadKey, uploadId: upload.id });
    await this.prisma.multipartUpload.update({ where: { id: uploadId }, data: { status: 'ABORTED', abortedAt: new Date() } });
    return { ok: true };
  }
}
