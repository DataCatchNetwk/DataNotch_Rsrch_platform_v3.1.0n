import type { NotificationListResponse, NotificationPreferences } from "@/types/notification"
import { apiRequest } from "@/src/lib/api/client"

type LegacyListShape = { notifications?: NotificationListResponse["items"] }
type LegacyUnreadShape = number | { count?: number; unreadCount?: number }

export async function listNotifications(params?: {
  cursor?: string
  limit?: number
  status?: "UNREAD" | "READ" | "ARCHIVED"
  category?: string
}) {
  const qs = new URLSearchParams()
  if (params?.cursor) qs.set("cursor", params.cursor)
  if (params?.limit) qs.set("limit", String(params.limit))
  if (params?.status) qs.set("status", params.status)
  if (params?.category) qs.set("category", params.category)

  const query = qs.toString()
  const path = `/notifications${query ? `?${query}` : ""}`
  const data = await apiRequest<NotificationListResponse | LegacyListShape>(path)

  // Support both the current typed API shape and legacy `{ notifications: [...] }`.
  if ("items" in (data as NotificationListResponse)) {
    return data as NotificationListResponse
  }

  const items = (data as LegacyListShape).notifications ?? []
  return {
    items,
    nextCursor: null,
    unreadCount: items.filter((item) => item.status === "UNREAD").length,
  }
}

export async function getUnreadCount() {
  const data = await apiRequest<LegacyUnreadShape>(`/notifications/unread-count`)

  if (typeof data === "number") {
    return { count: data }
  }

  if (typeof data?.count === "number") {
    return { count: data.count }
  }

  if (typeof data?.unreadCount === "number") {
    return { count: data.unreadCount }
  }

  return { count: 0 }
}

export async function markNotificationRead(id: string) {
  return apiRequest(`/notifications/${id}/read`, { method: "PATCH" })
}

export async function markAllNotificationsRead() {
  return apiRequest(`/notifications/read-all`, { method: "PATCH" })
}

export async function archiveAllReadNotifications() {
  return apiRequest(`/notifications/archive-all-read`, { method: "PATCH" })
}

export async function deleteNotification(id: string) {
  return apiRequest(`/notifications/${id}`, { method: "DELETE" })
}

export async function getNotificationPreferences() {
  return apiRequest<NotificationPreferences>(`/notifications/preferences`)
}

export async function updateNotificationPreferences(payload: Partial<NotificationPreferences>) {
  return apiRequest<NotificationPreferences>(`/notifications/preferences`, {
    method: "PATCH",
    json: payload,
  })
}
