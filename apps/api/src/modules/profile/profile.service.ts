import { NotificationSeverity, NotificationType, WorkspaceRole } from '@prisma/client'
import { prisma } from '../../db/prisma.js'
import { HttpError } from '../../utils/errors.js'
import { hashPassword, verifyPassword } from '../../utils/password.js'
import { logAudit } from '../../services/audit.service.js'
import type {
  ActivityItem,
  ChangePasswordInput,
  NotificationPreference,
  PendingInvitationItem,
  PrivacyPolicyInfo,
  ProfileAggregate,
  RequestAccountDeletionInput,
  RequestElevatedAccessInput,
  RevokeSessionInput,
  SecuritySessionItem,
  ToggleTwoFactorInput,
  UpdateNotificationPreferencesInput,
  UpdateProfileInput,
  WorkspaceMembershipItem,
} from './profile.types.js'

type AuthUser = {
  id: string
  email: string
}

const DEFAULT_NOTIFICATION_PREFERENCES: NotificationPreference[] = [
  {
    key: 'jobComplete',
    title: 'Job completion alerts',
    description: 'Notify me when an analysis job completes.',
    enabled: true,
  },
  {
    key: 'jobFailed',
    title: 'Failed job alerts',
    description: 'Notify me when a job fails or is cancelled.',
    enabled: true,
  },
  {
    key: 'reviewerAssigned',
    title: 'Reviewer assignments',
    description: 'Notify me when a reviewer task is assigned.',
    enabled: true,
  },
  {
    key: 'workspaceInvites',
    title: 'Workspace invitations',
    description: 'Notify me about collaborator and workspace invites.',
    enabled: true,
  },
  {
    key: 'securityAlerts',
    title: 'Security alerts',
    description: 'Notify me about new sign-ins and sensitive changes.',
    enabled: true,
  },
  {
    key: 'productUpdates',
    title: 'Product updates',
    description: 'Send occasional product and release updates.',
    enabled: false,
  },
]

function formatLongDate(value: Date) {
  return new Intl.DateTimeFormat('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  }).format(value)
}

function formatActivityTime(value: Date) {
  return new Intl.DateTimeFormat('en-US', {
    month: 'short',
    day: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
  }).format(value)
}

function formatDateTime(value: Date) {
  return new Intl.DateTimeFormat('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
  }).format(value)
}

function formatRoleLabel(value: string) {
  return value
    .toLowerCase()
    .split('_')
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(' ')
}

function getPrimaryRole(roleNames: string[]) {
  const order = ['ADMIN', 'ANALYST', 'PENDING']
  return order.find((role) => roleNames.includes(role)) ?? roleNames[0] ?? 'USER'
}

function getDominantWorkspaceRole(roles: WorkspaceRole[]) {
  const order: WorkspaceRole[] = ['OWNER', 'ADMIN', 'RESEARCHER', 'VIEWER']
  return order.find((role) => roles.includes(role)) ?? 'VIEWER'
}

function deriveAccessLevel(role: WorkspaceRole) {
  switch (role) {
    case 'OWNER':
    case 'ADMIN':
      return 'Full'
    case 'RESEARCHER':
      return 'Restricted'
    case 'VIEWER':
    default:
      return 'Read Only'
  }
}

function mergeNotificationPreferences(raw: unknown): NotificationPreference[] {
  const base = DEFAULT_NOTIFICATION_PREFERENCES.map((item) => ({ ...item }))
  if (!Array.isArray(raw)) {
    return base
  }

  const overrides = new Map<string, boolean>()
  for (const item of raw) {
    if (
      item &&
      typeof item === 'object' &&
      'key' in item &&
      typeof item.key === 'string' &&
      'enabled' in item &&
      typeof item.enabled === 'boolean'
    ) {
      overrides.set(item.key, item.enabled)
    }
  }

  return base.map((item) => ({
    ...item,
    enabled: overrides.get(item.key) ?? item.enabled,
  }))
}

function mapAnalysisStatus(status: string): ActivityItem['status'] {
  switch (status) {
    case 'SUCCEEDED':
      return 'Completed'
    case 'RUNNING':
      return 'Running'
    case 'QUEUED':
      return 'Pending'
    case 'FAILED':
    case 'CANCELLED':
      return 'Pending'
    default:
      return undefined
  }
}

function mapReportStatus(status: string): ActivityItem['status'] {
  if (status === 'READY') return 'Successful'
  if (status === 'DRAFT') return 'Pending'
  return undefined
}

function mapNotificationStatus(type: NotificationType): ActivityItem['status'] {
  if (type === 'MEMBER_ADDED') return 'Pending'
  return 'Successful'
}

export class ProfileService {
  async getProfile(user: AuthUser) {
    return this.buildAggregate(user)
  }

  async updateProfile(user: AuthUser, input: UpdateProfileInput) {
    const existing = await prisma.user.findUnique({ where: { id: user.id }, select: { id: true } })
    if (!existing) {
      throw new HttpError(404, 'User not found')
    }

    await prisma.user.update({
      where: { id: user.id },
      data: {
        ...(input.firstName !== undefined ? { firstname: input.firstName } : {}),
        ...(input.lastName !== undefined ? { surname: input.lastName } : {}),
        ...(input.institution !== undefined ? { institution: input.institution } : {}),
        ...(input.department !== undefined ? { department: input.department } : {}),
        ...(input.researchGroup !== undefined ? { researchGroup: input.researchGroup } : {}),
        ...(input.timezone !== undefined ? { timezone: input.timezone } : {}),
      },
    })

    return this.buildAggregate(user)
  }

  async getStats(user: AuthUser) {
    return this.buildAggregate(user)
  }

  async getSecurity(user: AuthUser) {
    return this.buildAggregate(user)
  }

  async getWorkspaces(user: AuthUser) {
    return this.buildAggregate(user)
  }

  async getActivity(user: AuthUser) {
    const aggregate = await this.buildAggregate(user)
    return aggregate.recentActivity
  }

  async getNotificationPreferences(user: AuthUser) {
    const aggregate = await this.buildAggregate(user)
    return aggregate.notificationPreferences
  }

  async updateNotificationPreferences(
    user: AuthUser,
    input: UpdateNotificationPreferencesInput
  ) {
    const merged = DEFAULT_NOTIFICATION_PREFERENCES.map((item) => ({
      ...item,
      enabled: input.preferences.find((preference) => preference.key === item.key)?.enabled ?? item.enabled,
    }))

    await prisma.user.update({
      where: { id: user.id },
      data: {
        notificationPreferences: merged,
      },
    })

    return merged
  }

  async listSessions(user: AuthUser): Promise<SecuritySessionItem[]> {
    const [logins, revocations] = await Promise.all([
      prisma.auditLog.findMany({
        where: { userId: user.id, action: 'LOGIN' },
        orderBy: { createdAt: 'desc' },
        take: 20,
      }),
      prisma.auditLog.findMany({
        where: { userId: user.id, action: 'REVOKE_SESSION', entity: 'Session' },
        orderBy: { createdAt: 'desc' },
      }),
    ])

    const revokedBySessionId = new Map<string, Date>()
    for (const revokeEvent of revocations) {
      if (revokeEvent.entityId) {
        revokedBySessionId.set(revokeEvent.entityId, revokeEvent.createdAt)
      }
    }

    return logins.map((login, index) => {
      const metadata = login.metadata && typeof login.metadata === 'object' ? (login.metadata as Record<string, unknown>) : undefined
      const userAgent = typeof metadata?.userAgent === 'string' ? metadata.userAgent : ''
      const ip = typeof metadata?.ipAddress === 'string' ? metadata.ipAddress : 'Unknown location'
      const revokedAt = revokedBySessionId.get(login.id)
      const isCurrent = index === 0 && !revokedAt

      return {
        id: login.id,
        name: this.getSessionName(userAgent),
        deviceType: this.getDeviceType(userAgent),
        location: ip,
        status: revokedAt ? 'Revoked' : isCurrent ? 'Current' : 'Active',
        createdAt: login.createdAt.toISOString(),
        isCurrent,
        ...(revokedAt ? { revokedAt: revokedAt.toISOString() } : {}),
      }
    })
  }

  async revokeSession(user: AuthUser, sessionId: string, input: RevokeSessionInput) {
    const session = await prisma.auditLog.findFirst({
      where: { id: sessionId, userId: user.id, action: 'LOGIN' },
      select: { id: true },
    })

    if (!session) {
      throw new HttpError(404, 'Session not found')
    }

    const existing = await prisma.auditLog.findFirst({
      where: { userId: user.id, action: 'REVOKE_SESSION', entity: 'Session', entityId: sessionId },
      select: { id: true },
    })

    if (!existing) {
      await logAudit({
        userId: user.id,
        action: 'REVOKE_SESSION',
        entity: 'Session',
        entityId: sessionId,
        metadata: {
          reason: input.reason ?? 'Revoked by user',
        },
      })
    }

    return { success: true }
  }

  async revokeOtherSessions(user: AuthUser, input: RevokeSessionInput) {
    const sessions = await prisma.auditLog.findMany({
      where: { userId: user.id, action: 'LOGIN' },
      orderBy: { createdAt: 'desc' },
      take: 20,
      select: { id: true },
    })

    if (sessions.length <= 1) {
      return { success: true, revokedCount: 0 }
    }

    const currentSessionId = sessions[0]?.id
    const targetSessionIds = sessions
      .map((session) => session.id)
      .filter((sessionId) => sessionId !== currentSessionId)

    const existingRevocations = await prisma.auditLog.findMany({
      where: {
        userId: user.id,
        action: 'REVOKE_SESSION',
        entity: 'Session',
        entityId: { in: targetSessionIds },
      },
      select: { entityId: true },
    })

    const alreadyRevoked = new Set(existingRevocations.map((item) => item.entityId).filter(Boolean) as string[])
    const toRevoke = targetSessionIds.filter((sessionId) => !alreadyRevoked.has(sessionId))

    if (toRevoke.length) {
      await prisma.auditLog.createMany({
        data: toRevoke.map((sessionId) => ({
          userId: user.id,
          action: 'REVOKE_SESSION',
          entity: 'Session',
          entityId: sessionId,
          metadata: {
            reason: input.reason ?? 'Revoke all other sessions',
          },
        })),
      })
    }

    return { success: true, revokedCount: toRevoke.length }
  }

  async setTwoFactor(user: AuthUser, input: ToggleTwoFactorInput) {
    await prisma.user.update({
      where: { id: user.id },
      data: { twoFactorEnabled: input.enabled },
    })

    await logAudit({
      userId: user.id,
      action: input.enabled ? 'ENABLE_2FA' : 'DISABLE_2FA',
      entity: 'User',
      entityId: user.id,
    })

    return { success: true, twoFactorEnabled: input.enabled }
  }

  async changePassword(user: AuthUser, input: ChangePasswordInput) {
    const profileUser = await prisma.user.findUnique({
      where: { id: user.id },
      select: { id: true, passwordHash: true },
    })

    if (!profileUser) {
      throw new HttpError(404, 'User not found')
    }

    const valid = await verifyPassword(input.currentPassword, profileUser.passwordHash)
    if (!valid) {
      throw new HttpError(400, 'Current password is incorrect')
    }

    if (input.currentPassword === input.newPassword) {
      throw new HttpError(400, 'New password must be different from current password')
    }

    await prisma.user.update({
      where: { id: user.id },
      data: {
        passwordHash: await hashPassword(input.newPassword),
        passwordChangedAt: new Date(),
      },
    })

    await logAudit({
      userId: user.id,
      action: 'CHANGE_PASSWORD',
      entity: 'User',
      entityId: user.id,
    })

    return { success: true }
  }

  async requestElevatedAccess(user: AuthUser, input: RequestElevatedAccessInput) {
    await logAudit({
      userId: user.id,
      action: 'REQUEST_ELEVATED_ACCESS',
      entity: 'User',
      entityId: user.id,
      metadata: {
        reason: input.reason ?? 'Request submitted from profile',
      },
    })

    await this.notifyAdminUsers(
      user.id,
      'Elevated access request',
      `${user.email} requested elevated access permissions.`
    )

    return { success: true, requestedAt: new Date().toISOString() }
  }

  async listWorkspaceMemberships(user: AuthUser): Promise<WorkspaceMembershipItem[]> {
    const memberships = await prisma.workspaceMember.findMany({
      where: { userId: user.id, isActive: true },
      include: {
        workspace: {
          select: {
            id: true,
            name: true,
            status: true,
            updatedAt: true,
            _count: {
              select: {
                members: true,
                datasets: true,
              },
            },
          },
        },
      },
      orderBy: { updatedAt: 'desc' },
    })

    return memberships.map((membership) => ({
      workspaceId: membership.workspace.id,
      workspaceName: membership.workspace.name,
      role: formatRoleLabel(membership.role),
      status: formatRoleLabel(membership.workspace.status),
      memberCount: membership.workspace._count.members,
      datasetCount: membership.workspace._count.datasets,
      updatedAt: membership.workspace.updatedAt.toISOString(),
    }))
  }

  async listPendingInvitations(user: AuthUser): Promise<PendingInvitationItem[]> {
    const invites = await prisma.notification.findMany({
      where: {
        userId: user.id,
        type: 'MEMBER_ADDED',
        isRead: false,
      },
      orderBy: { createdAt: 'desc' },
      take: 20,
    })

    return invites.map((invite) => ({
      id: invite.id,
      title: invite.title,
      description: invite.description,
      createdAt: invite.createdAt.toISOString(),
      ...(invite.workspaceId ? { workspaceId: invite.workspaceId } : {}),
      ...(invite.link ? { link: invite.link } : {}),
    }))
  }

  getPrivacyPolicy(): PrivacyPolicyInfo {
    return {
      termsUrl: process.env.PROFILE_TERMS_URL ?? 'https://datanotchplatform.org/terms',
      privacyUrl: process.env.PROFILE_PRIVACY_URL ?? 'https://datanotchplatform.org/privacy',
      policyVersion: process.env.PROFILE_POLICY_VERSION ?? 'v1.0',
      updatedAt: process.env.PROFILE_POLICY_UPDATED_AT ?? '2026-03-01T00:00:00.000Z',
      dataExportEnabled: true,
      accountDeletionSupported: true,
    }
  }

  async requestAccountDeletion(user: AuthUser, input: RequestAccountDeletionInput) {
    await logAudit({
      userId: user.id,
      action: 'REQUEST_ACCOUNT_DELETION',
      entity: 'User',
      entityId: user.id,
      metadata: {
        reason: input.reason ?? 'Request submitted from profile',
      },
    })

    await this.notifyAdminUsers(
      user.id,
      'Account deletion request',
      `${user.email} requested account deletion review.`
    )

    return {
      success: true,
      status: 'PENDING_REVIEW',
      requestedAt: new Date().toISOString(),
    }
  }

  private async notifyAdminUsers(requesterUserId: string, title: string, description: string) {
    const adminUsers = await prisma.user.findMany({
      where: {
        id: { not: requesterUserId },
        roles: {
          some: {
            role: {
              name: 'ADMIN',
            },
          },
        },
      },
      select: { id: true },
    })

    if (!adminUsers.length) {
      return
    }

    await prisma.notification.createMany({
      data: adminUsers.map((admin) => ({
        userId: admin.id,
        type: NotificationType.REQUEST_CREATED,
        title,
        description,
        severity: NotificationSeverity.WARNING,
      })),
    })
  }

  private getDeviceType(userAgent: string): SecuritySessionItem['deviceType'] {
    const ua = userAgent.toLowerCase()
    if (ua.includes('ipad') || ua.includes('tablet')) {
      return 'tablet'
    }
    if (ua.includes('mobile') || ua.includes('iphone') || ua.includes('android')) {
      return 'mobile'
    }
    return 'desktop'
  }

  private getSessionName(userAgent: string) {
    if (!userAgent) {
      return 'Browser Session'
    }

    const isChrome = /chrome/i.test(userAgent)
    const isFirefox = /firefox/i.test(userAgent)
    const isSafari = /safari/i.test(userAgent) && !/chrome/i.test(userAgent)
    const isEdge = /edg/i.test(userAgent)

    if (isEdge) return 'Edge Session'
    if (isChrome) return 'Chrome Session'
    if (isFirefox) return 'Firefox Session'
    if (isSafari) return 'Safari Session'
    return 'Browser Session'
  }

  private async buildAggregate(user: AuthUser): Promise<ProfileAggregate> {
    const [
      profileUser,
      ownedWorkspaces,
      datasetCount,
      analysisCount,
      reportCount,
      reviewNotificationCount,
      pendingInviteCount,
      activeSessionCount,
      recentAnalysisJobs,
      recentDatasets,
      recentReports,
      recentNotifications,
      recentSecurityEvents,
    ] = await Promise.all([
      prisma.user.findUnique({
        where: { id: user.id },
        include: {
          roles: { include: { role: true } },
          workspaceMemberships: {
            where: { isActive: true },
            include: {
              workspace: {
                select: { id: true, name: true, updatedAt: true },
              },
            },
            orderBy: { updatedAt: 'desc' },
          },
        },
      }),
      prisma.workspace.count({ where: { ownerId: user.id } }),
      prisma.dataset.count({ where: { createdById: user.id } }),
      prisma.analysisJob.count({ where: { createdById: user.id } }),
      prisma.report.count({ where: { createdById: user.id } }),
      prisma.notification.count({
        where: {
          userId: user.id,
          type: { in: ['REQUEST_CREATED', 'REQUEST_REVIEWED', 'REQUEST_COMMENT'] },
        },
      }),
      prisma.notification.count({
        where: { userId: user.id, type: 'MEMBER_ADDED', isRead: false },
      }),
      prisma.auditLog.count({
        where: {
          userId: user.id,
          action: 'LOGIN',
          createdAt: { gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000) },
        },
      }),
      prisma.analysisJob.findMany({
        where: { createdById: user.id },
        orderBy: { updatedAt: 'desc' },
        take: 5,
      }),
      prisma.dataset.findMany({
        where: { createdById: user.id },
        orderBy: { updatedAt: 'desc' },
        take: 5,
        include: { workspace: { select: { name: true } } },
      }),
      prisma.report.findMany({
        where: { createdById: user.id },
        orderBy: { updatedAt: 'desc' },
        take: 5,
      }),
      prisma.notification.findMany({
        where: { userId: user.id },
        orderBy: { createdAt: 'desc' },
        take: 5,
      }),
      prisma.auditLog.findMany({
        where: { userId: user.id, action: 'LOGIN' },
        orderBy: { createdAt: 'desc' },
        take: 5,
      }),
    ])

    if (!profileUser) {
      throw new HttpError(404, 'User not found')
    }

    const roleNames = profileUser.roles.map((entry) => entry.role.name)
    const primaryRole = getPrimaryRole(roleNames)
    const workspaceRole = getDominantWorkspaceRole(
      profileUser.workspaceMemberships.map((membership) => membership.role)
    )
    const latestLogin = profileUser.lastLoginAt ?? recentSecurityEvents[0]?.createdAt ?? profileUser.createdAt
    const workspacesJoined = profileUser.workspaceMemberships.length
    const defaultWorkspace = profileUser.workspaceMemberships[0]?.workspace.name ?? 'No workspace assigned'
    const notificationPreferences = mergeNotificationPreferences(profileUser.notificationPreferences)
    const recentActivity = [
      ...recentAnalysisJobs.map((job) => ({
        sortAt: job.updatedAt,
        item: {
          id: `analysis-${job.id}`,
          type: 'Analysis' as const,
          title: job.name,
          meta: `Analysis job ${job.status.toLowerCase()}${job.jobType ? ` • ${job.jobType}` : ''}`,
          time: formatActivityTime(job.updatedAt),
          status: mapAnalysisStatus(job.status),
        },
      })),
      ...recentDatasets.map((dataset) => ({
        sortAt: dataset.updatedAt,
        item: {
          id: `dataset-${dataset.id}`,
          type: 'Dataset' as const,
          title: dataset.name,
          meta: `Uploaded to ${dataset.workspace.name}`,
          time: formatActivityTime(dataset.updatedAt),
          status: 'Successful' as const,
        },
      })),
      ...recentReports.map((report) => ({
        sortAt: report.updatedAt,
        item: {
          id: `report-${report.id}`,
          type: 'Report' as const,
          title: report.title,
          meta: `${formatRoleLabel(report.reportType)} report updated`,
          time: formatActivityTime(report.updatedAt),
          status: mapReportStatus(report.status),
        },
      })),
      ...recentNotifications.map((notification) => ({
        sortAt: notification.createdAt,
        item: {
          id: `notification-${notification.id}`,
          type: notification.type === 'MEMBER_ADDED' ? ('Workspace' as const) : ('Security' as const),
          title: notification.title,
          meta: notification.description,
          time: formatActivityTime(notification.createdAt),
          status: mapNotificationStatus(notification.type),
        },
      })),
      ...recentSecurityEvents.map((audit) => ({
        sortAt: audit.createdAt,
        item: {
          id: `security-${audit.id}`,
          type: 'Security' as const,
          title: 'New sign-in',
          meta: 'Account authenticated successfully',
          time: formatActivityTime(audit.createdAt),
          status: 'Successful' as const,
        },
      })),
    ]
      .sort((left, right) => right.sortAt.getTime() - left.sortAt.getTime())
      .slice(0, 8)
      .map((entry) => entry.item)

    return {
      firstName: profileUser.firstname,
      lastName: profileUser.surname,
      email: profileUser.email,
      role: primaryRole,
      institution: profileUser.institution ?? 'DataNotch Research Platform',
      department: profileUser.department ?? 'Not provided',
      researchGroup: profileUser.researchGroup ?? 'Not assigned',
      timezone: profileUser.timezone ?? 'UTC',
      memberSince: formatLongDate(profileUser.createdAt),
      lastLogin: formatDateTime(latestLogin),
      accountStatus: roleNames.includes('PENDING') ? 'Pending Review' : 'Active',
      workspaceRole: formatRoleLabel(workspaceRole),
      accessLevel: deriveAccessLevel(workspaceRole),
      reviewAccess: reviewNotificationCount > 0 || primaryRole === 'ADMIN' ? 'Enabled' : 'Limited',
      approvalAuthority:
        workspaceRole === 'OWNER' || workspaceRole === 'ADMIN' || primaryRole === 'ADMIN'
          ? 'Workspace-level'
          : 'None',
      twoFactorEnabled: profileUser.twoFactorEnabled,
      passwordLastChanged: formatLongDate(profileUser.passwordChangedAt ?? profileUser.createdAt),
      activeSessions: Math.max(activeSessionCount, 1),
      trustedDevices: Math.min(Math.max(activeSessionCount, 1), 3),
      workspacesJoined,
      workspacesOwned: ownedWorkspaces,
      pendingInvites: pendingInviteCount,
      defaultWorkspace,
      datasetsUploaded: datasetCount,
      analysisJobsRun: analysisCount,
      reportsGenerated: reportCount,
      reviewerTasks: reviewNotificationCount,
      recentActivity,
      notificationPreferences,
    }
  }
}