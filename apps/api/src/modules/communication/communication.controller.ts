import type { Request, Response } from 'express';
import { HttpError } from '../../utils/errors.js';
import { auditLogService } from './services/audit-log.service.js';
import { callSessionService } from './services/call-session.service.js';
import { communicationRoomService } from './services/communication-room.service.js';
import { messageService } from './services/message.service.js';
import { presenceService } from './services/presence.service.js';
import type { CallMode, CommunicationRoomType } from './communication.types.js';

function requireUserId(req: Request) {
  const userId = req.user?.id;
  if (!userId) {
    throw new HttpError(401, 'Authentication required');
  }
  return userId;
}

function requireUser(req: Request) {
  if (!req.user) {
    throw new HttpError(401, 'Authentication required');
  }

  return req.user;
}

export class CommunicationController {
  listRooms = async (req: Request, res: Response): Promise<void> => {
    const user = requireUser(req);
    const items = await communicationRoomService.listRooms(user.id, user.roles);
    res.json({ items });
  };

  createRoom = async (req: Request, res: Response): Promise<void> => {
    const userId = requireUserId(req);
    const name = typeof req.body?.name === 'string' ? req.body.name.trim() : '';
    const type = typeof req.body?.type === 'string' ? (req.body.type as CommunicationRoomType) : 'GROUP';

    if (!name) {
      throw new HttpError(400, 'name is required');
    }

    const room = await communicationRoomService.createRoom({
      name,
      type,
      visibility: req.body?.visibility,
      workspaceId: req.body?.workspaceId,
      createdById: userId,
    });

    await auditLogService.create({ actorUserId: userId, roomId: room.id, action: 'ROOM_CREATED' });
    res.status(201).json(room);
  };

  roomState = async (req: Request, res: Response): Promise<void> => {
    const user = requireUser(req);
    const roomId = req.params.roomId;
    const canAccess = await communicationRoomService.canAccessRoom(roomId, user.id, user.roles);
    if (!canAccess) {
      throw new HttpError(403, 'Not authorized to access this room');
    }

    const room = await communicationRoomService.getRoom(roomId);
    if (!room) {
      throw new HttpError(404, 'Room not found');
    }

    const activeCalls = (await callSessionService.listActive()).filter((s) => s.roomId === roomId);

    res.json({
      room,
      participants: await communicationRoomService.listParticipants(roomId),
      messages: await messageService.listMessages(roomId),
      activeCalls,
    });
  };

  sendMessage = async (req: Request, res: Response): Promise<void> => {
    const user = requireUser(req);
    const roomId = req.params.roomId;
    const body = typeof req.body?.body === 'string' ? req.body.body.trim() : '';
    if (!body) {
      throw new HttpError(400, 'body is required');
    }

    const canAccess = await communicationRoomService.canAccessRoom(roomId, user.id, user.roles);
    if (!canAccess) {
      throw new HttpError(403, 'Not authorized to access this room');
    }

    const message = await messageService.sendMessage({
      roomId,
      senderId: user.id,
      senderName: user.email,
      body,
    });

    await auditLogService.create({
      actorUserId: user.id,
      roomId,
      action: 'MESSAGE_SENT',
      metadataJson: { messageId: message.id },
    });

    res.status(201).json(message);
  };

  startCall = async (req: Request, res: Response): Promise<void> => {
    const user = requireUser(req);
    const userId = user.id;
    const roomId = req.params.roomId;
    const mode = (req.body?.mode as CallMode) || 'AUDIO';

    const canAccess = await communicationRoomService.canAccessRoom(roomId, user.id, user.roles);
    if (!canAccess) {
      throw new HttpError(403, 'Not authorized to access this room');
    }

    if (!(await communicationRoomService.getRoom(roomId))) {
      throw new HttpError(404, 'Room not found');
    }

    const call = await callSessionService.startCall({ roomId, mode, startedById: userId });
    await auditLogService.create({ actorUserId: userId, roomId, callSessionId: call.id, action: 'CALL_STARTED', metadataJson: { mode } });
    res.json(call);
  };

  endCall = async (req: Request, res: Response): Promise<void> => {
    const user = requireUser(req);
    const callSessionId = req.params.callSessionId;
    const call = await callSessionService.getCall(callSessionId);
    if (!call) {
      throw new HttpError(404, 'Call session not found');
    }

    const canAccess = await communicationRoomService.canAccessRoom(call.roomId, user.id, user.roles);
    if (!canAccess) {
      throw new HttpError(403, 'Not authorized to end this call session');
    }

    const ended = await callSessionService.endCall(callSessionId);
    if (!ended) {
      throw new HttpError(404, 'Call session not found');
    }

    await auditLogService.create({ actorUserId: user.id, roomId: ended.roomId, callSessionId: ended.id, action: 'CALL_ENDED' });
    res.json(ended);
  };

  monitoring = async (_req: Request, res: Response): Promise<void> => {
    const activeCalls = await callSessionService.listActive();
    const onlineUsers = await presenceService.listOnlineUsers();
    const unreadMessages = 0;
    const auditItems = await auditLogService.list(20);
    const delivered = await messageService.countMessages();

    res.json({
      cards: {
        activeCalls: activeCalls.filter((c) => c.mode === 'AUDIO').length,
        activeVideoRooms: activeCalls.filter((c) => c.mode === 'VIDEO').length,
        onlineUsers: onlineUsers.length,
        unreadMessages,
        failedConnectionAttempts: 0,
        flaggedSessions: 0,
      },
      tables: {
        ongoingAudioSessions: activeCalls.filter((c) => c.mode === 'AUDIO'),
        ongoingVideoRooms: activeCalls.filter((c) => c.mode === 'VIDEO'),
        messageQueueStatus: { queued: 0, delivered },
        recentModerationActions: auditItems.filter((a) => /REMOVE|END|MUTE|FLAG/i.test(a.action)),
      },
    });
  };

  audit = async (_req: Request, res: Response): Promise<void> => {
    res.json({ items: await auditLogService.list(200) });
  };
}

export const communicationController = new CommunicationController();
