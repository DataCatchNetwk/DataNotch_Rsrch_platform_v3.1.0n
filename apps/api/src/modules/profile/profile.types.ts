export type ActivityItem = {
  id: string
  type: "Analysis" | "Dataset" | "Report" | "Security" | "Workspace"
  title: string
  meta: string
  time: string
  status?: "Completed" | "Running" | "Pending" | "Successful"
}

export type NotificationPreference = {
  key: string
  title: string
  description: string
  enabled: boolean
}

export type ProfileAggregate = {
  firstName: string
  lastName: string
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
  twoFactorEnabled: boolean
  passwordLastChanged: string
  activeSessions: number
  trustedDevices: number
  workspacesJoined: number
  workspacesOwned: number
  pendingInvites: number
  defaultWorkspace: string
  datasetsUploaded: number
  analysisJobsRun: number
  reportsGenerated: number
  reviewerTasks: number
  recentActivity: ActivityItem[]
  notificationPreferences: NotificationPreference[]
}

export type UpdateProfileInput = {
  firstName?: string
  lastName?: string
  institution?: string
  department?: string
  researchGroup?: string
  timezone?: string
}

export type UpdateNotificationPreferencesInput = {
  preferences: Array<{
    key: string
    enabled: boolean
  }>
}

export type SecuritySessionItem = {
  id: string
  name: string
  deviceType: 'desktop' | 'mobile' | 'tablet'
  location: string
  status: 'Current' | 'Active' | 'Revoked'
  createdAt: string
  isCurrent: boolean
  revokedAt?: string
}

export type ToggleTwoFactorInput = {
  enabled: boolean
}

export type ChangePasswordInput = {
  currentPassword: string
  newPassword: string
}

export type RevokeSessionInput = {
  reason?: string
}
export type RequestElevatedAccessInput = {
  reason?: string
}

export type RequestAccountDeletionInput = {
  reason?: string
}

export type WorkspaceMembershipItem = {
  workspaceId: string
  workspaceName: string
  role: string
  status: string
  memberCount: number
  datasetCount: number
  updatedAt: string
}

export type PendingInvitationItem = {
  id: string
  title: string
  description: string
  createdAt: string
  workspaceId?: string
  link?: string
}

export type PrivacyPolicyInfo = {
  termsUrl: string
  privacyUrl: string
  policyVersion: string
  updatedAt: string
  dataExportEnabled: boolean
  accountDeletionSupported: boolean
}
