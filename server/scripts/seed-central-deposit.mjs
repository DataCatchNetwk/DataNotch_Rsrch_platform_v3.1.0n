import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function run() {
  const existingCount = await prisma.dataset.count({
    where: {
      isDepositListed: true,
      depositStatus: 'AVAILABLE',
    },
  });

  if (existingCount > 0) {
    console.log(`Central repository already has ${existingCount} dataset(s).`);
    return;
  }

  const candidates = await prisma.dataset.findMany({
    where: { isDepositListed: false },
    orderBy: { updatedAt: 'desc' },
    take: 5,
  });

  if (!candidates.length) {
    const workspace = await prisma.workspace.findFirst({ orderBy: { createdAt: 'asc' } });
    const user = await prisma.user.findFirst({ orderBy: { createdAt: 'asc' } });

    if (!workspace || !user) {
      console.log('No datasets, users, or workspaces available to seed central repository.');
      return;
    }

    await prisma.dataset.create({
      data: {
        name: 'Central Sample Health Indicators',
        description: 'Sample central-deposit dataset for preview, favorite, and pull workflows.',
        version: 1,
        visibility: 'PUBLIC',
        tags: ['sample', 'health', 'central-deposit'],
        workspaceId: workspace.id,
        createdById: user.id,
        domain: 'HEALTH',
        category: 'Public Health',
        sourceName: 'DataNotch Seed',
        sourceUrl: 'https://example.org/seed/health',
        accessLevel: 'OPEN',
        isFeatured: true,
        isDepositListed: true,
        depositStatus: 'AVAILABLE',
        schemaJson: [
          { name: 'state', type: 'string' },
          { name: 'year', type: 'integer' },
          { name: 'indicator', type: 'string' },
          { name: 'value', type: 'number' }
        ],
        previewRowsJson: [
          { state: 'MD', year: 2024, indicator: 'prevalence', value: 11.2 },
          { state: 'VA', year: 2024, indicator: 'prevalence', value: 10.8 },
          { state: 'PA', year: 2024, indicator: 'prevalence', value: 10.5 }
        ],
        metadataJson: {
          license: 'Open Data',
          refreshCadence: 'Monthly',
          provenance: 'Seeded sample data'
        },
        recordCount: 3,
        columnCount: 4,
        publishedAt: new Date(),
      },
    });

    console.log('Created seeded central repository dataset.');
    return;
  }

  const ids = candidates.map((dataset) => dataset.id);

  await prisma.dataset.updateMany({
    where: { id: { in: ids } },
    data: {
      isDepositListed: true,
      depositStatus: 'AVAILABLE',
      accessLevel: 'OPEN',
      domain: 'OTHER',
      isFeatured: true,
      publishedAt: new Date(),
    },
  });

  console.log(`Published ${ids.length} dataset(s) into central repository.`);
}

run()
  .catch((error) => {
    console.error(error instanceof Error ? error.message : String(error));
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
