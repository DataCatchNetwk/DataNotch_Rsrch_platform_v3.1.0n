import 'dotenv/config';
import { AccountStatus, PrismaClient } from '@prisma/client';
import { randomBytes } from 'node:crypto';
import { writeFile } from 'node:fs/promises';
import { hashPassword, verifyPassword } from '../src/utils/password.js';

const prisma = new PrismaClient();

const TEST_USERS = [
  {
    email: 'test-admin@datacatch.local',
    firstname: 'Cloud',
    surname: 'Test Admin',
    countryCode: '+1',
    mobileNumber: '5559100001',
    roles: ['ADMIN', 'SUPER_ADMIN'],
  },
  {
    email: 'test-researcher@datacatch.local',
    firstname: 'Cloud',
    surname: 'Test Researcher',
    countryCode: '+1',
    mobileNumber: '5559100002',
    roles: ['ANALYST'],
  },
] as const;

type TestUserConfig = (typeof TEST_USERS)[number];

function requireGuard() {
  if (process.env.ALLOW_CLOUD_TEST_USERS !== 'true') {
    throw new Error('Refusing to run. Set ALLOW_CLOUD_TEST_USERS=true to create or clean up cloud test users.');
  }
}

function databaseHost() {
  const raw = process.env.DATABASE_URL;
  if (!raw) {
    throw new Error('DATABASE_URL is required.');
  }

  const parsed = new URL(raw);
  return {
    protocol: parsed.protocol.replace(':', ''),
    host: parsed.hostname,
    port: parsed.port || '(default)',
    database: parsed.pathname.replace(/^\//, '') || '(none)',
  };
}

function temporaryPassword() {
  return `${randomBytes(18).toString('base64url')}Aa1!`;
}

async function ensureRoles(roleNames: readonly string[]) {
  const descriptions: Record<string, string> = {
    ADMIN: 'Platform administrator',
    SUPER_ADMIN: 'Platform super administrator',
    ANALYST: 'Data analyst',
  };

  const roles = await Promise.all(
    roleNames.map((roleName) =>
      prisma.role.upsert({
        where: { name: roleName },
        update: {},
        create: { name: roleName, description: descriptions[roleName] ?? roleName },
        select: { id: true, name: true },
      }),
    ),
  );

  return new Map(roles.map((role) => [role.name, role]));
}

async function assignRoles(userId: string, roleIds: string[]) {
  await prisma.userRole.deleteMany({
    where: {
      userId,
      role: { name: { in: ['ADMIN', 'SUPER_ADMIN', 'ANALYST'] } },
    },
  });

  await Promise.all(
    roleIds.map((roleId) =>
      prisma.userRole.upsert({
        where: { userId_roleId: { userId, roleId } },
        update: {},
        create: { userId, roleId },
      }),
    ),
  );
}

async function upsertTestUser(config: TestUserConfig, roleByName: Map<string, { id: string; name: string }>) {
  const password = temporaryPassword();
  const passwordHash = await hashPassword(password);
  const user = await prisma.user.upsert({
    where: { email: config.email },
    update: {
      firstname: config.firstname,
      surname: config.surname,
      countryCode: config.countryCode,
      mobileNumber: config.mobileNumber,
      passwordHash,
      passwordChangedAt: new Date(),
      resetToken: null,
      resetTokenExpires: null,
      twoFactorEnabled: false,
      accountStatus: AccountStatus.ACTIVE,
    },
    create: {
      firstname: config.firstname,
      surname: config.surname,
      email: config.email,
      countryCode: config.countryCode,
      mobileNumber: config.mobileNumber,
      passwordHash,
      passwordChangedAt: new Date(),
      dateOfBirth: new Date('1990-01-01'),
      accountStatus: AccountStatus.ACTIVE,
    },
  });

  await assignRoles(
    user.id,
    config.roles.map((roleName) => {
      const role = roleByName.get(roleName);
      if (!role) throw new Error(`Required role disappeared while assigning: ${roleName}`);
      return role.id;
    }),
  );

  const updated = await prisma.user.findUniqueOrThrow({
    where: { id: user.id },
    select: {
      email: true,
      accountStatus: true,
      passwordHash: true,
      roles: { select: { role: { select: { name: true } } } },
    },
  });
  const passwordVerifies = await verifyPassword(password, updated.passwordHash);

  return {
    email: updated.email,
    temporaryPassword: password,
    accountStatus: updated.accountStatus,
    roles: updated.roles.map((entry) => entry.role.name).sort(),
    loginReady: passwordVerifies && updated.accountStatus === AccountStatus.ACTIVE && updated.roles.length > 0,
  };
}

async function createUsers() {
  const requiredRoles = Array.from(new Set(TEST_USERS.flatMap((user) => user.roles)));
  const roleByName = await ensureRoles(requiredRoles);

  console.log('DATABASE_TARGET', databaseHost());
  console.log('REQUIRED_ROLES_CONFIRMED', requiredRoles);
  console.log('REQUIRED_ACCOUNT_STATUS_CONFIRMED', AccountStatus.ACTIVE);
  console.log('LOGIN_CHECKS_CONFIRMED', {
    passwordHash: 'bcrypt',
    accountStatus: AccountStatus.ACTIVE,
    rolesRequired: true,
  });

  const created = [];
  for (const config of TEST_USERS) {
    created.push(await upsertTestUser(config, roleByName));
  }

  console.log('TEMPORARY_CLOUD_TEST_USER_PASSWORDS_PRINT_ONCE');
  console.log(JSON.stringify(created, null, 2));

  if (process.env.CLOUD_TEST_USER_PASSWORD_FILE) {
    await writeFile(process.env.CLOUD_TEST_USER_PASSWORD_FILE, `${JSON.stringify(created, null, 2)}\n`, { encoding: 'utf8' });
    console.log(`CREDENTIALS_FILE_WRITTEN ${process.env.CLOUD_TEST_USER_PASSWORD_FILE}`);
  }
}

async function cleanupUsers() {
  const emails = TEST_USERS.map((user) => user.email);
  console.log('DATABASE_TARGET', databaseHost());
  const result = await prisma.user.deleteMany({ where: { email: { in: emails } } });
  console.log(
    JSON.stringify(
      {
        deletedUsers: result.count,
        emails,
      },
      null,
      2,
    ),
  );
}

async function main() {
  requireGuard();
  const action = process.argv[2] ?? 'create';

  if (action === 'create') {
    await createUsers();
    return;
  }

  if (action === 'cleanup') {
    await cleanupUsers();
    return;
  }

  throw new Error(`Unknown action "${action}". Use "create" or "cleanup".`);
}

main()
  .catch((error) => {
    console.error(error instanceof Error ? error.message : error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
