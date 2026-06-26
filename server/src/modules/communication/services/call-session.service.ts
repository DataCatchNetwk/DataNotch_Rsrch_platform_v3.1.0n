import { prisma } from '../../../db/prisma.js';
import type { CallMode } from '../communication.types.js';

export class CallSessionService {
  async listActive() {
    return prisma.communicationCallSession.findMany({
      where: { status: { in: ['ACTIVE', 'WAITING'] } },
      orderBy: { startedAt: 'desc' },
    });
  }

  async startCall(input: { roomId: string; mode: CallMode; startedById: string }) {
    return prisma.communicationCallSession.create({
      data: {
        roomId: input.roomId,
        mode: input.mode,
        status: 'ACTIVE',
        startedById: input.startedById,
        signalKey: crypto.randomUUID(),
      },
    });
  }

  async getCall(callSessionId: string) {
    return prisma.communicationCallSession.findUnique({ where: { id: callSessionId } });
  }
  async endCall(callSessionId: string) {
    const call = await prisma.communicationCallSession.findUnique({ where: { id: callSessionId } });
    if (!call) return null;

    return prisma.communicationCallSession.update({
      where: { id: callSessionId },
      data: { status: 'ENDED', endedAt: new Date() },
    });
  }

  async endRoomCalls(roomId: string) {
    const result = await prisma.communicationCallSession.updateMany({
      where: { roomId, status: { in: ['ACTIVE', 'WAITING'] } },
      data: { status: 'ENDED', endedAt: new Date() },
    });
    return result.count;
  }
}

export const callSessionService = new CallSessionService();
