import { AccessRequestStatus, AccountStatus, ApprovalDecisionReasonType } from '@prisma/client';
import { prisma } from '../db/prisma.js';
import { HttpError } from '../utils/errors.js';
import { assertPermission, resolvePolicyRole } from './admin-policy.service.js';
import { logAdminAuditEvent } from './audit.service.js';
import type { ApprovalDecisionDto, BulkRoleActionDto, BulkStatusActionDto, GovernanceRole } from './admin-policy.dto.js';

function storageRoleForGovernance(role: GovernanceRole) {
  return role === 'USER' ? 'ANALYST' : role;
}

function accountStatusForGovernance(status: 'ACTIVE' | 'PENDING' | 'SUSPENDED') {
  if (status === 'ACTIVE') return AccountStatus.ACTIVE;
  if (status === 'SUSPENDED') return AccountStatus.SUSPENDED;
  return AccountStatus.PENDING_APPROVAL;
}

async function ensureRole(name: string) {
  return prisma.role.upsert({
    where: { name },
    update: {},
    create: { name, description: `${name} governance role` },
  });
}

function escapeCsv(value: unknown) {
  const raw = String(value ?? '');
  return `"${raw.replace(/"/g, '""')}"`;
}

export async function bulkRoleUpdate(actor: { id: string; roles: string[] }, body: BulkRoleActionDto) {
  assertPermission(actor.roles, 'bulk_update_roles');

  const actorRole = resolvePolicyRole(actor.roles);
  if ((body.role === 'ADMIN' || body.role === 'SUPER_ADMIN') && actorRole !== 'SUPER_ADMIN') {
    assertPermission(actor.roles, 'assign_admin_role');
  }

  const userIds = Array.from(new Set(body.userIds));
  if (userIds.includes(actor.id)) {
    throw new HttpError(400, 'Bulk role update cannot include your own account');
  }

  const users = await prisma.user.findMany({ where: { id: { in: userIds } }, select: { id: true } });
  const found = users.map((item) => item.id);
  const missing = userIds.filter((id) => !found.includes(id));
  if (missing.length > 0) throw new HttpError(404, `Users not found: ${missing.join(', ')}`);

  const targetRole = await ensureRole(storageRoleForGovernance(body.role));

  await prisma.$transaction(async (tx) => {
    await tx.userRole.deleteMany({ where: { userId: { in: userIds } } });
    await tx.userRole.createMany({
      data: userIds.map((userId) => ({ userId, roleId: targetRole.id })),
      skipDuplicates: true,
    });
  });

  await Promise.all(
    userIds.map((userId) =>
      logAdminAuditEvent({
        actorUserId: actor.id,
        action: 'BULK_USER_ROLE_UPDATED',
        targetType: 'User',
        targetId: userId,
        severity: 'HIGH',
        metadata: { newRole: body.role, reason: body.reason },
      }),
    ),
  );

  return { ok: true as const, updatedIds: userIds };
}

export async function bulkStatusUpdate(actor: { id: string; roles: string[] }, body: BulkStatusActionDto) {
  assertPermission(actor.roles, 'bulk_suspend_users');

  const userIds = Array.from(new Set(body.userIds));
  if (userIds.includes(actor.id)) {
    throw new HttpError(400, 'Bulk status update cannot include your own account');
  }

  const users = await prisma.user.findMany({
    where: { id: { in: userIds } },
    select: { id: true, roles: { select: { role: { select: { name: true } } } } },
  });
  const found = users.map((item) => item.id);
  const missing = userIds.filter((id) => !found.includes(id));
  if (missing.length > 0) throw new HttpError(404, `Users not found: ${missing.join(', ')}`);

  if (!actor.roles.includes('SUPER_ADMIN')) {
    const protectedIds = users
      .filter((item) => item.roles.some((entry) => entry.role.name === 'SUPER_ADMIN'))
      .map((item) => item.id);
    if (protectedIds.length > 0) {
      throw new HttpError(403, `Only SUPER_ADMIN can update SUPER_ADMIN users: ${protectedIds.join(', ')}`);
    }
  }

  const nextStatus = accountStatusForGovernance(body.status);

  await prisma.user.updateMany({
    where: { id: { in: userIds } },
    data: { accountStatus: nextStatus },
  });

  await Promise.all(
    userIds.map((userId) =>
      logAdminAuditEvent({
        actorUserId: actor.id,
        action: 'BULK_USER_STATUS_UPDATED',
        targetType: 'User',
        targetId: userId,
        severity: 'HIGH',
        metadata: { newStatus: body.status, reason: body.reason },
      }),
    ),
  );

  return { ok: true as const, updatedIds: userIds };
}

export async function approveRegistration(
  actor: { id: string; roles: string[] },
  requestId: string,
  body: ApprovalDecisionDto,
) {
  assertPermission(actor.roles, 'approve_access_request');

  const accessRequest = await prisma.accessRequest.findUnique({
    where: { id: requestId },
    include: { requester: true },
  });
  if (!accessRequest) throw new HttpError(404, `Access request ${requestId} not found`);

  const requestedRole = (body.assignRole ?? (accessRequest.requestedRole as GovernanceRole));
  const actorRole = resolvePolicyRole(actor.roles);
  if ((requestedRole === 'ADMIN' || requestedRole === 'SUPER_ADMIN') && actorRole !== 'SUPER_ADMIN') {
    assertPermission(actor.roles, 'assign_admin_role');
  }

  const targetRole = await ensureRole(storageRoleForGovernance(requestedRole));

  await prisma.$transaction(async (tx) => {
    await tx.accessRequest.update({
      where: { id: requestId },
      data: {
        status: AccessRequestStatus.APPROVED,
        reviewedById: actor.id,
        reviewedAt: new Date(),
      },
    });

    await tx.approvalDecisionReason.create({
      data: {
        accessRequestId: requestId,
        actorUserId: actor.id,
        decisionType: ApprovalDecisionReasonType.APPROVED,
        reason: body.reason,
      },
    });

    await tx.user.update({
      where: { id: accessRequest.requesterId },
      data: { accountStatus: AccountStatus.ACTIVE },
    });

    await tx.userRole.deleteMany({ where: { userId: accessRequest.requesterId } });
    await tx.userRole.create({ data: { userId: accessRequest.requesterId, roleId: targetRole.id } });

    await tx.researcherApplication.updateMany({
      where: { userId: accessRequest.requesterId },
      data: {
        reviewStatus: 'APPROVED',
        reviewedByAdminId: actor.id,
        reviewedAt: new Date(),
        adminReviewNotes: body.reason,
      },
    });
  });

  await logAdminAuditEvent({
    actorUserId: actor.id,
    action: 'REGISTRATION_APPROVED',
    targetType: 'AccessRequest',
    targetId: requestId,
    severity: 'MEDIUM',
    metadata: { reason: body.reason, assignedRole: requestedRole },
  });

  return { ok: true as const, requestId, status: 'APPROVED' as const, assignedRole: requestedRole };
}

export async function rejectRegistration(
  actor: { id: string; roles: string[] },
  requestId: string,
  body: ApprovalDecisionDto,
) {
  assertPermission(actor.roles, 'reject_access_request');

  const accessRequest = await prisma.accessRequest.findUnique({ where: { id: requestId } });
  if (!accessRequest) throw new HttpError(404, `Access request ${requestId} not found`);

  await prisma.$transaction(async (tx) => {
    await tx.accessRequest.update({
      where: { id: requestId },
      data: {
        status: AccessRequestStatus.REJECTED,
        reviewedById: actor.id,
        reviewedAt: new Date(),
      },
    });

    await tx.approvalDecisionReason.create({
      data: {
        accessRequestId: requestId,
        actorUserId: actor.id,
        decisionType: ApprovalDecisionReasonType.REJECTED,
        reason: body.reason,
      },
    });

    await tx.user.update({
      where: { id: accessRequest.requesterId },
      data: { accountStatus: AccountStatus.REJECTED },
    });

    await tx.researcherApplication.updateMany({
      where: { userId: accessRequest.requesterId },
      data: {
        reviewStatus: 'REJECTED',
        reviewedByAdminId: actor.id,
        reviewedAt: new Date(),
        adminReviewNotes: body.reason,
      },
    });
  });

  await logAdminAuditEvent({
    actorUserId: actor.id,
    action: 'REGISTRATION_REJECTED',
    targetType: 'AccessRequest',
    targetId: requestId,
    severity: 'MEDIUM',
    metadata: { reason: body.reason },
  });

  return { ok: true as const, requestId, status: 'REJECTED' as const };
}

export async function exportAuditEvents(actor: { roles: string[] }) {
  assertPermission(actor.roles, 'export_audit_events');

  const events = await prisma.adminAuditEvent.findMany({
    include: { actor: { select: { firstname: true, surname: true, email: true } } },
    orderBy: { createdAt: 'desc' },
    take: 500,
  });

  const rows = [
    ['id', 'action', 'targetType', 'targetId', 'severity', 'actor', 'createdAt'],
    ...events.map((event) => [
      event.id,
      event.action,
      event.targetType,
      event.targetId,
      event.severity,
      event.actor ? `${event.actor.firstname} ${event.actor.surname}`.trim() || event.actor.email : 'System',
      event.createdAt.toISOString(),
    ]),
  ];

  return rows.map((row) => row.map(escapeCsv).join(',')).join('\n');
}
