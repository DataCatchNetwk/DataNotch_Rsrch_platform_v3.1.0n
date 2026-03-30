export type ActivityItem = {
  id: string;
  type: "Analysis" | "Dataset" | "Report" | "Security" | "Workspace";
  title: string;
  meta: string;
  time: string;
  status?: "Completed" | "Running" | "Pending" | "Successful";
};

export type NotificationPreference = {
  key: string;
  title: string;
  description: string;
  enabled: boolean;
};

export type ProfileAggregate = {
  firstName: string;
  lastName: string;
  email: string;
  role: string;
  institution: string;
  department: string;
  researchGroup: string;
  timezone: string;
  memberSince: string;
  lastLogin: string;
  accountStatus: string;
  workspaceRole: string;
  accessLevel: string;
  reviewAccess: string;
  approvalAuthority: string;
  twoFactorEnabled: boolean;
  passwordLastChanged: string;
  activeSessions: number;
  trustedDevices: number;
  workspacesJoined: number;
  workspacesOwned: number;
  pendingInvites: number;
  defaultWorkspace: string;
  datasetsUploaded: number;
  analysisJobsRun: number;
  reportsGenerated: number;
  reviewerTasks: number;
  recentActivity: ActivityItem[];
  notificationPreferences: NotificationPreference[];
};
