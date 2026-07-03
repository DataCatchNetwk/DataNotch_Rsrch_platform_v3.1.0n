import type { Prisma } from '@prisma/client';
import { prisma } from '../../../db/prisma.js';
import { HttpError } from '../../../utils/errors.js';
import { auditLogService } from './audit-log.service.js';
import { callSessionService } from './call-session.service.js';
import { communicationRoomService } from './communication-room.service.js';
import { messageService } from './message.service.js';

type AuthUser = { id: string; email?: string; roles?: string[] };
type MeetingStatus = 'SCHEDULED' | 'READY' | 'LIVE' | 'PAUSED' | 'CANCELLED' | 'ENDED';
type InvitationStatus = 'SENT' | 'ACCEPTED' | 'DECLINED';

type MeetingMetadata = {
  title: string;
  description?: string;
  agenda?: string;
  startsAt: string;
  endsAt?: string;
  assetType?: string;
  assetId?: string;
  assetTitle?: string;
  autoOpenWindow: boolean;
  roomUrl: string;
  status: MeetingStatus;
  invitationStatuses: Record<string, InvitationStatus>;
  createdById: string;
  updatedAt: string;
};

const MEETING_EVENT_ACTIONS = [
  'MEETING_SCHEDULED',
  'MEETING_INVITATION_ACCEPTED',
  'MEETING_INVITATION_DECLINED',
  'MEETING_STARTED',
  'MEETING_PAUSED',
  'MEETING_CANCELLED',
  'MEETING_ENDED',
];

function isAdmin(user: AuthUser) {
  return Boolean(user.roles?.includes('ADMIN') || user.roles?.includes('SUPER_ADMIN'));
}

function asMetadata(value: unknown): MeetingMetadata | null {
  if (!value || typeof value !== 'object') return null;
  const data = value as Partial<MeetingMetadata>;
  if (!data.title || !data.startsAt || !data.status) return null;
  return {
    title: data.title,
    description: data.description,
    agenda: data.agenda,
    startsAt: data.startsAt,
    endsAt: data.endsAt,
    assetType: data.assetType,
    assetId: data.assetId,
    assetTitle: data.assetTitle,
    autoOpenWindow: data.autoOpenWindow ?? true,
    roomUrl: data.roomUrl ?? '',
    status: data.status,
    invitationStatuses: data.invitationStatuses ?? {},
    createdById: data.createdById ?? '',
    updatedAt: data.updatedAt ?? new Date().toISOString(),
  };
}

function sanitizeDate(value: unknown, field: string) {
  const raw = typeof value === 'string' ? value : '';
  const date = new Date(raw);
  if (!raw || Number.isNaN(date.getTime())) {
    throw new HttpError(400, `${field} must be a valid date/time`);
  }
  return date.toISOString();
}

function normalizeInviteeIds(value: unknown) {
  if (!Array.isArray(value)) return [];
  return Array.from(new Set(value.filter((item): item is string => typeof item === 'string' && item.trim().length > 0).map((item) => item.trim())));
}

function toJson<T>(value: T) {
  return JSON.parse(JSON.stringify(value)) as Record<string, unknown>;
}

export class MeetingLifecycleService {
  async createMeeting(input: Record<string, unknown>, user: AuthUser) {
    const title = typeof input.title === 'string' ? input.title.trim() : '';
    if (!title) throw new HttpError(400, 'title is required');

    const startsAt = sanitizeDate(input.startsAt, 'startsAt');
    const endsAt = input.endsAt ? sanitizeDate(input.endsAt, 'endsAt') : undefined;
    const inviteeIds = normalizeInviteeIds(input.inviteeIds);
    const participantIds = Array.from(new Set([user.id, ...inviteeIds]));

    const room = await communicationRoomService.createRoom({
      name: `R-Meet: ${title}`,
      type: 'CALL_ROOM',
      visibility: 'ORG',
      workspaceId: typeof input.workspaceId === 'string' ? input.workspaceId : undefined,
      createdById: user.id,
    });

    await Promise.all(
      participantIds.map((userId) => communicationRoomService.upsertParticipant({
        roomId: room.id,
        userId,
        role: userId === user.id ? 'OWNER' : 'MEMBER',
        isOnline: userId === user.id,
      })),
    );

    const invitationStatuses = participantIds.reduce<Record<string, InvitationStatus>>((acc, userId) => {
      acc[userId] = userId === user.id ? 'ACCEPTED' : 'SENT';
      return acc;
    }, {});

    const metadata: MeetingMetadata = {
      title,
      description: typeof input.description === 'string' ? input.description.trim() : undefined,
      agenda: typeof input.agenda === 'string' ? input.agenda.trim() : undefined,
      startsAt,
      endsAt,
      assetType: typeof input.assetType === 'string' ? input.assetType : undefined,
      assetId: typeof input.assetId === 'string' ? input.assetId : undefined,
      assetTitle: typeof input.assetTitle === 'string' ? input.assetTitle : undefined,
      autoOpenWindow: input.autoOpenWindow !== false,
      roomUrl: `/dashboard/communication/rzooma/${room.id}`,
      status: 'SCHEDULED',
      invitationStatuses,
      createdById: user.id,
      updatedAt: new Date().toISOString(),
    };

    await auditLogService.create({ actorUserId: user.id, roomId: room.id, action: 'MEETING_SCHEDULED', metadataJson: toJson(metadata) });
    await messageService.sendMessage({ roomId: room.id, senderId: user.id, senderName: user.email ?? 'System', kind: 'SYSTEM', body: `Meeting scheduled: ${title}` });

    return this.getMeeting(room.id, user);
  }

  async listMeetings(user: AuthUser) {
    const rooms = (await communicationRoomService.listRooms(user.id, user.roles ?? [])).filter((room) => room.type === 'CALL_ROOM');
    const activeCalls = await callSessionService.listActive();

    const items = await Promise.all(rooms.map(async (room) => {
      const logs = await this.listRoomMeetingLogs(room.id, 25);
      const metadata = this.latestMetadata(logs) ?? this.fallbackMetadata(room);
      const activeCall = activeCalls.find((call) => call.roomId === room.id) ?? null;
      return {
        room,
        metadata: activeCall ? { ...metadata, status: 'LIVE' as MeetingStatus } : metadata,
        activeCall,
        participants: await communicationRoomService.listParticipants(room.id),
        readyToOpen: this.readyToOpen(metadata, user.id),
        logs,
      };
    }));

    items.sort((a, b) => new Date(a.metadata.startsAt).getTime() - new Date(b.metadata.startsAt).getTime());
    return items;
  }

  async getMeeting(roomId: string, user: AuthUser) {
    await this.assertAccess(roomId, user);
    const room = await communicationRoomService.getRoom(roomId);
    if (!room) throw new HttpError(404, 'Meeting room not found');
    const logs = await this.listRoomMeetingLogs(roomId, 50);
    const metadata = this.latestMetadata(logs) ?? this.fallbackMetadata(room);
    const activeCall = (await callSessionService.listActive()).find((call) => call.roomId === roomId) ?? null;
    return {
      room,
      metadata: activeCall ? { ...metadata, status: 'LIVE' as MeetingStatus } : metadata,
      activeCall,
      participants: await communicationRoomService.listParticipants(roomId),
      messages: await messageService.listMessages(roomId),
      readyToOpen: this.readyToOpen(metadata, user.id),
      logs,
    };
  }

  async respond(roomId: string, response: 'ACCEPTED' | 'DECLINED', user: AuthUser) {
    await this.assertAccess(roomId, user);
    const metadata = await this.requireMetadata(roomId);
    metadata.invitationStatuses[user.id] = response;
    metadata.status = response === 'ACCEPTED' && metadata.status === 'SCHEDULED' ? 'READY' : metadata.status;
    metadata.updatedAt = new Date().toISOString();

    const action = response === 'ACCEPTED' ? 'MEETING_INVITATION_ACCEPTED' : 'MEETING_INVITATION_DECLINED';
    await auditLogService.create({ actorUserId: user.id, roomId, action, metadataJson: toJson(metadata) });
    await messageService.sendMessage({ roomId, senderId: user.id, senderName: user.email ?? 'User', kind: 'SYSTEM', body: `Meeting invitation ${response.toLowerCase()}.` });
    return this.getMeeting(roomId, user);
  }

  async updateMeeting(roomId: string, input: Record<string, unknown>, user: AuthUser) {
    await this.assertCanManage(roomId, user);
    const metadata = await this.requireMetadata(roomId);

    if (typeof input.title === 'string' && input.title.trim()) {
      metadata.title = input.title.trim();
    }

    if (typeof input.description === 'string') {
      metadata.description = input.description.trim() || undefined;
    }

    if (typeof input.agenda === 'string') {
      metadata.agenda = input.agenda.trim() || undefined;
    }

    if (input.startsAt) {
      metadata.startsAt = sanitizeDate(input.startsAt, 'startsAt');
    }

    if (Object.prototype.hasOwnProperty.call(input, 'endsAt')) {
      metadata.endsAt = input.endsAt ? sanitizeDate(input.endsAt, 'endsAt') : undefined;
    }

    if (typeof input.assetType === 'string') {
      metadata.assetType = input.assetType;
    }

    if (typeof input.assetId === 'string') {
      metadata.assetId = input.assetId;
    }

    if (typeof input.assetTitle === 'string') {
      metadata.assetTitle = input.assetTitle;
    }

    if (typeof input.autoOpenWindow === 'boolean') {
      metadata.autoOpenWindow = input.autoOpenWindow;
    }

    const inviteeIds = normalizeInviteeIds(input.inviteeIds);
    if (inviteeIds.length) {
      const participantIds = Array.from(new Set([metadata.createdById, ...inviteeIds]));
      await Promise.all(
        participantIds.map((userId) => communicationRoomService.upsertParticipant({
          roomId,
          userId,
          role: userId === metadata.createdById ? 'OWNER' : 'MEMBER',
          isOnline: false,
        })),
      );

      const mergedStatuses = { ...metadata.invitationStatuses };
      participantIds.forEach((id) => {
        if (!mergedStatuses[id]) {
          mergedStatuses[id] = id === metadata.createdById ? 'ACCEPTED' : 'SENT';
        }
      });
      metadata.invitationStatuses = mergedStatuses;
    }

    if (metadata.status === 'CANCELLED' || metadata.status === 'ENDED') {
      metadata.status = 'SCHEDULED';
    }

    metadata.updatedAt = new Date().toISOString();

    await auditLogService.create({
      actorUserId: user.id,
      roomId,
      action: 'MEETING_SCHEDULED',
      metadataJson: toJson(metadata),
    });

    await messageService.sendMessage({
      roomId,
      senderId: user.id,
      senderName: user.email ?? 'User',
      kind: 'SYSTEM',
      body: `Meeting updated: ${metadata.title}`,
    });

    return this.getMeeting(roomId, user);
  }

  async start(roomId: string, user: AuthUser) {
    await this.assertAccess(roomId, user);
    const metadata = await this.requireMetadata(roomId);
    const existing = (await callSessionService.listActive()).find((call) => call.roomId === roomId);
    const call = existing ?? await callSessionService.startCall({ roomId, mode: 'VIDEO', startedById: user.id });
    metadata.status = 'LIVE';
    metadata.updatedAt = new Date().toISOString();
    await auditLogService.create({ actorUserId: user.id, roomId, callSessionId: call.id, action: 'MEETING_STARTED', metadataJson: toJson(metadata) });
    await messageService.sendMessage({ roomId, senderId: user.id, senderName: user.email ?? 'User', kind: 'SYSTEM', body: 'R-Meet meeting started.' });
    return this.getMeeting(roomId, user);
  }

  async pause(roomId: string, user: AuthUser) {
    await this.assertCanManage(roomId, user);
    const metadata = await this.requireMetadata(roomId);
    await callSessionService.endRoomCalls(roomId);
    metadata.status = 'PAUSED';
    metadata.updatedAt = new Date().toISOString();
    await auditLogService.create({ actorUserId: user.id, roomId, action: 'MEETING_PAUSED', metadataJson: toJson(metadata) });
    await messageService.sendMessage({ roomId, senderId: user.id, senderName: user.email ?? 'User', kind: 'SYSTEM', body: 'Meeting paused by moderator.' });
    return this.getMeeting(roomId, user);
  }

  async cancel(roomId: string, user: AuthUser) {
    await this.assertCanManage(roomId, user);
    const metadata = await this.requireMetadata(roomId);
    await callSessionService.endRoomCalls(roomId);
    metadata.status = 'CANCELLED';
    metadata.updatedAt = new Date().toISOString();
    await auditLogService.create({ actorUserId: user.id, roomId, action: 'MEETING_CANCELLED', metadataJson: toJson(metadata) });
    await messageService.sendMessage({ roomId, senderId: user.id, senderName: user.email ?? 'User', kind: 'SYSTEM', body: 'Meeting cancelled.' });
    return this.getMeeting(roomId, user);
  }

  async removeMeeting(roomId: string, user: AuthUser) {
    await this.assertCanManage(roomId, user);
    const room = await communicationRoomService.getRoom(roomId);
    if (!room) throw new HttpError(404, 'Meeting room not found');

    await callSessionService.endRoomCalls(roomId);
    await auditLogService.create({
      actorUserId: user.id,
      roomId,
      action: 'MEETING_DELETED',
      metadataJson: {
        roomId,
        roomName: room.name,
      },
    });

    await prisma.communicationRoom.delete({ where: { id: roomId } });
    return { ok: true };
  }

  async deleteLog(roomId: string, logId: string, user: AuthUser) {
    if (!isAdmin(user)) throw new HttpError(403, 'Only admins can delete meeting activity logs');
    await prisma.communicationAuditLog.deleteMany({ where: { id: logId, roomId } });
    return { ok: true };
  }

  async calendar(roomId: string, user: AuthUser) {
    await this.assertAccess(roomId, user);
    const metadata = await this.requireMetadata(roomId);
    const start = new Date(metadata.startsAt);
    const end = metadata.endsAt ? new Date(metadata.endsAt) : new Date(start.getTime() + 30 * 60 * 1000);
    const fmt = (date: Date) => date.toISOString().replace(/[-:]/g, '').replace(/\.\d{3}Z$/, 'Z');
    const description = [metadata.description, metadata.agenda, `Meeting room: ${metadata.roomUrl}`].filter(Boolean).join('\\n');
    return [
      'BEGIN:VCALENDAR',
      'VERSION:2.0',
      'PRODID:-//DataNotch//Communication Lifecycle//EN',
      'BEGIN:VEVENT',
      `UID:${roomId}@datanotch.local`,
      `DTSTAMP:${fmt(new Date())}`,
      `DTSTART:${fmt(start)}`,
      `DTEND:${fmt(end)}`,
      `SUMMARY:${metadata.title}`,
      `DESCRIPTION:${description}`,
      `LOCATION:${metadata.roomUrl}`,
      'END:VEVENT',
      'END:VCALENDAR',
    ].join('\r\n');
  }

  private async assertAccess(roomId: string, user: AuthUser) {
    const canAccess = await communicationRoomService.canAccessRoom(roomId, user.id, user.roles ?? []);
    if (!canAccess) throw new HttpError(403, 'Not authorized to access this meeting');
  }

  private async assertCanManage(roomId: string, user: AuthUser) {
    const canManage = await communicationRoomService.canModerateRoom(roomId, user.id, user.roles ?? []);
    if (!canManage) throw new HttpError(403, 'Only the meeting owner, moderator, or admin can manage this meeting');
  }

  private async requireMetadata(roomId: string) {
    const logs = await this.listRoomMeetingLogs(roomId, 50);
    const metadata = this.latestMetadata(logs);
    if (!metadata) throw new HttpError(404, 'Meeting lifecycle metadata not found');
    return metadata;
  }

  private latestMetadata(logs: Array<{ metadataJson: Prisma.JsonValue | null }>) {
    for (const log of logs) {
      const metadata = asMetadata(log.metadataJson);
      if (metadata) return metadata;
    }
    return null;
  }

  private async listRoomMeetingLogs(roomId: string, take: number) {
    return prisma.communicationAuditLog.findMany({
      where: { roomId, action: { in: MEETING_EVENT_ACTIONS } },
      orderBy: { createdAt: 'desc' },
      take,
    });
  }

  private fallbackMetadata(room: { id: string; name: string; createdById: string; createdAt: Date }) {
    return {
      title: room.name,
      startsAt: room.createdAt.toISOString(),
      autoOpenWindow: true,
      roomUrl: `/dashboard/communication/rzooma/${room.id}`,
      status: 'READY' as MeetingStatus,
      invitationStatuses: { [room.createdById]: 'ACCEPTED' as InvitationStatus },
      createdById: room.createdById,
      updatedAt: room.createdAt.toISOString(),
    };
  }

  private readyToOpen(metadata: MeetingMetadata, userId: string) {
    const accepted = metadata.invitationStatuses[userId] === 'ACCEPTED' || metadata.createdById === userId;
    const due = new Date(metadata.startsAt).getTime() <= Date.now();
    return accepted && due && ['READY', 'LIVE'].includes(metadata.status);
  }
}

export const meetingLifecycleService = new MeetingLifecycleService();



