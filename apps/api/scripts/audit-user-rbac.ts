import 'dotenv/config';
import { prisma } from '../src/db/prisma.js';

const email = process.env.RBAC_AUDIT_EMAIL?.trim().toLowerCase();

if (!email) {
  console.error('RBAC_AUDIT_EMAIL is required.');
  process.exitCode = 1;
} else {
  const users = await prisma.user.findMany({
    where: { email },
    select: {
      id: true,
      firstname: true,
      surname: true,
      email: true,
      accountStatus: true,
      twoFactorEnabled: true,
      passwordChangedAt: true,
      lastLoginAt: true,
      createdAt: true,
      updatedAt: true,
      roles: {
        select: {
          role: {
            select: {
              name: true,
              description: true,
              permissions: {
                select: {
                  permission: {
                    select: {
                      name: true,
                    },
                  },
                },
              },
            },
          },
        },
      },
      application: {
        select: {
          id: true,
          reviewStatus: true,
          reviewedByAdminId: true,
          reviewedAt: true,
          createdAt: true,
          updatedAt: true,
        },
      },
      workspaceMemberships: {
        select: {
          workspaceId: true,
          role: true,
          createdAt: true,
        },
      },
    },
  });

  console.log(
    JSON.stringify(
      {
        normalizedEmail: email,
        duplicateCount: users.length,
        users: users.map((user) => ({
          id: user.id,
          name: `${user.firstname} ${user.surname}`.trim(),
          email: user.email,
          accountStatus: user.accountStatus,
          twoFactorEnabled: user.twoFactorEnabled,
          emailVerificationStatus: 'not modeled in Prisma User',
          passwordChangedAt: user.passwordChangedAt,
          lastLoginAt: user.lastLoginAt,
          createdAt: user.createdAt,
          updatedAt: user.updatedAt,
          roles: user.roles.map((entry) => ({
            name: entry.role.name,
            description: entry.role.description,
            permissions: entry.role.permissions.map((rolePermission) => rolePermission.permission.name).sort(),
          })),
          application: user.application,
          workspaceMemberships: user.workspaceMemberships,
        })),
      },
      null,
      2,
    ),
  );
}

await prisma.$disconnect();
