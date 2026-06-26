import { prisma } from '../../../db/prisma.js';
import type { PresenceStatus } from '../communication.types.js';

export class PresenceService {
  async heartbeat(input: { userId: string; socketId: string; status?: PresenceStatus }) {
    return prisma.communicationPresenceHeartbeat.upsert({
      where: { userId_socketId: { userId: input.userId, socketId: input.socketId } },
      update: {
        status: input.status ?? 'ONLINE',
        lastHeartbeatAt: new Date(),
      },
      create: {
        userId: input.userId,
        socketId: input.socketId,
        status: input.status ?? 'ONLINE',
        lastHeartbeatAt: new Date(),
      },
    });
  }

  async setOfflineBySocket(socketId: string) {
    await prisma.communicationPresenceHeartbeat.updateMany({
      where: { socketId },
      data: {
        status: 'OFFLINE',
        lastHeartbeatAt: new Date(),
      },
    });
  }

  async listOnlineUsers() {
    const rows = await prisma.communicationPresenceHeartbeat.findMany({
      where: { status: { not: 'OFFLINE' } },
      distinct: ['userId'],
      select: { userId: true },
    });
    return rows.map((row) => row.userId);
  }
}

export const presenceService = new PresenceService();
