export type CommunicationMode = 'audio' | 'video' | 'messaging';
export type RoomStatus = 'ACTIVE' | 'IDLE' | 'CLOSED' | 'FLAGGED';
export type ParticipantStatus = 'ONLINE' | 'OFFLINE' | 'MUTED' | 'REMOVED';
export type ParticipantRole = 'ADMIN' | 'RESEARCHER' | 'ANALYST' | 'REVIEWER' | 'GUEST';

export type CommunicationRoom = {
  id: string;
  name: string;
  mode: CommunicationMode;
  type: 'CALL_ROOM' | 'VIDEO_ROOM' | 'MESSAGE_ROOM';
  status: RoomStatus;
  workspaceId?: string | null;
  studyId?: string | null;
  createdAt: string;
  participantCount: number;
  unreadCount: number;
};

export type Participant = {
  id: string;
  roomId: string;
  displayName: string;
  role: ParticipantRole;
  status: ParticipantStatus;
  joinedAt: string;
};

export type ActivityEvent = {
  id: string;
  type: string;
  message: string;
  severity: 'INFO' | 'SUCCESS' | 'WARNING' | 'ERROR';
  createdAt: string;
};
