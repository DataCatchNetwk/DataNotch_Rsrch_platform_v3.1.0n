export type ProfileResponseDto = {
  firstName: string
  lastName: string
  fullName: string
  email: string
  role: string
  institution: string
  department: string
  researchGroup: string
  timezone: string
  memberSince: string
  lastLogin: string
  accountStatus: string
  workspaceRole: string
  accessLevel: string
  reviewAccess: string
  approvalAuthority: string
}

export type ProfileStatsResponseDto = {
  datasetsUploaded: number
  analysisJobsRun: number
  reportsGenerated: number
  workspacesJoined: number
  reviewerTasks: number
}

export type ProfileSecurityResponseDto = {
  twoFactorEnabled: boolean
  passwordLastChanged: string
  activeSessions: number
  trustedDevices: number
}

export type ProfileWorkspaceResponseDto = {
  defaultWorkspace: string
  workspacesJoined: number
  workspacesOwned: number
  pendingInvites: number
}

export type ActivityItemResponseDto = {
  id: string
  type: "Analysis" | "Dataset" | "Report" | "Security" | "Workspace"
  title: string
  meta: string
  time: string
  status?: "Completed" | "Running" | "Pending" | "Successful"
}

export type NotificationPreferenceResponseDto = {
  key: string
  title: string
  description: string
  enabled: boolean
}