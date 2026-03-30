import { ForbiddenException, Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { S3StorageService } from '../storage/s3-storage.service';

@Injectable()
export class ArtifactsService {
  constructor(private readonly prisma: PrismaService, private readonly storage: S3StorageService) {}

  private async assertAccess(datasetId: string, userId: string) {
    const dataset = await this.prisma.dataset.findUnique({ where: { id: datasetId } });
    if (!dataset) throw new NotFoundException('Dataset not found');
    const member = await this.prisma.workspaceMember.findFirst({ where: { workspaceId: dataset.workspaceId, userId } });
    if (!member && dataset.ownerId !== userId) throw new ForbiddenException('No access');
  }

  async listForDataset(datasetId: string, userId: string) {
    await this.assertAccess(datasetId, userId);
    return this.prisma.artifact.findMany({ where: { datasetId }, orderBy: { createdAt: 'desc' } });
  }

  async getDownloadUrl(artifactId: string, userId: string) {
    const artifact = await this.prisma.artifact.findUnique({ where: { id: artifactId } });
    if (!artifact) throw new NotFoundException('Artifact not found');
    await this.assertAccess(artifact.datasetId, userId);
    return {
      artifactId: artifact.id,
      title: artifact.title,
      mimeType: artifact.mimeType,
      url: await this.storage.getPresignedDownloadUrl(artifact.storageKey, 900),
    };
  }
}
