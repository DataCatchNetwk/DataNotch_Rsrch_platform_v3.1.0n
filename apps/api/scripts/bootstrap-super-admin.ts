import { AccountStatus, ApplicationReviewStatus, type PrismaClient } from '@prisma/client';
import { createHash } from 'node:crypto';
import { getPrismaClient } from '../src/db/prisma.js';
import { loginUser } from '../src/services/auth.service.js';
import { hashPassword, verifyPassword } from '../src/utils/password.js';

const TARGET_EMAIL = 'donneyong.1@osu.edu';
const FIRSTNAME = 'Macarius';
const SURNAME = 'Donneyong';
const SUPER_ADMIN_ROLE = 'SUPER_ADMIN';

function normalizeEmail(email: string) {
  return email.trim().toLowerCase();
}

function requireBootstrapPassword() {
  const password = process.env.BOOTSTRAP_SUPER_ADMIN_PASSWORD;
  if (!password) {
    throw new Error('BOOTSTRAP_SUPER_ADMIN_PASSWORD is required.');
  }
  return password;
}

function databaseTarget() {
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

function stableBootstrapMobile(email: string) {
  const digits = createHash('sha256').update(email).digest('hex').replace(/[a-f]/g, '');
  return `999${digits.padEnd(7, '0').slice(0, 7)}`;
}

async function main() {
  const normalizedEmail = normalizeEmail(TARGET_EMAIL);
  const password = requireBootstrapPassword();
  const prisma = getPrismaClient();
  prismaForCleanup = prisma;

  console.log('DATABASE_TARGET', databaseTarget());

  const superAdminRole = await prisma.role.findUnique({
    where: { name: SUPER_ADMIN_ROLE },
    select: { id: true, name: true },
  });

  if (!superAdminRole) {
    throw new Error(`Required role ${SUPER_ADMIN_ROLE} does not exist. Run the approved role seed first.`);
  }

  const passwordHash = await hashPassword(password);
  const existing = await prisma.user.findUnique({
    where: { email: normalizedEmail },
    select: { id: true },
  });

  const user = await prisma.$transaction(async (tx) => {
    const updatedUser = existing
      ? await tx.user.update({
          where: { id: existing.id },
          data: {
            passwordHash,
            passwordChangedAt: new Date(),
            resetToken: null,
            resetTokenExpires: null,
            accountStatus: AccountStatus.ACTIVE,
          },
          select: { id: true, email: true, accountStatus: true },
        })
      : await tx.user.create({
          data: {
            firstname: FIRSTNAME,
            surname: SURNAME,
            email: normalizedEmail,
            countryCode: '+1',
            mobileNumber: stableBootstrapMobile(normalizedEmail),
            passwordHash,
            passwordChangedAt: new Date(),
            dateOfBirth: new Date('1990-01-01'),
            accountStatus: AccountStatus.ACTIVE,
          },
          select: { id: true, email: true, accountStatus: true },
        });

    await tx.userRole.upsert({
      where: { userId_roleId: { userId: updatedUser.id, roleId: superAdminRole.id } },
      update: {},
      create: { userId: updatedUser.id, roleId: superAdminRole.id },
    });

    await tx.researcherApplication.updateMany({
      where: { userId: updatedUser.id },
      data: {
        reviewStatus: ApplicationReviewStatus.APPROVED,
        reviewedAt: new Date(),
      },
    });

    return updatedUser;
  });

  const matches = await prisma.user.findMany({
    where: { email: normalizedEmail },
    select: {
      id: true,
      email: true,
      accountStatus: true,
      passwordHash: true,
      application: { select: { reviewStatus: true } },
      roles: { select: { role: { select: { name: true } } } },
    },
  });

  if (matches.length !== 1) {
    throw new Error(`Expected one user for ${normalizedEmail}; found ${matches.length}.`);
  }

  const verified = matches[0]!;
  const roleNames = verified.roles.map((entry) => entry.role.name).sort();
  const passwordVerifies = await verifyPassword(password, verified.passwordHash);
  if (!passwordVerifies) {
    throw new Error('Password verification failed after hashing.');
  }
  if (!roleNames.includes(SUPER_ADMIN_ROLE)) {
    throw new Error(`User is missing required role ${SUPER_ADMIN_ROLE}.`);
  }
  if (verified.accountStatus !== AccountStatus.ACTIVE) {
    throw new Error(`User accountStatus is ${verified.accountStatus}; expected ${AccountStatus.ACTIVE}.`);
  }

  let loginTest: 'PASS' | `FAIL - ${string}` = 'PASS';
  try {
    await loginUser({ identifier: normalizedEmail, password }, { userAgent: 'bootstrap-super-admin-script' });
  } catch (error) {
    loginTest = `FAIL - ${error instanceof Error ? error.message : 'unknown error'}`;
  }

  console.log(
    JSON.stringify(
      {
        email: user.email,
        action: existing ? 'promoted_existing_user' : 'created_user',
        assignedRole: SUPER_ADMIN_ROLE,
        accountStatus: verified.accountStatus,
        applicationReviewStatus: verified.application?.reviewStatus ?? null,
        passwordHashStored: Boolean(verified.passwordHash),
        normalizedEmailCount: matches.length,
        loginTest,
      },
      null,
      2,
    ),
  );
}

let prismaForCleanup: PrismaClient | null = null;

async function run() {
  await main();
}

run()
  .catch((error) => {
    console.error(error instanceof Error ? error.message : error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prismaForCleanup?.$disconnect();
  });
