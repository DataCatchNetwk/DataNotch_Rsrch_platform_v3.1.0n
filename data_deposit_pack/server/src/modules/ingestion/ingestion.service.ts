import { Injectable, Logger } from '@nestjs/common'
import { PrismaService } from '@/common/prisma/prisma.service'

@Injectable()
export class IngestionService {
  private readonly logger = new Logger(IngestionService.name)

  constructor(private readonly prisma: PrismaService) {}

  async ingestExternalDataset(input: {
    datasetId: string
    sourceType: string
    sourceUrl?: string
  }) {
    const run = await this.prisma.ingestionRun.create({
      data: {
        datasetId: input.datasetId,
        sourceType: input.sourceType,
        status: 'RUNNING',
        detailsJson: { sourceUrl: input.sourceUrl ?? null },
      },
    })

    try {
      // Replace with real connector fetch + profile + publish logic.
      await this.prisma.dataset.update({
        where: { id: input.datasetId },
        data: {
          lastIngestedAt: new Date(),
          lastProfiledAt: new Date(),
          lastPublishedAt: new Date(),
          depositStatus: 'PUBLISHED',
        },
      })

      await this.prisma.ingestionRun.update({
        where: { id: run.id },
        data: { status: 'SUCCEEDED', finishedAt: new Date() },
      })
    } catch (error) {
      this.logger.error('Ingestion failed', error as any)
      await this.prisma.ingestionRun.update({
        where: { id: run.id },
        data: { status: 'FAILED', finishedAt: new Date() },
      })
      throw error
    }
  }
}
