import { Injectable, NotFoundException } from "@nestjs/common";
import { PrismaService } from "@/common/prisma/prisma.service";
import { ListDepositDatasetsDto } from "./dto/list-deposit-datasets.dto";
import { PullDatasetDto } from "./dto/pull-dataset.dto";

@Injectable()
export class DataDepositService {
  constructor(private readonly prisma: PrismaService) {}

  async listPublic(dto: ListDepositDatasetsDto, userId?: string) {
    const datasets = await this.prisma.dataset.findMany({
      where: {
        isDepositListed: true,
        depositStatus: "AVAILABLE",
        ...(dto.domain ? { domain: dto.domain as any } : {}),
        ...(dto.accessLevel ? { accessLevel: dto.accessLevel as any } : {}),
        ...(dto.featured === "true" ? { isFeatured: true } : {}),
        ...(dto.search
          ? {
              OR: [
                { name: { contains: dto.search, mode: "insensitive" } },
                { description: { contains: dto.search, mode: "insensitive" } },
                { category: { contains: dto.search, mode: "insensitive" } },
                { sourceName: { contains: dto.search, mode: "insensitive" } },
              ],
            }
          : {}),
      },
      include: userId
        ? {
            favorites: {
              where: { userId },
              select: { id: true },
            },
          }
        : undefined,
      orderBy: [{ isFeatured: "desc" }, { publishedAt: "desc" }, { updatedAt: "desc" }],
      take: 50,
    });

    return datasets.map((dataset) => ({
      ...dataset,
      isFavorite: Array.isArray((dataset as any).favorites) && (dataset as any).favorites.length > 0,
    }));
  }

  async getById(id: string, userId?: string) {
    const dataset = await this.prisma.dataset.findUnique({
      where: { id },
      include: userId
        ? {
            favorites: {
              where: { userId },
              select: { id: true },
            },
          }
        : undefined,
    });

    if (!dataset || !dataset.isDepositListed) {
      throw new NotFoundException("Dataset not found in deposit catalog");
    }

    await this.prisma.datasetAccessLog.create({
      data: { datasetId: id, userId, action: "VIEW_DETAILS" },
    });

    return {
      ...dataset,
      isFavorite: Array.isArray((dataset as any).favorites) && (dataset as any).favorites.length > 0,
    };
  }

  async preview(id: string, userId?: string) {
    const dataset = await this.prisma.dataset.findUnique({
      where: { id },
      select: {
        id: true,
        name: true,
        previewRowsJson: true,
        schemaJson: true,
        rowCount: true,
        columnCount: true,
      },
    });

    if (!dataset) throw new NotFoundException("Dataset not found");

    await this.prisma.datasetAccessLog.create({
      data: { datasetId: id, userId, action: "PREVIEW" },
    });

    return dataset;
  }

  async favorite(datasetId: string, userId: string) {
    await this.prisma.datasetFavorite.upsert({
      where: { userId_datasetId: { userId, datasetId } },
      create: { userId, datasetId },
      update: {},
    });

    return { ok: true };
  }

  async unfavorite(datasetId: string, userId: string) {
    await this.prisma.datasetFavorite.deleteMany({ where: { userId, datasetId } });
    return { ok: true };
  }

  async pull(datasetId: string, dto: PullDatasetDto, userId: string) {
    const dataset = await this.prisma.dataset.findUnique({ where: { id: datasetId } });
    if (!dataset) throw new NotFoundException("Dataset not found");

    const pull = await this.prisma.datasetPullRequest.create({
      data: {
        datasetId,
        requestedById: userId,
        workspaceId: dto.workspaceId,
        selectedFields: dto.selectedFields ?? [],
        queryJson: dto.filters ?? {},
        status: "QUEUED",
      },
    });

    await this.prisma.datasetAccessLog.create({
      data: {
        datasetId,
        userId,
        action: "PULL_REQUESTED",
        metadataJson: { workspaceId: dto.workspaceId },
      },
    });

    return pull;
  }
}
