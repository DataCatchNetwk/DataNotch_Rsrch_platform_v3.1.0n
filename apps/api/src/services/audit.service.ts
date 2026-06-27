import { prisma } from '../db/prisma.js';

export async function logAudit(params: {
  userId?: string;
  action: string;
  entity: string;
  entityId?: string;
  metadata?: unknown;
}) {
  await prisma.auditLog.create({
    data: {
      userId: params.userId,
      action: params.action,
      entity: params.entity,
      entityId: params.entityId,
      metadata: params.metadata as never,
    },
  });
}

export async function logAdminAuditEvent(params: {
  actorUserId?: string;
  action: string;
  targetType: string;
  targetId: string;
  severity?: 'LOW' | 'MEDIUM' | 'HIGH';
  metadata?: unknown;
}) {
  await prisma.adminAuditEvent.create({
    data: {
      actorUserId: params.actorUserId,
      action: params.action,
      targetType: params.targetType,
      targetId: params.targetId,
      severity: params.severity ?? 'MEDIUM',
      metadataJson: params.metadata as never,
    },
  });
}
