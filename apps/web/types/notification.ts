export type NotificationCategory =
  | "SYSTEM"
  | "DATASET"
  | "WORKSPACE"
  | "COLLABORATION"
  | "REVIEW"
  | "REQUEST"
  | "ANALYSIS"
  | "REPORT"
  | "BILLING"
  | "SECURITY"

export type NotificationPriority = "LOW" | "NORMAL" | "HIGH" | "CRITICAL"
export type NotificationStatus = "UNREAD" | "READ" | "ARCHIVED"

export interface NotificationActor {
  id: string
  name: string | null
  email: string
  image?: string | null
}

export interface NotificationItem {
  id: string
  title: string
  message: string
  category: NotificationCategory
  priority: NotificationPriority
  status: NotificationStatus
  actionLabel?: string | null
  actionUrl?: string | null
  entityType?: string | null
  entityId?: string | null
  icon?: string | null
  metadata?: Record<string, unknown> | null
  readAt?: string | null
  archivedAt?: string | null
  createdAt: string
  updatedAt: string
  actor?: NotificationActor | null
}

export interface NotificationListResponse {
  items: NotificationItem[]
  nextCursor: string | null
  unreadCount: number
}

export interface NotificationPreferences {
  emailEnabled: boolean
  pushEnabled: boolean
  inAppEnabled: boolean
  datasetAlerts: boolean
  workspaceAlerts: boolean
  collaborationAlerts: boolean
  reviewAlerts: boolean
  analysisAlerts: boolean
  reportAlerts: boolean
  billingAlerts: boolean
  securityAlerts: boolean
  quietHoursStart?: string | null
  quietHoursEnd?: string | null
}
