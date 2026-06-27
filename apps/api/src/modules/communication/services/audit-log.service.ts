import { prisma } from '../../../db/prisma.js';
import type { Prisma } from '@prisma/client';
import type { CommunicationAuditLog } from '../communication.types.js';

export class AuditLogService {
  async create(entry: Omit<CommunicationAuditLog, 'id' | 'createdAt'>) {
    return prisma.communicationAuditLog.create({
      data: {
        actorUserId: entry.actorUserId,
        roomId: entry.roomId,
        callSessionId: entry.callSessionId,
        action: entry.action,
        metadataJson: entry.metadataJson as Prisma.InputJsonValue | undefined,
      },
    });
  }

  async list(limit = 100) {
    return prisma.communicationAuditLog.findMany({
      orderBy: { createdAt: 'desc' },
      take: Math.min(limit, 500),
    });
  }
}

export const auditLogService = new AuditLogService();
