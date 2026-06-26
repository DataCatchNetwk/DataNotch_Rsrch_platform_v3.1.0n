import {
  type CallSession,
  type CommunicationAuditLog,
  type CommunicationParticipant,
  type CommunicationRoom,
  type Message,
  type MessageThread,
  type PresenceHeartbeat,
} from './communication.types.js';

function makeId(prefix: string) {
  return `${prefix}_${Math.random().toString(36).slice(2, 10)}${Date.now().toString(36)}`;
}

const rooms = new Map<string, CommunicationRoom>();
const participants = new Map<string, CommunicationParticipant>();
const threads = new Map<string, MessageThread>();
const messages = new Map<string, Message>();
const callSessions = new Map<string, CallSession>();
const heartbeats = new Map<string, PresenceHeartbeat>();
const audits = new Map<string, CommunicationAuditLog>();

export const communicationStore = {
  makeId,
  rooms,
  participants,
  threads,
  messages,
  callSessions,
  heartbeats,
  audits,
};
