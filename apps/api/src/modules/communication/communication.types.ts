export type CommunicationRoomType = 'DIRECT' | 'GROUP' | 'CHANNEL' | 'CALL_ROOM';
export type CommunicationVisibility = 'PRIVATE' | 'WORKSPACE' | 'ORG';
export type CommunicationParticipantRole = 'OWNER' | 'MODERATOR' | 'MEMBER';
export type MessageKind = 'TEXT' | 'SYSTEM' | 'FILE';
export type CallMode = 'AUDIO' | 'VIDEO';
export type CallSessionStatus = 'WAITING' | 'ACTIVE' | 'ENDED' | 'FAILED';
export type PresenceStatus = 'ONLINE' | 'AWAY' | 'OFFLINE' | 'IN_CALL';

export type CommunicationRoom = {
  id: string;
  name: string;
  slug?: string;
  type: CommunicationRoomType;
  visibility: CommunicationVisibility;
  workspaceId?: string;
  createdById: string;
  createdAt: string;
  updatedAt: string;
};

export type CommunicationParticipant = {
  id: string;
  roomId: string;
  userId: string;
  role: CommunicationParticipantRole;
  joinedAt: string;
  lastSeenAt?: string;
  muted: boolean;
  cameraEnabled: boolean;
  micEnabled: boolean;
  isOnline: boolean;
};

export type MessageThread = {
  id: string;
  roomId: string;
  subject?: string;
  createdById: string;
  createdAt: string;
  updatedAt: string;
};

export type Message = {
  id: string;
  threadId: string;
  roomId: string;
  senderId: string;
  senderName: string;
  body: string;
  kind: MessageKind;
  attachmentUrl?: string;
  sentAt: string;
  editedAt?: string;
  deletedAt?: string;
};

export type CallSession = {
  id: string;
  roomId: string;
  mode: CallMode;
  status: CallSessionStatus;
  startedById: string;
  startedAt: string;
  endedAt?: string;
  signalKey: string;
};

export type PresenceHeartbeat = {
  id: string;
  userId: string;
  socketId: string;
  status: PresenceStatus;
  lastHeartbeatAt: string;
};

export type CommunicationAuditLog = {
  id: string;
  actorUserId?: string;
  roomId?: string;
  callSessionId?: string;
  action: string;
  metadataJson?: Record<string, unknown>;
  createdAt: string;
};
