import { Injectable, NotFoundException } from '@nestjs/common'
import { ListDepositDatasetsDto } from './dto/list-deposit-datasets.dto'
import { PullDepositDatasetDto } from './dto/pull-deposit-dataset.dto'
import { DataDepositQueueService } from './queue/data-deposit-queue.service'

@Injectable()
export class DataDepositService {
  constructor(private readonly queue: DataDepositQueueService) {}

  async list(dto: ListDepositDatasetsDto, currentUserId?: string) {
    // Replace with Prisma query against your Dataset / DepositCatalog models.
    const items = [
      {
        id: 'ds_health_001',
        slug: 'cdc-diabetes-surveillance',
        name: 'CDC Diabetes Surveillance',
        description: 'Curated diabetes surveillance indicators for research use.',
        domain: 'HEALTH',
        tags: ['cdc', 'diabetes', 'surveillance'],
        sourceName: 'CDC',
        sizeBytes: 10485760,
        recordCount: 24128,
        updatedAt: new Date().toISOString(),
        accessibility: 'PUBLIC',
        isFavorite: true,
      },
      {
        id: 'ds_climate_001',
        slug: 'noaa-county-heat-index',
        name: 'NOAA County Heat Index',
        description: 'County-level heat index summary series for environmental analysis.',
        domain: 'CLIMATE',
        tags: ['noaa', 'heat', 'county'],
        sourceName: 'NOAA',
        sizeBytes: 4194304,
        recordCount: 8244,
        updatedAt: new Date().toISOString(),
        accessibility: 'RESTRICTED',
        isFavorite: false,
      },
    ]

    const filtered = items.filter((item) => {
      if (dto.domain && item.domain !== dto.domain) return false
      if (dto.accessibility && item.accessibility !== dto.accessibility) return false
      if (dto.favoritesOnly === 'true' && !item.isFavorite) return false
      if (dto.search) {
        const haystack = `${item.name} ${item.description} ${item.tags.join(' ')}`.toLowerCase()
        if (!haystack.includes(dto.search.toLowerCase())) return false
      }
      return true
    })

    return { items: filtered, total: filtered.length }
  }

  async getById(id: string) {
    if (!id) throw new NotFoundException('Dataset not found')

    return {
      id,
      slug: 'cdc-diabetes-surveillance',
      name: 'CDC Diabetes Surveillance',
      description: 'Curated diabetes surveillance indicators for research use.',
      domain: 'HEALTH',
      tags: ['cdc', 'diabetes', 'surveillance'],
      sourceName: 'CDC',
      sizeBytes: 10485760,
      recordCount: 24128,
      updatedAt: new Date().toISOString(),
      accessibility: 'PUBLIC',
      isFavorite: false,
      schema: [
        { name: 'state', type: 'string' },
        { name: 'year', type: 'integer' },
        { name: 'indicator', type: 'string' },
        { name: 'value', type: 'float' },
      ],
      license: 'Open Data',
      refreshCadence: 'Monthly',
      provenance: 'CDC public programmatic feed',
    }
  }

  async preview(id: string, currentUserId?: string) {
    const dataset = await this.getById(id)
    const previewJob = await this.queue.enqueuePreviewJob({ datasetId: id, requesterUserId: currentUserId })

    return {
      dataset,
      columns: ['state', 'year', 'indicator', 'value'],
      rows: [
        { state: 'Maryland', year: 2024, indicator: 'prevalence', value: 11.2 },
        { state: 'Virginia', year: 2024, indicator: 'prevalence', value: 10.8 },
        { state: 'Delaware', year: 2024, indicator: 'prevalence', value: 12.1 },
        { state: 'New York', year: 2024, indicator: 'prevalence', value: 9.9 },
        { state: 'Pennsylvania', year: 2024, indicator: 'prevalence', value: 10.5 },
      ],
      previewJobId: previewJob.id,
      generatedAt: new Date().toISOString(),
    }
  }

  async pull(id: string, dto: PullDepositDatasetDto, currentUserId?: string) {
    const job = await this.queue.enqueuePullJob({
      datasetId: id,
      workspaceId: dto.workspaceId,
      mode: dto.mode,
      rowLimit: dto.rowLimit,
      requesterUserId: currentUserId,
    })

    return { jobId: job.id, status: job.status }
  }

  async favorite(id: string, favorite: boolean, currentUserId?: string) {
    // Replace with user preference persistence.
    return { ok: true as const }
  }
}
