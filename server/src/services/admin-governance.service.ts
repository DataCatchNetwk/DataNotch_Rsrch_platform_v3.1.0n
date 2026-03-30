import { AccessRequestStatus, AccountStatus } from '@prisma/client';
import { prisma } from '../db/prisma.js';
import { HttpError } from '../utils/errors.js';
import { logAdminAuditEvent } from './audit.service.js';
import type { BulkRoleActionDto, BulkSuspendActionDto } from './admin-governance.dto.js';

type GovernanceRole = 'USER' | 'REVIEWER' | 'STAFF' | 'ADMIN' | 'SUPER_ADMIN';
type GovernanceStatus = 'ACTIVE' | 'PENDING' | 'SUSPENDED';

type ListUsersQuery = {
  search?: string;
  role?: GovernanceRole;
  status?: GovernanceStatus;
};

function primaryGovernanceRole(roleNames: string[]): GovernanceRole {
  if (roleNames.includes('SUPER_ADMIN')) return 'SUPER_ADMIN';
  if (roleNames.includes('ADMIN')) return 'ADMIN';
  if (roleNames.includes('REVIEWER')) return 'REVIEWER';
  if (roleNames.includes('STAFF')) return 'STAFF';
  return 'USER';
}

function mapAccountStatus(status: AccountStatus): GovernanceStatus {
  if (status === 'SUSPENDED' || status === 'REJECTED') return 'SUSPENDED';
  if (status === 'PENDING_APPROVAL' || status === 'APPROVED_2FA_PENDING') return 'PENDING';
  return 'ACTIVE';
}

function formatDate(input: Date | null) {
  if (!input) return null;
  return new Intl.DateTimeFormat('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
  }).format(input);
}

async function ensureRole(name: string) {
  return prisma.role.upsert({
    where: { name },
    update: {},
    create: { name, description: `${name} governance role` },
  });
}

function storageRoleForGovernance(role: GovernanceRole) {
  return role === 'USER' ? 'ANALYST' : role;
}

export async function listGovernanceUsers(query: ListUsersQuery) {
  const users = await prisma.user.findMany({
    where: {
      ...(query.search
        ? {
            OR: [
              { firstname: { contains: query.search, mode: 'insensitive' } },
              { surname: { contains: query.search, mode: 'insensitive' } },
              { email: { contains: query.search, mode: 'insensitive' } },
            ],
          }
        : {}),
      ...(query.status
        ? {
            accountStatus:
              query.status === 'ACTIVE'
                ? AccountStatus.ACTIVE
                : query.status === 'SUSPENDED'
                  ? AccountStatus.SUSPENDED
                  : { in: [AccountStatus.PENDING_APPROVAL, AccountStatus.APPROVED_2FA_PENDING] },
          }
        : {}),
      ...(query.role
        ? {
            roles: {
              some: {
                role: {
                  name: storageRoleForGovernance(query.role),
                },
              },
            },
          }
        : {}),
    },
    include: { roles: { include: { role: true } } },
    orderBy: { createdAt: 'desc' },
  });

  return users.map((user) => {
    const roleNames = user.roles.map((entry) => entry.role.name);
    return {
      id: user.id,
      fullName: `${user.firstname} ${user.surname}`.trim(),
      email: user.email,
      role: primaryGovernanceRole(roleNames),
      status: mapAccountStatus(user.accountStatus),
      institution: user.institution,
      lastLogin: formatDate(user.lastLoginAt),
    };
  });
}

export async function updateGovernanceUserRole(actor: { id: string; roles: string[] }, userId: string, role: GovernanceRole) {
  if (!actor.roles.includes('SUPER_ADMIN')) {
    throw new HttpError(403, 'SUPER_ADMIN role required for role changes');
  }

  const user = await prisma.user.findUnique({ where: { id: userId }, include: { roles: { include: { role: true } } } });
  if (!user) throw new HttpError(404, `User ${userId} not found`);

  const targetRole = await ensureRole(storageRoleForGovernance(role));
  const oldRole = primaryGovernanceRole(user.roles.map((entry) => entry.role.name));

  await prisma.$transaction([
    prisma.userRole.deleteMany({ where: { userId } }),
    prisma.userRole.create({ data: { userId, roleId: targetRole.id } }),
  ]);

  await logAdminAuditEvent({
    actorUserId: actor.id,
    action: 'USER_ROLE_UPDATED',
    targetType: 'User',
    targetId: userId,
    severity: 'MEDIUM',
    metadata: { oldRole, newRole: role },
  });

  const items = await listGovernanceUsers({});
  const updated = items.find((item) => item.id === userId);
  if (!updated) throw new HttpError(404, `User ${userId} not found`);
  return updated;
}

export async function updateGovernanceUserStatus(actor: { id: string; roles: string[] }, userId: string, status: GovernanceStatus) {
  const nextStatus =
    status === 'ACTIVE'
      ? AccountStatus.ACTIVE
      : status === 'SUSPENDED'
        ? AccountStatus.SUSPENDED
        : AccountStatus.PENDING_APPROVAL;

  const existing = await prisma.user.findUnique({ where: { id: userId } });
  if (!existing) throw new HttpError(404, `User ${userId} not found`);

  await prisma.user.update({ where: { id: userId }, data: { accountStatus: nextStatus } });

  await logAdminAuditEvent({
    actorUserId: actor.id,
    action: 'USER_STATUS_UPDATED',
    targetType: 'User',
    targetId: userId,
    severity: 'HIGH',
    metadata: { oldStatus: existing.accountStatus, newStatus: nextStatus },
  });

  const items = await listGovernanceUsers({});
  const updated = items.find((item) => item.id === userId);
  if (!updated) throw new HttpError(404, `User ${userId} not found`);
  return updated;
}

export async function listGovernanceAccessRequests() {
  const requests = await prisma.accessRequest.findMany({
    include: { requester: true },
    orderBy: { createdAt: 'desc' },
  });

  return requests.map((item) => ({
    id: item.id,
    fullName: `${item.requester.firstname} ${item.requester.surname}`.trim(),
    email: item.requester.email,
    requestedRole: item.requestedRole as GovernanceRole,
    status: item.status,
    submittedAt: formatDate(item.createdAt) ?? '',
  }));
}

export async function approveGovernanceAccessRequest(actor: { id: string; roles: string[] }, requestId: string) {
  const request = await prisma.accessRequest.findUnique({ where: { id: requestId }, include: { requester: true } });
  if (!request) throw new HttpError(404, `Access request ${requestId} not found`);

  const targetRole = await ensureRole(storageRoleForGovernance(request.requestedRole as GovernanceRole));

  await prisma.$transaction(async (tx) => {
    await tx.accessRequest.update({
      where: { id: requestId },
      data: { status: AccessRequestStatus.APPROVED, reviewedById: actor.id, reviewedAt: new Date() },
    });

    await tx.user.update({ where: { id: request.requesterId }, data: { accountStatus: AccountStatus.ACTIVE } });
    await tx.userRole.deleteMany({ where: { userId: request.requesterId } });
    await tx.userRole.create({ data: { userId: request.requesterId, roleId: targetRole.id } });

    await tx.researcherApplication.updateMany({
      where: { userId: request.requesterId },
      data: {
        reviewStatus: 'APPROVED',
        reviewedByAdminId: actor.id,
        reviewedAt: new Date(),
      },
    });
  });

  await logAdminAuditEvent({
    actorUserId: actor.id,
    action: 'ACCESS_REQUEST_APPROVED',
    targetType: 'AccessRequest',
    targetId: requestId,
    severity: 'MEDIUM',
    metadata: { requestedRole: request.requestedRole },
  });

  const items = await listGovernanceAccessRequests();
  const updated = items.find((item) => item.id === requestId);
  if (!updated) throw new HttpError(404, `Access request ${requestId} not found`);
  return updated;
}

export async function rejectGovernanceAccessRequest(actor: { id: string; roles: string[] }, requestId: string) {
  const request = await prisma.accessRequest.findUnique({ where: { id: requestId } });
  if (!request) throw new HttpError(404, `Access request ${requestId} not found`);

  await prisma.$transaction(async (tx) => {
    await tx.accessRequest.update({
      where: { id: requestId },
      data: { status: AccessRequestStatus.REJECTED, reviewedById: actor.id, reviewedAt: new Date() },
    });

    await tx.user.update({ where: { id: request.requesterId }, data: { accountStatus: AccountStatus.REJECTED } });
    await tx.researcherApplication.updateMany({
      where: { userId: request.requesterId },
      data: {
        reviewStatus: 'REJECTED',
        reviewedByAdminId: actor.id,
        reviewedAt: new Date(),
      },
    });
  });

  await logAdminAuditEvent({
    actorUserId: actor.id,
    action: 'ACCESS_REQUEST_REJECTED',
    targetType: 'AccessRequest',
    targetId: requestId,
    severity: 'MEDIUM',
  });

  const items = await listGovernanceAccessRequests();
  const updated = items.find((item) => item.id === requestId);
  if (!updated) throw new HttpError(404, `Access request ${requestId} not found`);
  return updated;
}

export async function listGovernanceAuditEvents() {
  const events = await prisma.adminAuditEvent.findMany({
    include: { actor: true },
    orderBy: { createdAt: 'desc' },
    take: 100,
  });

  return events.map((item) => ({
    id: item.id,
    action: item.action,
    targetType: item.targetType,
    targetId: item.targetId,
    actor: item.actor ? `${item.actor.firstname} ${item.actor.surname}`.trim() || item.actor.email : 'System',
    severity: item.severity,
    createdAt: formatDate(item.createdAt) ?? '',
  }));
}

export async function bulkAssignGovernanceRole(actor: { id: string; roles: string[] }, dto: BulkRoleActionDto) {
  if (!actor.roles.includes('SUPER_ADMIN')) {
    throw new HttpError(403, 'SUPER_ADMIN role required for bulk role assignment');
  }

  const userIds = Array.from(new Set(dto.userIds));
  if (userIds.length === 0) {
    return { ok: true as const, updatedIds: [] as string[] };
  }

  const users = await prisma.user.findMany({
    where: { id: { in: userIds } },
    include: { roles: { include: { role: true } } },
  });

  const foundIds = users.map((item) => item.id);
  const missing = userIds.filter((id) => !foundIds.includes(id));
  if (missing.length > 0) {
    throw new HttpError(404, `Users not found: ${missing.join(', ')}`);
  }

  const targetRole = await ensureRole(storageRoleForGovernance(dto.role));

  await prisma.$transaction(async (tx) => {
    await tx.userRole.deleteMany({ where: { userId: { in: userIds } } });
    await tx.userRole.createMany({
      data: userIds.map((userId) => ({ userId, roleId: targetRole.id })),
      skipDuplicates: true,
    });
  });

  await Promise.all(
    users.map((user) =>
      logAdminAuditEvent({
        actorUserId: actor.id,
        action: 'USER_ROLE_BULK_UPDATED',
        targetType: 'User',
        targetId: user.id,
        severity: 'MEDIUM',
        metadata: {
          oldRole: primaryGovernanceRole(user.roles.map((entry) => entry.role.name)),
          newRole: dto.role,
          batchSize: userIds.length,
        },
      }),
    ),
  );

  return { ok: true as const, updatedIds: userIds };
}

export async function bulkSuspendGovernanceUsers(actor: { id: string; roles: string[] }, dto: BulkSuspendActionDto) {
  const userIds = Array.from(new Set(dto.userIds));
  if (userIds.length === 0) {
    return { ok: true as const, updatedIds: [] as string[] };
  }

  const users = await prisma.user.findMany({ where: { id: { in: userIds } }, select: { id: true, accountStatus: true } });
  const foundIds = users.map((item) => item.id);
  const missing = userIds.filter((id) => !foundIds.includes(id));
  if (missing.length > 0) {
    throw new HttpError(404, `Users not found: ${missing.join(', ')}`);
  }

  await prisma.user.updateMany({
    where: { id: { in: userIds } },
    data: { accountStatus: AccountStatus.SUSPENDED },
  });

  await Promise.all(
    users.map((user) =>
      logAdminAuditEvent({
        actorUserId: actor.id,
        action: 'USER_STATUS_BULK_SUSPENDED',
        targetType: 'User',
        targetId: user.id,
        severity: 'HIGH',
        metadata: {
          oldStatus: user.accountStatus,
          newStatus: AccountStatus.SUSPENDED,
          batchSize: userIds.length,
        },
      }),
    ),
  );

  return { ok: true as const, updatedIds: userIds };
}