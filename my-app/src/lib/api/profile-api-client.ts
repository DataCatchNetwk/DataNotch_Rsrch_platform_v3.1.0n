import { apiRequest } from './client'

export type ProfileDto = {
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

export type UpdateProfileDto = {
  firstName?: string
  lastName?: string
  institution?: string
  department?: string
  researchGroup?: string
  timezone?: string
}

export type ProfileStatsDto = {
  datasetsUploaded: number
  analysisJobsRun: number
  reportsGenerated: number
  workspacesJoined: number
  reviewerTasks: number
}

export type ProfileSecurityDto = {
  twoFactorEnabled: boolean
  passwordLastChanged: string
  activeSessions: number
  trustedDevices: number
}

export type ProfileWorkspaceDto = {
  defaultWorkspace: string
  workspacesJoined: number
  workspacesOwned: number
  pendingInvites: number
}

export type ActivityItemDto = {
  id: string
  type: 'Analysis' | 'Dataset' | 'Report' | 'Security' | 'Workspace'
  title: string
  meta: string
  time: string
  status?: 'Completed' | 'Running' | 'Pending' | 'Successful'
}

export type NotificationPreferenceDto = {
  key: string
  title: string
  description: string
  enabled: boolean
}

export type UpdateNotificationPreferencesDto = {
  preferences: Array<{
    key: string
    enabled: boolean
  }>
}

export type ProfileSessionDto = {
  id: string
  name: string
  deviceType: 'desktop' | 'mobile' | 'tablet'
  location: string
  status: 'Current' | 'Active' | 'Revoked'
  createdAt: string
  isCurrent: boolean
  revokedAt?: string
}

export type RevokeSessionDto = {
  reason?: string
}

export type ToggleTwoFactorDto = {
  enabled: boolean
}

export type ChangePasswordDto = {
  currentPassword: string
  newPassword: string
  confirmPassword: string
}

export async function getProfile() {
  return apiRequest<ProfileDto>('/v1/profile')
}

export async function updateProfile(body: UpdateProfileDto) {
  return apiRequest<ProfileDto>('/v1/profile', { method: 'PATCH', json: body })
}

export async function getProfileStats() {
  return apiRequest<ProfileStatsDto>('/v1/profile/stats')
}

export async function getProfileSecurity() {
  return apiRequest<ProfileSecurityDto>('/v1/profile/security')
}

export async function getProfileWorkspaces() {
  return apiRequest<ProfileWorkspaceDto>('/v1/profile/workspaces')
}

export async function getProfileActivity() {
  return apiRequest<ActivityItemDto[]>('/v1/profile/activity')
}

export async function getProfileNotificationPreferences() {
  return apiRequest<NotificationPreferenceDto[]>('/v1/profile/notifications')
}

export async function updateProfileNotificationPreferences(
  body: UpdateNotificationPreferencesDto
) {
  return apiRequest<NotificationPreferenceDto[]>('/v1/profile/notifications', {
    method: 'PATCH',
    json: body,
  })
}

export async function getProfileSessions() {
  return apiRequest<ProfileSessionDto[]>('/v1/profile/security/sessions')
}

export async function revokeProfileSession(sessionId: string, body: RevokeSessionDto = {}) {
  return apiRequest<{ success: boolean }>(`/v1/profile/security/sessions/${sessionId}/revoke`, {
    method: 'POST',
    json: body,
  })
}

export async function revokeOtherProfileSessions(body: RevokeSessionDto = {}) {
  return apiRequest<{ success: boolean; revokedCount: number }>('/v1/profile/security/sessions/revoke-others', {
    method: 'POST',
    json: body,
  })
}

export async function toggleProfileTwoFactor(body: ToggleTwoFactorDto) {
  return apiRequest<{ success: boolean; twoFactorEnabled: boolean }>('/v1/profile/security/2fa', {
    method: 'PATCH',
    json: body,
  })
}

export async function changeProfilePassword(body: ChangePasswordDto) {
  return apiRequest<{ success: boolean }>('/v1/profile/security/password', {
    method: 'POST',
    json: body,
  })
}
export type RequestElevatedAccessDto = {
  reason?: string
}

export type WorkspaceMembershipDto = {
  workspaceId: string
  workspaceName: string
  role: string
  status: string
  memberCount: number
  datasetCount: number
  updatedAt: string
}

export type PendingInvitationDto = {
  id: string
  title: string
  description: string
  createdAt: string
  workspaceId?: string
  link?: string
}

export type PrivacyPolicyDto = {
  termsUrl: string
  privacyUrl: string
  policyVersion: string
  updatedAt: string
  dataExportEnabled: boolean
  accountDeletionSupported: boolean
}

export type RequestAccountDeletionDto = {
  reason?: string
}

export async function requestElevatedProfileAccess(body: RequestElevatedAccessDto = {}) {
  return apiRequest<{ success: boolean; requestedAt: string }>('/v1/profile/access/elevated-request', {
    method: 'POST',
    json: body,
  })
}

export async function getProfileWorkspaceMemberships() {
  return apiRequest<WorkspaceMembershipDto[]>('/v1/profile/workspaces/list')
}

export async function getProfilePendingInvitations() {
  return apiRequest<PendingInvitationDto[]>('/v1/profile/workspaces/invitations')
}

export async function getProfilePrivacyPolicy() {
  return apiRequest<PrivacyPolicyDto>('/v1/profile/privacy/policy')
}

export async function requestProfileAccountDeletion(body: RequestAccountDeletionDto = {}) {
  return apiRequest<{ success: boolean; status: string; requestedAt: string }>('/v1/profile/privacy/request-deletion', {
    method: 'POST',
    json: body,
  })
}
