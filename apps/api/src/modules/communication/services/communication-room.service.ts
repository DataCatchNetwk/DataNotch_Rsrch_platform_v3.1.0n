import type { CommunicationParticipantRole, CommunicationRoomType, CommunicationVisibility } from '../communication.types.js';
import { prisma } from '../../../db/prisma.js';

export class CommunicationRoomService {
  async listRooms(userId: string, roles: string[]) {
    const isAdmin = roles.includes('ADMIN') || roles.includes('SUPER_ADMIN');
    return prisma.communicationRoom.findMany({
      where: isAdmin
        ? undefined
        : {
            OR: [
              { createdById: userId },
              { participants: { some: { userId } } },
            ],
          },
      orderBy: { updatedAt: 'desc' },
    });
  }

  async getRoom(roomId: string) {
    return prisma.communicationRoom.findUnique({ where: { id: roomId } });
  }

  async createRoom(input: {
    name: string;
    type: CommunicationRoomType;
    visibility?: CommunicationVisibility;
    workspaceId?: string;
    createdById: string;
  }) {
    const room = await prisma.communicationRoom.create({
      data: {
        name: input.name,
        type: input.type,
        visibility: input.visibility ?? 'PRIVATE',
        workspaceId: input.workspaceId,
        createdById: input.createdById,
      },
    });

    await this.upsertParticipant({ roomId: room.id, userId: input.createdById, role: 'OWNER', isOnline: true });

    return room;
  }

  async listParticipants(roomId: string) {
    return prisma.communicationParticipant.findMany({
      where: { roomId },
      orderBy: { joinedAt: 'asc' },
    });
  }

  async upsertParticipant(input: {
    roomId: string;
    userId: string;
    role?: CommunicationParticipantRole;
    isOnline?: boolean;
  }) {
    return prisma.communicationParticipant.upsert({
      where: { roomId_userId: { roomId: input.roomId, userId: input.userId } },
      update: {
        role: input.role,
        isOnline: input.isOnline,
        lastSeenAt: new Date(),
      },
      create: {
        roomId: input.roomId,
        userId: input.userId,
        role: input.role ?? 'MEMBER',
        isOnline: input.isOnline ?? true,
        lastSeenAt: new Date(),
      },
    });
  }

  async setParticipantOnline(roomId: string, userId: string, isOnline: boolean) {
    return this.upsertParticipant({ roomId, userId, isOnline });
  }

  async removeParticipant(roomId: string, userId: string) {
    const result = await prisma.communicationParticipant.deleteMany({ where: { roomId, userId } });
    return result.count > 0;
  }

  async canAccessRoom(roomId: string, userId: string, roles: string[]) {
    if (roles.includes('ADMIN') || roles.includes('SUPER_ADMIN')) return true;

    const participant = await prisma.communicationParticipant.findUnique({
      where: { roomId_userId: { roomId, userId } },
      select: { id: true },
    });
    if (participant) return true;

    const room = await prisma.communicationRoom.findUnique({
      where: { id: roomId },
      select: { createdById: true, visibility: true },
    });

    if (!room) return false;
    return room.createdById === userId || room.visibility === 'ORG';
  }

  async canModerateRoom(roomId: string, userId: string, roles: string[]) {
    if (roles.includes('ADMIN') || roles.includes('SUPER_ADMIN')) return true;

    const participant = await prisma.communicationParticipant.findUnique({
      where: { roomId_userId: { roomId, userId } },
      select: { role: true },
    });

    return participant?.role === 'OWNER' || participant?.role === 'MODERATOR';
  }
}

export const communicationRoomService = new CommunicationRoomService();
