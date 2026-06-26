import type { Server as HttpServer } from 'node:http';
import type { JwtPayload } from '../utils/jwt.js';
import { attachNotificationGateway } from './notifications.gateway.js';
import { auditLogService } from '../modules/communication/services/audit-log.service.js';
import { communicationRoomService } from '../modules/communication/services/communication-room.service.js';
import { messageService } from '../modules/communication/services/message.service.js';
import { presenceService } from '../modules/communication/services/presence.service.js';

let attached = false;

export function attachCommunicationGateway(server: HttpServer) {
  const io = attachNotificationGateway(server);
  if (attached) {
    return io;
  }
  attached = true;

  io.on('connection', (socket) => {
    const user = socket.data.user as JwtPayload;
    void presenceService.heartbeat({ userId: user.id, socketId: socket.id, status: 'ONLINE' });

    socket.on('room:join', async (payload?: { roomId?: string }) => {
      if (!payload?.roomId) return;

      const canAccess = await communicationRoomService.canAccessRoom(payload.roomId, user.id, user.roles ?? []);
      if (!canAccess) {
        socket.emit('comm:error', { roomId: payload.roomId, message: 'Not authorized to join room' });
        return;
      }

      socket.join(`comm:${payload.roomId}`);
      await communicationRoomService.upsertParticipant({ roomId: payload.roomId, userId: user.id, isOnline: true });
      const participants = await communicationRoomService.listParticipants(payload.roomId);
      io.to(`comm:${payload.roomId}`).emit('room:participants', { roomId: payload.roomId, participants });
      await auditLogService.create({ actorUserId: user.id, roomId: payload.roomId, action: 'ROOM_JOINED' });
    });

    socket.on('room:leave', async (payload?: { roomId?: string }) => {
      if (!payload?.roomId) return;
      socket.leave(`comm:${payload.roomId}`);
      await communicationRoomService.setParticipantOnline(payload.roomId, user.id, false);
      const participants = await communicationRoomService.listParticipants(payload.roomId);
      io.to(`comm:${payload.roomId}`).emit('room:participants', { roomId: payload.roomId, participants });
      await auditLogService.create({ actorUserId: user.id, roomId: payload.roomId, action: 'ROOM_LEFT' });
    });

    socket.on('message:send', async (payload?: { roomId?: string; body?: string }) => {
      if (!payload?.roomId || !payload.body?.trim()) return;

      const canAccess = await communicationRoomService.canAccessRoom(payload.roomId, user.id, user.roles ?? []);
      if (!canAccess) {
        socket.emit('comm:error', { roomId: payload.roomId, message: 'Not authorized to send message' });
        return;
      }

      const message = await messageService.sendMessage({
        roomId: payload.roomId,
        senderId: user.id,
        senderName: user.email,
        body: payload.body.trim(),
      });
      await auditLogService.create({
        actorUserId: user.id,
        roomId: payload.roomId,
        action: 'MESSAGE_SENT_REALTIME',
        metadataJson: { messageId: message.id },
      });
      io.to(`comm:${payload.roomId}`).emit('message:new', { roomId: payload.roomId, message });
    });

    socket.on('presence:heartbeat', async (payload?: { status?: 'ONLINE' | 'AWAY' | 'OFFLINE' | 'IN_CALL' }) => {
      const hb = await presenceService.heartbeat({ userId: user.id, socketId: socket.id, status: payload?.status ?? 'ONLINE' });
      io.emit('presence:update', hb);
    });

    async function relayCallSignal(event: 'call:offer' | 'call:answer' | 'call:ice', payload?: { roomId?: string; [key: string]: unknown }) {
      if (!payload?.roomId) return;

      const canAccess = await communicationRoomService.canAccessRoom(payload.roomId, user.id, user.roles ?? []);
      if (!canAccess) {
        socket.emit('comm:error', { roomId: payload.roomId, message: 'Not authorized to signal in this room' });
        await auditLogService.create({
          actorUserId: user.id,
          roomId: payload.roomId,
          action: 'CALL_SIGNAL_REJECTED',
          metadataJson: { event },
        });
        return;
      }

      if (!socket.rooms.has(`comm:${payload.roomId}`)) {
        socket.join(`comm:${payload.roomId}`);
      }

      socket.to(`comm:${payload.roomId}`).emit(event, payload);
    }

    socket.on('call:offer', (payload) => {
      void relayCallSignal('call:offer', payload);
    });

    socket.on('call:answer', (payload) => {
      void relayCallSignal('call:answer', payload);
    });

    socket.on('call:ice', (payload) => {
      void relayCallSignal('call:ice', payload);
    });

    socket.on('moderation:remove-participant', async (payload?: { roomId?: string; targetUserId?: string }) => {
      if (!payload?.roomId || !payload.targetUserId) return;

      const canModerate = await communicationRoomService.canModerateRoom(payload.roomId, user.id, user.roles ?? []);
      if (!canModerate) {
        socket.emit('comm:error', { roomId: payload.roomId, message: 'Not authorized to moderate room' });
        return;
      }

      await communicationRoomService.removeParticipant(payload.roomId, payload.targetUserId);
      const participants = await communicationRoomService.listParticipants(payload.roomId);
      io.to(`comm:${payload.roomId}`).emit('room:participants', { roomId: payload.roomId, participants });
      await auditLogService.create({
        actorUserId: user.id,
        roomId: payload.roomId,
        action: 'MOD_REMOVE_PARTICIPANT',
        metadataJson: { targetUserId: payload.targetUserId },
      });
    });

    socket.on('disconnect', () => {
      void presenceService.setOfflineBySocket(socket.id);
    });
  });

  return io;
}
