export type Role = 'ADMIN' | 'USER' | 'RESEARCHER' | 'DATA_STEWARD' | 'REVIEWER';

export function canManageMeeting(role: Role, isOwner: boolean) {
  return role === 'ADMIN' || isOwner;
}

export function canDeleteLogs(role: Role) {
  return role === 'ADMIN';
}

export function canPauseMeeting(role: Role, isOwner: boolean) {
  return role === 'ADMIN' || isOwner;
}
