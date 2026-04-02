/**
 * Cohorts Module
 * Manages cohort definitions and cohort membership for research
 */
import { Prisma, ResearchDomain } from '@prisma/client';
import { prisma } from '../../db/prisma.js';
import { HttpError } from '../../utils/errors.js';
import { CohortBuildProcessor, processCohortBuildWithoutQueue } from '../../workers/processors/cohort-build.processor.js';
import { isRedisReachable } from '../../workers/queue.factory.js';

export interface CreateCohortDto {
  name: string;
  description?: string;
  domain: string;
  criteriaJson: Record<string, any>;
  sourceDatasetIds: string[];
}

export interface CohortDefinitionDto {
  id: string;
  name: string;
  description?: string;
  domain: string;
  criteriaJson: Record<string, any>;
  sourceDatasetIds: string[];
  version: number;
  createdBy: string;
  createdAt: Date;
  updatedAt: Date;
}

export class CohortsModule {
  private asObject(value: Prisma.JsonValue | null | undefined): Record<string, unknown> {
    if (!value || typeof value !== 'object' || Array.isArray(value)) {
      return {};
    }

    return value as Record<string, unknown>;
  }

  private parseDomain(domain: string): ResearchDomain {
    const normalized = domain.trim().toUpperCase();
    if (!(normalized in ResearchDomain)) {
      throw new HttpError(400, `Invalid research domain: ${domain}`);
    }
    return normalized as ResearchDomain;
  }

  private toDto(cohort: {
    id: string;
    name: string;
    description: string | null;
    domain: ResearchDomain;
    criteriaJson: unknown;
    sourceDatasetIds: string[];
    version: number;
    createdById: string;
    createdAt: Date;
    updatedAt: Date;
  }): CohortDefinitionDto {
    return {
      id: cohort.id,
      name: cohort.name,
      description: cohort.description ?? undefined,
      domain: cohort.domain,
      criteriaJson: (cohort.criteriaJson ?? {}) as Record<string, any>,
      sourceDatasetIds: cohort.sourceDatasetIds,
      version: cohort.version,
      createdBy: cohort.createdById,
      createdAt: cohort.createdAt,
      updatedAt: cohort.updatedAt,
    };
  }

  async createCohort(dto: CreateCohortDto, userId: string): Promise<CohortDefinitionDto> {
    const domain = this.parseDomain(dto.domain);
    const datasetsCount = await prisma.dataset.count({
      where: { id: { in: dto.sourceDatasetIds } },
    });

    if (datasetsCount !== dto.sourceDatasetIds.length) {
      throw new HttpError(400, 'One or more source dataset IDs are invalid');
    }

    const cohort = await prisma.cohortDefinition.create({
      data: {
        name: dto.name,
        description: dto.description,
        domain,
        criteriaJson: dto.criteriaJson,
        sourceDatasetIds: dto.sourceDatasetIds,
        createdById: userId,
      },
    });

    return this.toDto(cohort);
  }

  async getCohortById(id: string): Promise<CohortDefinitionDto> {
    const cohort = await prisma.cohortDefinition.findUnique({ where: { id } });
    if (!cohort) {
      throw new HttpError(404, 'Cohort not found');
    }
    return this.toDto(cohort);
  }

  async listCohorts(domain?: string, limit?: number): Promise<CohortDefinitionDto[]> {
    const cohorts = await prisma.cohortDefinition.findMany({
      where: domain ? { domain: this.parseDomain(domain) } : undefined,
      orderBy: { createdAt: 'desc' },
      take: Math.min(limit ?? 50, 200),
    });

    return cohorts.map((cohort) => this.toDto(cohort));
  }

  async buildCohort(cohortId: string, datasetId: string): Promise<void> {
    const cohort = await prisma.cohortDefinition.findUnique({ where: { id: cohortId } });
    if (!cohort) {
      throw new HttpError(404, 'Cohort not found');
    }

    const dataset = await prisma.dataset.findUnique({ where: { id: datasetId }, select: { id: true } });
    if (!dataset) {
      throw new HttpError(404, 'Dataset not found');
    }

    if (!cohort.sourceDatasetIds.includes(datasetId)) {
      throw new HttpError(400, 'Dataset is not configured as a source for this cohort');
    }

    const jobId = `cohort-build-${cohortId}-${Date.now()}`;
    const criteria = this.asObject(cohort.criteriaJson as Prisma.JsonValue | null | undefined);

    await prisma.cohortDefinition.update({
      where: { id: cohortId },
      data: {
        criteriaJson: {
          ...criteria,
          __async: {
            ...(this.asObject(criteria.__async as Prisma.JsonValue | null | undefined)),
            cohortBuild: {
              jobId,
              datasetId,
              status: 'QUEUED',
              enqueuedAt: new Date().toISOString(),
            },
          },
        } as Prisma.InputJsonValue,
      },
    });

    const payload = {
      jobId,
      cohortId,
      datasetId,
    };

    try {
      if (await isRedisReachable()) {
        const processor = new CohortBuildProcessor(prisma);
        await processor.enqueueBuild(payload);
      } else {
        setTimeout(() => {
          void processCohortBuildWithoutQueue(prisma, payload).catch((error) => {
            console.error('Fallback cohort build processing failed', error);
          });
        }, 0);
      }
    } catch (error) {
      setTimeout(() => {
        void processCohortBuildWithoutQueue(prisma, payload).catch((fallbackError) => {
          console.error('Fallback cohort build processing failed', fallbackError);
        });
      }, 0);

      console.warn('Failed to enqueue cohort build in Redis; fallback processing scheduled.', error);
    }
  }
}
