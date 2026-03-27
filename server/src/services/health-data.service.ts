import { prisma } from '../db/prisma.js';
import { HttpError } from '../utils/errors.js';
import { logAudit } from './audit.service.js';

export async function listHealthData() {
  return prisma.healthData.findMany({
    orderBy: { createdAt: 'desc' },
    include: {
      domain: true,
      subDomain: true,
      category: true,
      healthOutcome: true,
      variable: true,
      demographic: true,
      geographyUnit: true,
      dataUnit: true,
      dataSource: true,
    },
  });
}

export async function getHealthDataById(id: string) {
  const record = await prisma.healthData.findUnique({
    where: { id },
    include: {
      domain: true,
      subDomain: true,
      category: true,
      subCategory: true,
      healthOutcome: true,
      variable: true,
      demographic: true,
      geographyUnit: true,
      dataUnit: true,
      dataSource: true,
      dataPortal: true,
      dataFormat: true,
      dataLocation: true,
    },
  });

  if (!record) throw new HttpError(404, 'Health data not found');
  return record;
}

export async function createHealthData(userId: string, input: {
  title: string;
  data_year: number;
  value?: number;
  notes?: string;
  domain_id: string;
  subdomain_id: string;
  category_id: string;
  subcategory_id?: string;
  health_outcome_id: string;
  variable_id: string;
  demographic_id: string;
  geography_unit_id: string;
  data_unit_id: string;
  data_source_id: string;
  data_portal_id?: string;
  data_format_id?: string;
  data_location_id?: string;
}) {
  const created = await prisma.healthData.create({
    data: {
      title: input.title,
      dataYear: input.data_year,
      value: input.value,
      notes: input.notes,
      domainId: input.domain_id,
      subDomainId: input.subdomain_id,
      categoryId: input.category_id,
      subCategoryId: input.subcategory_id,
      healthOutcomeId: input.health_outcome_id,
      variableId: input.variable_id,
      demographicId: input.demographic_id,
      geographyUnitId: input.geography_unit_id,
      dataUnitId: input.data_unit_id,
      dataSourceId: input.data_source_id,
      dataPortalId: input.data_portal_id,
      dataFormatId: input.data_format_id,
      dataLocationId: input.data_location_id,
    },
  });

  await logAudit({ userId, action: 'CREATE', entity: 'HealthData', entityId: created.id });
  return created;
}
