import { Router } from 'express';
import { prisma } from '../db/prisma.js';
import { authenticate } from '../middleware/authenticate.js';
import { authorize } from '../middleware/authorize.js';
import { asyncHandler } from '../utils/async-handler.js';
import { communicationRoomService } from '../modules/communication/services/communication-room.service.js';
import { callSessionService } from '../modules/communication/services/call-session.service.js';
import { messageService } from '../modules/communication/services/message.service.js';
import { presenceService } from '../modules/communication/services/presence.service.js';
import { auditLogService } from '../modules/communication/services/audit-log.service.js';

const router = Router();

router.use(authenticate, authorize('ADMIN', 'SUPER_ADMIN'));

type RoomResponse = {
  id: string;
  name: string;
  mode: 'AUDIO' | 'VIDEO' | 'EMAIL';
  status: 'ACTIVE' | 'ENDED' | 'FAILED';
  targetUserId: string | null;
  startedAt: string;
  endedAt: string | null;
};

async function mapRoom(roomId: string): Promise<RoomResponse | null> {
  const room = await prisma.communicationRoom.findUnique({
    where: { id: roomId },
    include: {
      participants: true,
      callSessions: { orderBy: { startedAt: 'desc' }, take: 1 },
    },
  });

  if (!room) {
    return null;
  }

  const lastCall = room.callSessions[0];
  const mode: RoomResponse['mode'] =
    room.type === 'CHANNEL' ? 'EMAIL' : lastCall?.mode === 'VIDEO' ? 'VIDEO' : 'AUDIO';

  const status: RoomResponse['status'] =
    lastCall?.status === 'FAILED'
      ? 'FAILED'
      : lastCall && (lastCall.status === 'ACTIVE' || lastCall.status === 'WAITING')
        ? 'ACTIVE'
        : 'ENDED';

  const targetUserId = room.participants.find((p) => p.role !== 'OWNER')?.userId ?? null;

  return {
    id: room.id,
    name: room.name,
    mode,
    status,
    targetUserId,
    startedAt: (lastCall?.startedAt ?? room.createdAt).toISOString(),
    endedAt: lastCall?.endedAt ? lastCall.endedAt.toISOString() : null,
  };
}

router.get(
  '/users',
  asyncHandler(async (req, res) => {
    const q = String(req.query.q ?? '').trim();

    const users = await prisma.user.findMany({
      where: q
        ? {
            OR: [
              { firstname: { contains: q, mode: 'insensitive' } },
              { surname: { contains: q, mode: 'insensitive' } },
              { email: { contains: q, mode: 'insensitive' } },
              { mobileNumber: { contains: q, mode: 'insensitive' } },
            ],
          }
        : undefined,
      select: {
        id: true,
        firstname: true,
        surname: true,
        email: true,
        mobileNumber: true,
        accountStatus: true,
        roles: { select: { role: true } },
      },
      orderBy: [{ firstname: 'asc' }, { surname: 'asc' }],
      take: 50,
    });

    res.json(
      users.map((u) => ({
        id: u.id,
        fullName: `${u.firstname} ${u.surname}`.trim(),
        email: u.email,
        phone: u.mobileNumber,
        role: u.roles[0]?.role ?? 'USER',
        status: u.accountStatus,
      }))
    );
  })
);

router.get(
  '/rooms',
  asyncHandler(async (_req, res) => {
    const rooms = await prisma.communicationRoom.findMany({
      orderBy: { updatedAt: 'desc' },
      take: 100,
      select: { id: true },
    });

    const mapped = (await Promise.all(rooms.map((r) => mapRoom(r.id)))).filter((r): r is RoomResponse => Boolean(r));
    res.json(mapped);
  })
);

router.get(
  '/stats',
  asyncHandler(async (_req, res) => {
    const [activeCalls, activeVideoRooms, activeEmailRooms, onlineUsers, failedAttempts, flaggedSessions] = await Promise.all([
      prisma.communicationCallSession.count({ where: { mode: 'AUDIO', status: { in: ['ACTIVE', 'WAITING'] } } }),
      prisma.communicationCallSession.count({ where: { mode: 'VIDEO', status: { in: ['ACTIVE', 'WAITING'] } } }),
      prisma.communicationRoom.count({ where: { type: 'CHANNEL' } }),
      presenceService.listOnlineUsers().then((list) => list.length),
      prisma.communicationAuditLog.count({ where: { action: { contains: 'FAIL' } } }),
      prisma.communicationAuditLog.count({ where: { action: { contains: 'FLAG' } } }),
    ]);

    res.json({
      activeCalls,
      activeVideoRooms,
      onlineUsers,
      unreadMessages: activeEmailRooms,
      failedAttempts,
      flaggedSessions,
    });
  })
);

router.post(
  '/audio/start',
  asyncHandler(async (req, res) => {
    const userId = String(req.body?.userId ?? '');
    const contactMethod = req.body?.contactMethod === 'EMAIL' ? 'EMAIL' : 'PHONE';
    const adminId = req.user?.id;

    if (!adminId) {
      return res.status(401).json({ message: 'Authentication required' });
    }

    const target = await prisma.user.findUnique({ where: { id: userId } });
    if (!target) {
      return res.status(404).json({ message: 'Registered user not found.' });
    }

    if (contactMethod === 'PHONE' && !target.mobileNumber) {
      return res.status(400).json({ message: 'Selected user has no phone number on file.' });
    }

    const room = await communicationRoomService.createRoom({
      name: `R-MEET Audio - ${target.firstname} ${target.surname}`.trim(),
      type: 'CALL_ROOM',
      visibility: 'ORG',
      createdById: adminId,
    });

    await communicationRoomService.upsertParticipant({ roomId: room.id, userId: target.id, role: 'MEMBER', isOnline: false });
    await callSessionService.startCall({ roomId: room.id, mode: 'AUDIO', startedById: adminId });

    await auditLogService.create({
      actorUserId: adminId,
      roomId: room.id,
      action: 'CONTACT_RULE_AUDIO_STARTED',
      metadataJson: { contactMethod, targetUserId: target.id },
    });

    const mapped = await mapRoom(room.id);
    return res.status(201).json(mapped);
  })
);

router.post(
  '/video/invite',
  asyncHandler(async (req, res) => {
    const userId = String(req.body?.userId ?? '');
    const topic = String(req.body?.topic ?? 'R-ZOOMA Admin Video Room');
    const adminId = req.user?.id;

    if (!adminId) {
      return res.status(401).json({ message: 'Authentication required' });
    }

    const target = await prisma.user.findUnique({ where: { id: userId } });
    if (!target) {
      return res.status(404).json({ message: 'Registered user not found.' });
    }

    if (!target.email) {
      return res.status(400).json({ message: 'R-ZOOMA requires registered email on file.' });
    }

    const room = await communicationRoomService.createRoom({
      name: topic,
      type: 'CALL_ROOM',
      visibility: 'ORG',
      createdById: adminId,
    });

    await communicationRoomService.upsertParticipant({ roomId: room.id, userId: target.id, role: 'MEMBER', isOnline: false });
    await callSessionService.startCall({ roomId: room.id, mode: 'VIDEO', startedById: adminId });

    await auditLogService.create({
      actorUserId: adminId,
      roomId: room.id,
      action: 'CONTACT_RULE_VIDEO_INVITED',
      metadataJson: { targetUserId: target.id, email: target.email, topic },
    });

    const mapped = await mapRoom(room.id);
    return res.status(201).json(mapped);
  })
);

router.post(
  '/messages/email',
  asyncHandler(async (req, res) => {
    const userId = String(req.body?.userId ?? '');
    const subject = String(req.body?.subject ?? '').trim();
    const body = String(req.body?.body ?? '').trim();
    const adminId = req.user?.id;

    if (!adminId) {
      return res.status(401).json({ message: 'Authentication required' });
    }

    if (!subject || !body) {
      return res.status(400).json({ message: 'subject and body are required' });
    }

    const target = await prisma.user.findUnique({ where: { id: userId } });
    if (!target) {
      return res.status(404).json({ message: 'Registered user not found.' });
    }

    if (!target.email) {
      return res.status(400).json({ message: 'Messaging requires registered email on file.' });
    }

    const room = await communicationRoomService.createRoom({
      name: `Messaging - ${target.firstname} ${target.surname}`.trim(),
      type: 'CHANNEL',
      visibility: 'PRIVATE',
      createdById: adminId,
    });

    await communicationRoomService.upsertParticipant({ roomId: room.id, userId: target.id, role: 'MEMBER', isOnline: false });

    const message = await messageService.sendMessage({
      roomId: room.id,
      senderId: adminId,
      senderName: req.user?.email ?? 'Admin',
      body: `Subject: ${subject}\n\n${body}`,
    });

    await auditLogService.create({
      actorUserId: adminId,
      roomId: room.id,
      action: 'CONTACT_RULE_EMAIL_SENT',
      metadataJson: { targetUserId: target.id, email: target.email, subject },
    });

    return res.status(201).json({ ok: true, eventId: message.id });
  })
);

router.post(
  '/rooms/:roomId/end',
  asyncHandler(async (req, res) => {
    const roomId = String(req.params.roomId);
    const adminId = req.user?.id;

    if (!adminId) {
      return res.status(401).json({ message: 'Authentication required' });
    }

    const room = await prisma.communicationRoom.findUnique({ where: { id: roomId } });
    if (!room) {
      return res.status(404).json({ message: 'Room not found.' });
    }

    await callSessionService.endRoomCalls(roomId);
    await auditLogService.create({
      actorUserId: adminId,
      roomId,
      action: 'CONTACT_RULE_ROOM_ENDED',
    });

    const mapped = await mapRoom(roomId);
    if (!mapped) {
      return res.status(404).json({ message: 'Room not found.' });
    }

    return res.json({ ...mapped, status: 'ENDED' as const, endedAt: new Date().toISOString() });
  })
);

export default router;
