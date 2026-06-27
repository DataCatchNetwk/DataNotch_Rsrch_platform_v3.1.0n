export type GovernanceRole = 'USER' | 'REVIEWER' | 'STAFF' | 'ADMIN' | 'SUPER_ADMIN';
export type GovernanceStatus = 'ACTIVE' | 'PENDING' | 'SUSPENDED';

export type BulkRoleActionDto = {
  userIds: string[];
  role: GovernanceRole;
  reason: string;
};

export type BulkStatusActionDto = {
  userIds: string[];
  status: GovernanceStatus;
  reason: string;
};

export type ApprovalDecisionDto = {
  reason: string;
  assignRole?: GovernanceRole;
};
