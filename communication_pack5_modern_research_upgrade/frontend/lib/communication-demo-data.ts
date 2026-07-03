export type MeetingMode = 'AUDIO' | 'VIDEO';
export type InviteStatus = 'SENT' | 'ACCEPTED' | 'DECLINED' | 'PENDING';

export const commandMetrics = [
  { label: 'Live Sessions', value: '31', detail: '+4 today' },
  { label: 'Pending Invites', value: '18', detail: '7 need action' },
  { label: 'Email Delivery', value: '99.4%', detail: 'last 24h' },
  { label: 'Open Support', value: '7', detail: '2 escalated' },
];

export const upcomingMeetings = [
  { id: 'm1', title: 'Dataset Review — Clinical_SDOH_v5', mode: 'VIDEO', time: 'Today, 4:30 PM', status: 'Accepted' },
  { id: 'm2', title: 'Research PI Check-in', mode: 'AUDIO', time: 'Tomorrow, 9:00 AM', status: 'Pending' },
  { id: 'm3', title: 'Publication Review Room', mode: 'VIDEO', time: 'Fri, 11:00 AM', status: 'Accepted' },
];

export const audioCalls = [
  { id: 'a1', title: 'Dataset Review Audio', participants: 5, duration: '00:28:11', status: 'LIVE' },
  { id: 'a2', title: 'Research PI Check-in', participants: 3, duration: 'Ready', status: 'READY' },
  { id: 'a3', title: 'Support Escalation Call', participants: 2, duration: 'Queued', status: 'QUEUE' },
];

export const videoMeetings = [
  { id: 'v1', title: 'Publication Review Room', accepted: 8, declined: 1, pending: 2, status: 'READY', autoOpen: true },
  { id: 'v2', title: 'Analysis Review — Survival Model', accepted: 6, declined: 0, pending: 3, status: 'SCHEDULED', autoOpen: true },
];

export const messageThreads = [
  { id: 't1', title: 'Dataset Approval Request — Clinical_SDOH_v5', type: 'Dataset', status: 'NEW', unread: 4, last: 'Need missingness review before approval.' },
  { id: 't2', title: 'Study Review Request — NeuroTwinFM Phase 2', type: 'Study', status: 'OPEN', unread: 2, last: 'Reviewer comments are ready.' },
  { id: 't3', title: 'Support Ticket — Account Recovery', type: 'Support', status: 'ESCALATED', unread: 1, last: 'User cannot access workspace.' },
  { id: 't4', title: 'Announcement — Platform Upgrade', type: 'Announcement', status: 'SENT', unread: 0, last: 'Scheduled maintenance window.' },
];

export const activity = [
  'R-ZOOMA invite accepted by Data Steward',
  'Audio call ended: Dataset Review Audio',
  'External email delivered to reviewer@example.com',
  'AI notes generated for Publication Review Room',
];
