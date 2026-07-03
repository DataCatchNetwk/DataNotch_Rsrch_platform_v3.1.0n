import { PrismaClient, ResponseStatus } from '@prisma/client';
const prisma = new PrismaClient();

export async function listEvents(userId?: string, role?: string) {
  return prisma.rZoomaEvent.findMany({
    where: role === 'ADMIN' || !userId ? {} : { participants: { some: { userId } } },
    include: { participants: { include: { user: true } }, asset: true, createdBy: true },
    orderBy: { startTime: 'asc' }
  });
}

export async function createEvent(data: any) {
  const { participantIds = [], asset, ...event } = data;
  let assetRecord = null;
  if (asset) assetRecord = await prisma.researchAsset.upsert({
    where: { id: asset.id || 'missing' },
    update: asset,
    create: { type: asset.type, title: asset.title, version: asset.version }
  }).catch(async () => prisma.researchAsset.create({ data: asset }));
  return prisma.rZoomaEvent.create({
    data: {
      ...event,
      startTime: new Date(event.startTime),
      endTime: new Date(event.endTime),
      assetId: assetRecord?.id,
      rzoomaRoomUrl: event.rzoomaRoomUrl || `https://rzooma.research-platform.local/room/${crypto.randomUUID()}`,
      participants: { create: participantIds.map((userId: string) => ({ userId })) }
    },
    include: { participants: { include: { user: true } }, asset: true, createdBy: true }
  });
}

export async function respondToEvent(eventId: string, userId: string, response: ResponseStatus) {
  return prisma.rZoomaParticipant.update({ where: { eventId_userId: { eventId, userId } }, data: { response } });
}

export async function updateEventStatus(eventId: string, status: any) {
  return prisma.rZoomaEvent.update({ where: { id: eventId }, data: { status } });
}

export async function deleteEvent(eventId: string) {
  return prisma.rZoomaEvent.delete({ where: { id: eventId } });
}
