import crypto from 'crypto';
import { ActivityEvent, CommunicationMode, CommunicationRoom, Participant } from './communication.types';
import { broadcastCommunicationEvent } from './communication.ws';

const now = () => new Date().toISOString();
const id = (prefix: string) => `${prefix}_${crypto.randomUUID()}`;

const rooms: CommunicationRoom[] = [
  { id: 'room_audio_1', name: 'Research Team Audio', mode: 'audio', type: 'CALL_ROOM', status: 'ACTIVE', createdAt: now(), participantCount: 2, unreadCount: 0 },
  { id: 'room_video_1', name: 'Publication Review Video', mode: 'video', type: 'VIDEO_ROOM', status: 'ACTIVE', createdAt: now(), participantCount: 4, unreadCount: 0 },
  { id: 'room_msg_1', name: 'SDOH Workspace Broadcast', mode: 'messaging', type: 'MESSAGE_ROOM', status: 'ACTIVE', createdAt: now(), participantCount: 6, unreadCount: 2 },
];

const participants: Participant[] = [
  { id: 'p1', roomId: 'room_audio_1', displayName: 'Dr. Researcher', role: 'ADMIN', status: 'ONLINE', joinedAt: now() },
  { id: 'p2', roomId: 'room_audio_1', displayName: 'Analyst One', role: 'ANALYST', status: 'ONLINE', joinedAt: now() },
  { id: 'p3', roomId: 'room_video_1', displayName: 'Reviewer A', role: 'REVIEWER', status: 'ONLINE', joinedAt: now() },
];

const activity: ActivityEvent[] = [
  { id: id('evt'), type: 'system.online', message: 'Communication center initialized.', severity: 'SUCCESS', createdAt: now() },
];

function emit(type: string, payload: any, severity: ActivityEvent['severity'] = 'INFO') {
  const event = { id: id('evt'), type, message: payload.message ?? type, severity, createdAt: now() };
  activity.unshift(event);
  broadcastCommunicationEvent({ type, payload });
  broadcastCommunicationEvent({ type: 'activity.created', payload: event });
}

export const communicationService = {
  getMetrics() {
    const activeRooms = rooms.filter((room) => room.status === 'ACTIVE');
    return {
      activeCalls: activeRooms.filter((room) => room.mode === 'audio').length,
      activeVideoRooms: activeRooms.filter((room) => room.mode === 'video').length,
      activeMessageRooms: activeRooms.filter((room) => room.mode === 'messaging').length,
      onlineUsers: participants.filter((p) => p.status === 'ONLINE').length,
      unreadMessages: rooms.reduce((sum, room) => sum + room.unreadCount, 0),
      failedAttempts: 0,
      flaggedSessions: rooms.filter((room) => room.status === 'FLAGGED').length,
      activeRooms: activeRooms.length,
    };
  },

  listRooms(mode?: CommunicationMode) {
    return rooms.filter((room) => (mode ? room.mode === mode : true));
  },

  getRoom(roomId: string) {
    const room = rooms.find((item) => item.id === roomId);
    if (!room) throw new Error('Room not found');
    return { room, participants: participants.filter((p) => p.roomId === roomId) };
  },

  createRoom(input: { name: string; mode: CommunicationMode; workspaceId?: string }) {
    const type = input.mode === 'audio' ? 'CALL_ROOM' : input.mode === 'video' ? 'VIDEO_ROOM' : 'MESSAGE_ROOM';
    const room: CommunicationRoom = {
      id: id('room'),
      name: input.name,
      mode: input.mode,
      type,
      status: 'ACTIVE',
      workspaceId: input.workspaceId ?? null,
      studyId: null,
      createdAt: now(),
      participantCount: 0,
      unreadCount: 0,
    };
    rooms.unshift(room);
    emit('room.created', { room, message: `Created ${input.mode} room: ${input.name}` }, 'SUCCESS');
    broadcastCommunicationEvent({ type: 'metrics.updated', payload: this.getMetrics() });
    return room;
  },

  joinRoom(roomId: string, displayName: string) {
    const room = rooms.find((item) => item.id === roomId);
    if (!room) throw new Error('Room not found');
    const participant: Participant = { id: id('participant'), roomId, displayName, role: 'ADMIN', status: 'ONLINE', joinedAt: now() };
    participants.push(participant);
    room.participantCount += 1;
    emit('participant.joined', { roomId, participant, message: `${displayName} joined ${room.name}` }, 'SUCCESS');
    broadcastCommunicationEvent({ type: 'metrics.updated', payload: this.getMetrics() });
    return participant;
  },

  closeRoom(roomId: string) {
    const room = rooms.find((item) => item.id === roomId);
    if (!room) throw new Error('Room not found');
    room.status = 'CLOSED';
    emit('room.closed', { roomId, message: `Closed room: ${room.name}` }, 'WARNING');
    broadcastCommunicationEvent({ type: 'metrics.updated', payload: this.getMetrics() });
    return room;
  },

  moderate(roomId: string, participantId: string, action: 'MUTE' | 'REMOVE' | 'FLAG') {
    const participant = participants.find((item) => item.id === participantId && item.roomId === roomId);
    if (!participant) throw new Error('Participant not found');
    if (action === 'MUTE') participant.status = 'MUTED';
    if (action === 'REMOVE') participant.status = 'REMOVED';
    if (action === 'FLAG') {
      const room = rooms.find((item) => item.id === roomId);
      if (room) room.status = 'FLAGGED';
    }
    emit(`participant.${action.toLowerCase()}`, { roomId, participantId, message: `${action} applied to ${participant.displayName}` }, 'WARNING');
    broadcastCommunicationEvent({ type: 'metrics.updated', payload: this.getMetrics() });
    return participant;
  },

  sendMessage(roomId: string, body: string) {
    const room = rooms.find((item) => item.id === roomId);
    if (!room) throw new Error('Room not found');
    room.unreadCount += 1;
    emit('message.sent', { roomId, body, message: `Message sent in ${room.name}` }, 'SUCCESS');
    broadcastCommunicationEvent({ type: 'metrics.updated', payload: this.getMetrics() });
    return { id: id('message'), roomId, body, createdAt: now() };
  },

  listActivity() {
    return activity.slice(0, 30);
  },
};
