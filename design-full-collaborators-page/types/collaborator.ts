export type CollaboratorStatus = "ACTIVE" | "INVITED" | "SUSPENDED" | "INACTIVE"
export type CollaboratorType =
  | "INTERNAL"
  | "EXTERNAL"
  | "STUDENT"
  | "REVIEWER"
  | "PI"
  | "ANALYST"

export type WorkspaceRole = "OWNER" | "ADMIN" | "RESEARCHER" | "REVIEWER" | "VIEWER"

export interface CollaboratorWorkspaceMembership {
  workspaceId: string
  workspaceName: string
  role: WorkspaceRole
}

export interface CollaboratorPermission {
  key: string
  label: string
}

export interface CollaboratorItem {
  id: string
  name: string
  email: string
  institution: string
  department?: string
  avatarUrl?: string | null
  type: CollaboratorType
  status: CollaboratorStatus
  primaryRole: WorkspaceRole
  lastActiveAt: string
  workspaces: CollaboratorWorkspaceMembership[]
  permissions: CollaboratorPermission[]
  membershipCount: number
  complianceTags: string[]
}

export interface InviteItem {
  id: string
  email: string
  invitedBy: string
  workspaceName: string
  role: WorkspaceRole
  sentAt: string
  expiresAt: string
  status: "PENDING" | "EXPIRED"
}

export interface CollaboratorSummaryStats {
  totalCollaborators: number
  activeWorkspaces: number
  pendingInvites: number
  ownersAndAdmins: number
  externalCollaborators: number
  viewOnlyMembers: number
}
