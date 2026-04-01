import { Injectable, Logger } from "@nestjs/common";
import { PrismaService } from "@/common/prisma/prisma.service";

export interface DepositProvider {
  key: string;
  ingest(): Promise<{
    datasetSlug: string;
    rowCount?: number;
    previewRows?: unknown[];
    schema?: unknown;
    metadata?: Record<string, unknown>;
  }[]>;
}

@Injectable()
export class DepositIngestionService {
  private readonly logger = new Logger(DepositIngestionService.name);

  constructor(private readonly prisma: PrismaService) {}

  async runProvider(provider: DepositProvider) {
    const payloads = await provider.ingest();

    for (const payload of payloads) {
      const dataset = await this.prisma.dataset.upsert({
        where: { slug: payload.datasetSlug },
        create: {
          slug: payload.datasetSlug,
          name: payload.datasetSlug.replace(/-/g, " "),
          depositStatus: "AVAILABLE",
          isDepositListed: true,
          zone: "CURATED",
          previewRowsJson: payload.previewRows as any,
          schemaJson: payload.schema as any,
          rowCount: payload.rowCount,
          publishedAt: new Date(),
        },
        update: {
          depositStatus: "AVAILABLE",
          previewRowsJson: payload.previewRows as any,
          schemaJson: payload.schema as any,
          rowCount: payload.rowCount,
          lastIngestedAt: new Date(),
        },
      });

      await this.prisma.datasetIngestionRun.create({
        data: {
          datasetId: dataset.id,
          providerKey: provider.key,
          status: "SUCCEEDED",
          rowsRead: payload.rowCount,
          rowsWritten: payload.rowCount,
          metadataJson: payload.metadata ?? {},
          finishedAt: new Date(),
        },
      });

      this.logger.log(`Ingested dataset ${dataset.slug} from ${provider.key}`);
    }
  }
}
