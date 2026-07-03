export type CommMode = 'AUDIO' | 'VIDEO' | 'EMAIL';
export type MeetingStatus = 'DRAFT' | 'INVITED' | 'ACCEPTED' | 'DECLINED' | 'READY' | 'LIVE' | 'PAUSED' | 'ENDED' | 'CANCELLED';

export interface CommMetric {
  label: string;
  value: string | number;
  delta?: string;
}

export interface MeetingItem {
  id: string;
  title: string;
  mode: CommMode;
  status: MeetingStatus;
  startsAt: string;
  endsAt?: string;
  participants: number;
  accepted: number;
  declined: number;
}
