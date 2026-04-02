/**
 * Feature Store Module
 * Manages feature definitions, recipes, and materialized features
 */
import { Prisma, ResearchDomain } from '@prisma/client';
import { prisma } from '../../db/prisma.js';
import { HttpError } from '../../utils/errors.js';
import { FeatureMaterializationProcessor, processFeatureMaterializationWithoutQueue } from '../../workers/processors/feature-materialization.processor.js';
import { isRedisReachable } from '../../workers/queue.factory.js';

export interface CreateFeatureSetDto {
  name: string;
  description?: string;
  domain: string;
  recipeJson: Record<string, any>;
  validationJson?: Record<string, any>;
  cohortId?: string;
}

export interface FeatureSetDto {
  id: string;
  name: string;
  description?: string;
  domain: string;
  recipeJson: Record<string, any>;
  validationJson?: Record<string, any>;
  cohortId?: string;
  version: number;
  createdBy: string;
  createdAt: Date;
  updatedAt: Date;
}

export class FeatureStoreModule {
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

  private toDto(featureSet: {
    id: string;
    name: string;
    description: string | null;
    domain: ResearchDomain;
    recipeJson: unknown;
    validationJson: unknown;
    cohortId: string | null;
    version: number;
    createdById: string;
    createdAt: Date;
    updatedAt: Date;
  }): FeatureSetDto {
    return {
      id: featureSet.id,
      name: featureSet.name,
      description: featureSet.description ?? undefined,
      domain: featureSet.domain,
      recipeJson: (featureSet.recipeJson ?? {}) as Record<string, any>,
      validationJson: (featureSet.validationJson ?? undefined) as Record<string, any> | undefined,
      cohortId: featureSet.cohortId ?? undefined,
      version: featureSet.version,
      createdBy: featureSet.createdById,
      createdAt: featureSet.createdAt,
      updatedAt: featureSet.updatedAt,
    };
  }

  async createFeatureSet(dto: CreateFeatureSetDto, userId: string): Promise<FeatureSetDto> {
    if (dto.cohortId) {
      const cohort = await prisma.cohortDefinition.findUnique({ where: { id: dto.cohortId }, select: { id: true } });
      if (!cohort) {
        throw new HttpError(400, 'Invalid cohort ID');
      }
    }

    const featureSet = await prisma.featureSet.create({
      data: {
        name: dto.name,
        description: dto.description,
        domain: this.parseDomain(dto.domain),
        recipeJson: dto.recipeJson,
        validationJson: dto.validationJson,
        cohortId: dto.cohortId,
        createdById: userId,
      },
    });

    return this.toDto(featureSet);
  }

  async getFeatureSetById(id: string): Promise<FeatureSetDto> {
    const featureSet = await prisma.featureSet.findUnique({ where: { id } });
    if (!featureSet) {
      throw new HttpError(404, 'Feature set not found');
    }
    return this.toDto(featureSet);
  }

  async listFeatureSets(domain?: string, limit?: number): Promise<FeatureSetDto[]> {
    const featureSets = await prisma.featureSet.findMany({
      where: domain ? { domain: this.parseDomain(domain) } : undefined,
      orderBy: { createdAt: 'desc' },
      take: Math.min(limit ?? 50, 200),
    });

    return featureSets.map((featureSet) => this.toDto(featureSet));
  }

  async materializeFeatures(featureSetId: string, cohortId: string): Promise<void> {
    const featureSet = await prisma.featureSet.findUnique({ where: { id: featureSetId } });
    if (!featureSet) {
      throw new HttpError(404, 'Feature set not found');
    }

    const cohort = await prisma.cohortDefinition.findUnique({ where: { id: cohortId }, select: { id: true } });
    if (!cohort) {
      throw new HttpError(404, 'Cohort not found');
    }

    if (featureSet.cohortId && featureSet.cohortId !== cohortId) {
      throw new HttpError(400, 'Feature set is bound to a different cohort');
    }

    const jobId = `feature-materialize-${featureSetId}-${Date.now()}`;
    const validation = this.asObject(featureSet.validationJson as Prisma.JsonValue | null | undefined);

    await prisma.featureSet.update({
      where: { id: featureSetId },
      data: {
        validationJson: {
          ...validation,
          __async: {
            ...(this.asObject(validation.__async as Prisma.JsonValue | null | undefined)),
            materialization: {
              jobId,
              cohortId,
              status: 'QUEUED',
              enqueuedAt: new Date().toISOString(),
            },
          },
        } as Prisma.InputJsonValue,
      },
    });

    const payload = {
      jobId,
      featureSetId,
      cohortId,
    };

    try {
      if (await isRedisReachable()) {
        const processor = new FeatureMaterializationProcessor(prisma);
        await processor.enqueueMaterialization(payload);
      } else {
        setTimeout(() => {
          void processFeatureMaterializationWithoutQueue(prisma, payload).catch((error) => {
            console.error('Fallback feature materialization processing failed', error);
          });
        }, 0);
      }
    } catch (error) {
      setTimeout(() => {
        void processFeatureMaterializationWithoutQueue(prisma, payload).catch((fallbackError) => {
          console.error('Fallback feature materialization processing failed', fallbackError);
        });
      }, 0);

      console.warn('Failed to enqueue feature materialization in Redis; fallback processing scheduled.', error);
    }
  }
}
