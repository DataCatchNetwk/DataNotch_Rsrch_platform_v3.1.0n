export class ProfileResponseDto {
  firstName!: string;
  lastName!: string;
  fullName!: string;
  email!: string;
  role!: string;
  institution!: string;
  department!: string;
  researchGroup!: string;
  timezone!: string;
  memberSince!: string;
  lastLogin!: string;
  accountStatus!: string;
  workspaceRole!: string;
  accessLevel!: string;
  reviewAccess!: string;
  approvalAuthority!: string;
}

export class ProfileStatsResponseDto {
  datasetsUploaded!: number;
  analysisJobsRun!: number;
  reportsGenerated!: number;
  workspacesJoined!: number;
  reviewerTasks!: number;
}

export class ProfileSecurityResponseDto {
  twoFactorEnabled!: boolean;
  passwordLastChanged!: string;
  activeSessions!: number;
  trustedDevices!: number;
}

export class ProfileWorkspaceResponseDto {
  defaultWorkspace!: string;
  workspacesJoined!: number;
  workspacesOwned!: number;
  pendingInvites!: number;
}

export class ActivityItemResponseDto {
  id!: string;
  type!: "Analysis" | "Dataset" | "Report" | "Security" | "Workspace";
  title!: string;
  meta!: string;
  time!: string;
  status?: "Completed" | "Running" | "Pending" | "Successful";
}

export class NotificationPreferenceResponseDto {
  key!: string;
  title!: string;
  description!: string;
  enabled!: boolean;
}
