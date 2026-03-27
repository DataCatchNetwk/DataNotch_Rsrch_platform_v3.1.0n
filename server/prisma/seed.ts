import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  const adminRole = await prisma.role.upsert({
    where: { name: 'ADMIN' },
    update: {},
    create: { name: 'ADMIN', description: 'Platform administrator' },
  });

  const analystRole = await prisma.role.upsert({
    where: { name: 'ANALYST' },
    update: {},
    create: { name: 'ANALYST', description: 'Data analyst' },
  });

  for (const name of ['users.read', 'users.manage', 'health_data.read', 'health_data.write']) {
    await prisma.permission.upsert({
      where: { name },
      update: {},
      create: { name },
    });
  }

  const permissions = await prisma.permission.findMany();
  for (const p of permissions) {
    await prisma.rolePermission.upsert({
      where: { roleId_permissionId: { roleId: adminRole.id, permissionId: p.id } },
      update: {},
      create: { roleId: adminRole.id, permissionId: p.id },
    });
  }

  const analystPerm = permissions.find((permission: { name: string }) => permission.name === 'health_data.read');
  if (analystPerm) {
    await prisma.rolePermission.upsert({
      where: { roleId_permissionId: { roleId: analystRole.id, permissionId: analystPerm.id } },
      update: {},
      create: { roleId: analystRole.id, permissionId: analystPerm.id },
    });
  }

  const passwordHash = await bcrypt.hash('Admin@12345', 12);
  const admin = await prisma.user.upsert({
    where: { email: 'admin@healthplatform.local' },
    update: {},
    create: {
      firstname: 'System',
      surname: 'Admin',
      email: 'admin@healthplatform.local',
      countryCode: '+1',
      mobileNumber: '5551234567',
      passwordHash,
      dateOfBirth: new Date('1990-01-01'),
    },
  });

  await prisma.userRole.upsert({
    where: { userId_roleId: { userId: admin.id, roleId: adminRole.id } },
    update: {},
    create: { userId: admin.id, roleId: adminRole.id },
  });

  const domain = await prisma.domain.upsert({ where: { name: 'Population Health' }, update: {}, create: { name: 'Population Health' } });
  const subDomain = await prisma.subDomain.upsert({ where: { name: 'Maternal Health' }, update: {}, create: { name: 'Maternal Health', domainId: domain.id } });
  const category = await prisma.category.upsert({ where: { name: 'Outcomes' }, update: {}, create: { name: 'Outcomes', subDomainId: subDomain.id } });
  const outcome = await prisma.healthOutcome.upsert({ where: { name: 'Maternal Mortality' }, update: {}, create: { name: 'Maternal Mortality' } });
  const variable = await prisma.variable.upsert({ where: { name: 'Rate per 100,000 live births' }, update: {}, create: { name: 'Rate per 100,000 live births' } });
  const demographic = await prisma.demographic.upsert({ where: { name: 'Women 15-49' }, update: {}, create: { name: 'Women 15-49' } });
  const geography = await prisma.geographyUnit.upsert({ where: { name: 'National' }, update: {}, create: { name: 'National' } });
  const dataUnit = await prisma.dataUnit.upsert({ where: { name: 'Rate' }, update: {}, create: { name: 'Rate' } });
  const source = await prisma.dataSource.upsert({ where: { name: 'National Survey' }, update: {}, create: { name: 'National Survey' } });

  await prisma.healthData.create({
    data: {
      title: 'Seeded Maternal Mortality Record',
      dataYear: 2024,
      value: '215.3400',
      domainId: domain.id,
      subDomainId: subDomain.id,
      categoryId: category.id,
      healthOutcomeId: outcome.id,
      variableId: variable.id,
      demographicId: demographic.id,
      geographyUnitId: geography.id,
      dataUnitId: dataUnit.id,
      dataSourceId: source.id,
      notes: 'Sample seeded health data record'
    }
  }).catch(() => undefined);
}

main()
  .then(async () => prisma.$disconnect())
  .catch(async (error) => {
    console.error(error);
    await prisma.$disconnect();
    process.exit(1);
  });
