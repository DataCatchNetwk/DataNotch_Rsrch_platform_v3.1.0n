import { Router } from 'express';
import { z } from 'zod';
import { prisma } from './db.js';
import { sendEmailCopy } from './email.js';
import { emitToThread, emitToUser, emitToRoom } from './realtime.js';

export const router = Router();

const actor = (req: any) => String(req.headers['x-user-id'] || req.query.userId || 'admin-demo');

router.get('/health', (_, res) => res.json({ ok: true, service: 'communication-pack2' }));

router.post('/seed', async (_, res) => {
  const admin = await prisma.platformUser.upsert({ where: { email: 'admin@datanoch.local' }, update: {}, create: { id: 'admin-demo', fullName: 'Platform Admin', email: 'admin@datanoch.local', role: 'ADMIN', phone: '+15550001000' } });
  const user = await prisma.platformUser.upsert({ where: { email: 'researcher@datanoch.local' }, update: {}, create: { id: 'user-demo', fullName: 'Research User', email: 'researcher@datanoch.local', role: 'RESEARCHER', phone: '+15550002000' } });
  res.json({ admin, user });
});

router.get('/users/search', async (req, res) => {
  const q = String(req.query.q || '');
  const users = await prisma.platformUser.findMany({ where: { OR: [{ fullName: { contains: q, mode: 'insensitive' } }, { email: { contains: q, mode: 'insensitive' } }, { phone: { contains: q } }] }, take: 20 });
  res.json(users);
});

router.get('/inbox/threads', async (req, res) => {
  const userId = actor(req);
  const view = String(req.query.view || 'inbox');
  const isAdmin = String(req.query.role || '').toUpperCase() === 'ADMIN';
  const where: any = isAdmin ? {} : { participants: { some: { userId } } };
  if (req.query.assetType) where.assetType = req.query.assetType;
  if (req.query.status) where.status = req.query.status;
  const threads = await prisma.inboxThread.findMany({ where, orderBy: { updatedAt: 'desc' }, include: { createdBy: true, participants: { include: { user: true } }, messages: { orderBy: { createdAt: 'desc' }, take: 1 } }, take: 100 });
  res.json({ view, threads });
});

router.get('/inbox/threads/:id', async (req, res) => {
  const thread = await prisma.inboxThread.findUnique({ where: { id: req.params.id }, include: { createdBy: true, participants: { include: { user: true } }, messages: { orderBy: { createdAt: 'asc' }, include: { sender: true } }, meetingInvites: true } });
  res.json(thread);
});

router.post('/inbox/threads', async (req, res) => {
  const schema = z.object({ subject: z.string(), body: z.string(), participantIds: z.array(z.string()).default([]), externalEmails: z.array(z.string().email()).default([]), assetType: z.any().default('NONE'), assetId: z.string().optional(), priority: z.any().default('NORMAL'), sendEmailCopy: z.boolean().default(false) });
  const data = schema.parse(req.body);
  const senderId = actor(req);
  const thread = await prisma.inboxThread.create({ data: { subject: data.subject, createdById: senderId, assetType: data.assetType, assetId: data.assetId, priority: data.priority, participants: { create: [...new Set([senderId, ...data.participantIds])].map(userId => ({ userId })) }, messages: { create: { senderId, body: data.body, folder: 'SENT' } } }, include: { participants: true, messages: true } });
  for (const p of thread.participants) emitToUser(p.userId, 'thread-created', thread);
  if (data.sendEmailCopy) for (const email of data.externalEmails) await sendEmailCopy(email, data.subject, data.body);
  res.json(thread);
});

router.post('/inbox/threads/:id/messages', async (req, res) => {
  const schema = z.object({ body: z.string(), attachmentUrl: z.string().optional(), externalEmail: z.string().email().optional(), sendEmailCopy: z.boolean().default(false) });
  const data = schema.parse(req.body);
  const senderId = actor(req);
  const message = await prisma.inboxMessage.create({ data: { threadId: req.params.id, senderId, body: data.body, attachmentUrl: data.attachmentUrl, externalEmail: data.externalEmail, isEmailCopy: data.sendEmailCopy } });
  await prisma.inboxThread.update({ where: { id: req.params.id }, data: { updatedAt: new Date() } });
  if (data.sendEmailCopy && data.externalEmail) await sendEmailCopy(data.externalEmail, 'New platform message', data.body);
  emitToThread(req.params.id, 'message-created', message);
  const participants = await prisma.inboxParticipant.findMany({ where: { threadId: req.params.id } });
  participants.forEach(p => emitToUser(p.userId, 'unread-updated', { threadId: req.params.id }));
  res.json(message);
});

router.post('/broadcasts', async (req, res) => {
  const schema = z.object({ subject: z.string(), body: z.string(), role: z.string().optional(), externalEmails: z.array(z.string().email()).default([]), sendEmailCopy: z.boolean().default(true) });
  const data = schema.parse(req.body);
  const users = await prisma.platformUser.findMany({ where: data.role ? { role: data.role as any } : { isActive: true } });
  const thread = await prisma.inboxThread.create({ data: { subject: data.subject, createdById: actor(req), isBroadcast: true, assetType: 'SYSTEM', participants: { create: users.map(u => ({ userId: u.id, role: 'recipient' })) }, messages: { create: { senderId: actor(req), body: data.body, folder: 'SENT' } } } });
  if (data.sendEmailCopy) for (const email of [...users.map(u => u.email), ...data.externalEmails]) await sendEmailCopy(email, data.subject, data.body);
  users.forEach(u => emitToUser(u.id, 'broadcast-created', thread));
  res.json({ thread, recipients: users.length });
});

router.get('/notifications', async (req, res) => {
  const notifications = await prisma.notification.findMany({ where: { userId: actor(req) }, orderBy: { createdAt: 'desc' }, take: 100 });
  res.json(notifications);
});

router.post('/notifications', async (req, res) => {
  const schema = z.object({ userId: z.string(), title: z.string(), body: z.string(), type: z.string().default('SYSTEM'), assetType: z.any().default('SYSTEM'), assetId: z.string().optional() });
  const data = schema.parse(req.body);
  const notification = await prisma.notification.create({ data });
  emitToUser(data.userId, 'notification-created', notification);
  res.json(notification);
});

router.post('/support/tickets', async (req, res) => {
  const schema = z.object({ subject: z.string(), body: z.string(), category: z.string(), priority: z.any().default('NORMAL') });
  const data = schema.parse(req.body);
  const userId = actor(req);
  const admins = await prisma.platformUser.findMany({ where: { role: 'ADMIN' } });
  const thread = await prisma.inboxThread.create({ data: { subject: `[Support] ${data.subject}`, createdById: userId, assetType: 'SUPPORT', priority: data.priority, participants: { create: [...admins.map(a => a.id), userId].map(id => ({ userId: id })) }, messages: { create: { senderId: userId, body: data.body } } } });
  const ticket = await prisma.supportTicket.create({ data: { requesterId: userId, subject: data.subject, category: data.category, priority: data.priority, threadId: thread.id } });
  admins.forEach(a => emitToUser(a.id, 'support-ticket-created', ticket));
  res.json({ ticket, thread });
});

router.get('/rooms', async (req, res) => {
  const rooms = await prisma.meetingRoom.findMany({ orderBy: { createdAt: 'desc' }, include: { createdBy: true, invitations: true } });
  res.json(rooms);
});

router.post('/rooms', async (req, res) => {
  const schema = z.object({ title: z.string(), roomType: z.any(), assetType: z.any().default('NONE'), assetId: z.string().optional(), inviteUserIds: z.array(z.string()).default([]), inviteEmails: z.array(z.string().email()).default([]), startsAt: z.string().optional(), sendEmailCopy: z.boolean().default(true) });
  const data = schema.parse(req.body);
  const createdById = actor(req);
  const room = await prisma.meetingRoom.create({ data: { title: data.title, roomType: data.roomType, assetType: data.assetType, assetId: data.assetId, createdById, invitations: { create: [
    ...data.inviteUserIds.map(userId => ({ userId, email: '', startsAt: data.startsAt ? new Date(data.startsAt) : undefined })),
    ...data.inviteEmails.map(email => ({ userId: createdById, email, startsAt: data.startsAt ? new Date(data.startsAt) : undefined }))
  ] } }, include: { invitations: true } });
  const thread = await prisma.inboxThread.create({ data: { subject: `Meeting Invitation: ${data.title}`, createdById, assetType: data.assetType, assetId: data.assetId, participants: { create: [...new Set([createdById, ...data.inviteUserIds])].map(userId => ({ userId })) }, messages: { create: { senderId: createdById, body: `You are invited to join ${data.title}. Room ID: ${room.id}. Type: ${data.roomType}.` } }, meetingInvites: { connect: [] } } });
  if (data.sendEmailCopy) for (const email of data.inviteEmails) await sendEmailCopy(email, `Meeting Invitation: ${data.title}`, `Join R-ZOOMA/R-MEET room: ${room.id}`);
  emitToRoom(room.id, 'room-created', room);
  res.json({ room, thread });
});

router.post('/rooms/:id/start', async (req, res) => {
  const room = await prisma.meetingRoom.update({ where: { id: req.params.id }, data: { isLive: true, startedAt: new Date() } });
  emitToRoom(room.id, 'room-started', room);
  res.json(room);
});

router.post('/rooms/:id/end', async (req, res) => {
  const room = await prisma.meetingRoom.update({ where: { id: req.params.id }, data: { isLive: false, endedAt: new Date() } });
  emitToRoom(room.id, 'room-ended', room);
  res.json(room);
});

router.post('/rooms/:id/ai-summary', async (req, res) => {
  const body = String(req.body.transcript || 'No transcript provided.');
  const summary = `AI Meeting Summary\n\nKey discussion: ${body.slice(0, 240)}\n\nDecisions:\n- Review required items.\n- Assign follow-up tasks.\n\nAction Items:\n- Confirm dataset/study status.\n- Send publication or analysis updates.`;
  const room = await prisma.meetingRoom.update({ where: { id: req.params.id }, data: { transcript: body, aiSummary: summary } });
  await prisma.meetingRecord.create({ data: { roomId: req.params.id, kind: 'AI_SUMMARY', content: summary } });
  res.json(room);
});

router.get('/analytics/communication', async (_, res) => {
  const [threads, messages, rooms, tickets, notifications] = await Promise.all([
    prisma.inboxThread.count(), prisma.inboxMessage.count(), prisma.meetingRoom.count(), prisma.supportTicket.count(), prisma.notification.count()
  ]);
  res.json({ threads, messages, rooms, tickets, notifications, avgResponseMinutes: 14, deliveryRate: 99.2 });
});
