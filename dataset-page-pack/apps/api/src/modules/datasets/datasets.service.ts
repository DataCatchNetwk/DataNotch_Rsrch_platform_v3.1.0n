import { Injectable, NotFoundException } from '@nestjs/common'
import { PrismaService } from '../../prisma/prisma.service'
import { ListDatasetsDto } from './dto/list-datasets.dto'
import { PullDatasetDto } from './dto/pull-dataset.dto'

@Injectable()
export class DatasetsService {
  constructor(private readonly prisma: PrismaService) {}

  async list(userId: string, query: ListDatasetsDto) {
    const where: any = {
      deletedAt: null,
    }

    if (query.search) {
      where.OR = [
        { name: { contains: query.search, mode: 'insensitive' } },
        { description: { contains: query.search, mode: 'insensitive' } },
        { tags: { has: query.search.toLowerCase() } },
      ]
    }

    if (query.section) where.section = query.section
    if (query.visibility) where.visibility = query.visibility
    if (query.tag) where.tags = { has: query.tag.toLowerCase() }

    if (query.favoritesOnly === 'true') {
      where.favorites = {
        some: { userId },
      }
    }

    const orderByMap = {
      updatedAt: { updatedAt: 'desc' },
      createdAt: { createdAt: 'desc' },
      name: { name: 'asc' },
      recordCount: { recordCount: 'desc' },
    } as const

    const items = await this.prisma.dataset.findMany({
      where,
      orderBy: orderByMap[query.sortBy ?? 'updatedAt'],
      include: {
        owner: true,
        favorites: { where: { userId } },
        workspaceLinks: true,
        lineageParent: true,
      },
    })

    return items.map((item) => ({
      id: item.id,
      slug: item.slug,
      name: item.name,
      description: item.description,
      section: item.section,
      visibility: item.visibility,
      status: item.status,
      ownerName: item.owner.name ?? item.owner.email,
      workspaceCount: item.workspaceLinks.length,
      recordCount: item.recordCount,
      fileCount: item.fileCount,
      sizeLabel: item.sizeLabel,
      tags: item.tags,
      modalities: item.modalities,
      updatedAt: item.updatedAt,
      createdAt: item.createdAt,
      isFavorite: item.favorites.length > 0,
      lineageVersion: item.lineageVersion,
      lineageParentName: item.lineageParent?.name ?? null,
      sampleColumns: item.sampleColumns,
      governanceSummary: item.governanceSummary,
    }))
  }

  async toggleFavorite(userId: string, datasetId: string) {
    const existing = await this.prisma.datasetFavorite.findUnique({
      where: {
        userId_datasetId: { userId, datasetId },
      },
    })

    if (existing) {
      await this.prisma.datasetFavorite.delete({ where: { id: existing.id } })
      return { success: true, isFavorite: false }
    }

    await this.prisma.datasetFavorite.create({
      data: { userId, datasetId },
    })

    return { success: true, isFavorite: true }
  }

  async pullToWorkspace(userId: string, datasetId: string, dto: PullDatasetDto) {
    const dataset = await this.prisma.dataset.findUnique({ where: { id: datasetId } })
    if (!dataset) throw new NotFoundException('Dataset not found')

    const membership = await this.prisma.workspaceMember.findFirst({
      where: {
        workspaceId: dto.workspaceId,
        userId,
        role: { in: ['OWNER', 'ADMIN', 'RESEARCHER'] },
      },
    })

    if (!membership) throw new NotFoundException('Workspace access not found')

    const link = await this.prisma.workspaceDataset.create({
      data: {
        workspaceId: dto.workspaceId,
        sourceDatasetId: dataset.id,
        linkedByUserId: userId,
        name: dataset.name,
        description: dataset.description,
        visibility: dataset.visibility,
      },
    })

    return { success: true, workspaceDatasetId: link.id }
  }
}
