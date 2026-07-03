export type Role = 'ADMIN' | 'USER';
export type CommunicationMode = 'AUDIO' | 'VIDEO' | 'EMAIL';
export type MeetingStatus = 'DRAFT' | 'INVITED' | 'ACCEPTED' | 'DECLINED' | 'READY' | 'LIVE' | 'PAUSED' | 'ENDED' | 'CANCELLED';

export interface AuthUser {
  id: string;
  role: Role;
  email: string;
}

export interface ScheduleMeetingDto {
  title: string;
  agenda?: string;
  mode: Extract<CommunicationMode, 'AUDIO' | 'VIDEO'>;
  startsAt: string;
  endsAt?: string;
  inviteeUserIds: string[];
  autoOpen?: boolean;
  calendarSync?: boolean;
}
