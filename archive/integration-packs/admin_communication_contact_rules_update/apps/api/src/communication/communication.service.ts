import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function sendEmail(to: string, subject: string, body: string) {
  // Replace with SendGrid, SES, Resend, SMTP, or internal mail service.
  console.log(`[EMAIL] to=${to} subject=${subject}\n${body}`);
  return { ok: true };
}

async function placeAudioCall(target: { phone?: string | null; email: string }, method: 'PHONE' | 'EMAIL') {
  // Replace with Twilio/VoIP/WebRTC signaling integration.
  console.log(`[R-MEET] method=${method} target=${method === 'PHONE' ? target.phone : target.email}`);
  return { ok: true };
}

export const communicationService = {
  async listUsers(query = '') {
    const where = query
      ? {
          OR: [
            { fullName: { contains: query, mode: 'insensitive' as const } },
            { email: { contains: query, mode: 'insensitive' as const } },
            { phone: { contains: query, mode: 'insensitive' as const } },
          ],
        }
      : {};

    return prisma.platformUserContact.findMany({ where, orderBy: { fullName: 'asc' }, take: 50 });
  },

  async listRooms() {
    return prisma.communicationRoom.findMany({ orderBy: { startedAt: 'desc' }, take: 100 });
  },

  async stats() {
    const [activeCalls, activeVideoRooms, emailRooms] = await Promise.all([
      prisma.communicationRoom.count({ where: { mode: 'AUDIO', status: 'ACTIVE' } }),
      prisma.communicationRoom.count({ where: { mode: 'VIDEO', status: 'ACTIVE' } }),
      prisma.communicationRoom.count({ where: { mode: 'EMAIL', status: 'ACTIVE' } }),
    ]);
    return {
      activeCalls,
      activeVideoRooms,
      onlineUsers: 2,
      unreadMessages: emailRooms,
      failedAttempts: 0,
      flaggedSessions: 0,
    };
  },

  async startAudio(userId: string, contactMethod: 'PHONE' | 'EMAIL', adminId = 'admin') {
    const user = await prisma.platformUserContact.findUnique({ where: { id: userId } });
    if (!user) throw new Error('Registered user not found.');
    if (contactMethod === 'PHONE' && !user.phone) throw new Error('User has no phone number on file.');

    await placeAudioCall(user, contactMethod);

    const room = await prisma.communicationRoom.create({
      data: {
        name: `R-MEET Audio - ${user.fullName}`,
        mode: 'AUDIO',
        status: 'ACTIVE',
        createdBy: adminId,
        targetUserId: user.id,
      },
    });

    await prisma.communicationEvent.create({
      data: {
        roomId: room.id,
        userId: user.id,
        type: 'AUDIO_STARTED',
        channel: contactMethod,
        payload: { contactMethod },
      },
    });

    return room;
  },

  async inviteVideo(userId: string, topic = 'R-ZOOMA Admin Video Room', adminId = 'admin') {
    const user = await prisma.platformUserContact.findUnique({ where: { id: userId } });
    if (!user) throw new Error('Registered user not found.');
    if (!user.email) throw new Error('User has no registered email.');

    const room = await prisma.communicationRoom.create({
      data: {
        name: topic,
        mode: 'VIDEO',
        status: 'ACTIVE',
        createdBy: adminId,
        targetUserId: user.id,
      },
    });

    await sendEmail(user.email, 'R-ZOOMA Video Room Invitation', `You have been invited to a video room: ${topic}\nRoom ID: ${room.id}`);

    await prisma.communicationEvent.create({
      data: {
        roomId: room.id,
        userId: user.id,
        type: 'VIDEO_INVITED',
        channel: 'VIDEO_EMAIL',
        payload: { topic },
      },
    });

    return room;
  },

  async sendEmailMessage(userId: string, subject: string, body: string) {
    const user = await prisma.platformUserContact.findUnique({ where: { id: userId } });
    if (!user) throw new Error('Registered user not found.');
    if (!user.email) throw new Error('User has no registered email.');

    await sendEmail(user.email, subject, body);

    const event = await prisma.communicationEvent.create({
      data: {
        userId: user.id,
        type: 'EMAIL_SENT',
        channel: 'EMAIL',
        payload: { subject, bodyPreview: body.slice(0, 120) },
      },
    });

    return { ok: true, eventId: event.id };
  },

  async endRoom(roomId: string, adminId = 'admin') {
    const room = await prisma.communicationRoom.update({
      where: { id: roomId },
      data: { status: 'ENDED', endedAt: new Date() },
    });

    await prisma.communicationEvent.create({
      data: {
        roomId,
        userId: room.targetUserId ?? undefined,
        type: 'ROOM_ENDED',
        channel: room.mode,
        payload: { endedBy: adminId },
      },
    });

    return room;
  },
};
