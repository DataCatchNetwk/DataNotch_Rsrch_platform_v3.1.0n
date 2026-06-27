export type GovernanceRoleDto = 'USER' | 'REVIEWER' | 'STAFF' | 'ADMIN' | 'SUPER_ADMIN';

export type BulkRoleActionDto = {
  userIds: string[];
  role: GovernanceRoleDto;
};

export type BulkSuspendActionDto = {
  userIds: string[];
};
