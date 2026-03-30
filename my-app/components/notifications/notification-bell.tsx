"use client"

import * as React from "react"
import { Bell, CheckCheck, ExternalLink } from "lucide-react"
import Link from "next/link"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { ScrollArea } from "@/components/ui/scroll-area"
import { getUnreadCount, listNotifications, markAllNotificationsRead, markNotificationRead } from "@/lib/api/notifications"
import type { NotificationItem } from "@/types/notification"
import { formatRelativeDate } from "./notification-utils"
import { connectNotificationSocket } from "@/src/lib/notifications/socket"

function getStoredToken() {
  if (typeof window === "undefined") return null
  return window.localStorage.getItem("auth_token")
}

function decodeUserId(token: string): string | null {
  try {
    const [, payload] = token.split(".")
    if (!payload) return null
    const decoded = JSON.parse(atob(payload.replace(/-/g, "+").replace(/_/g, "/"))) as { id?: string }
    return decoded.id ?? null
  } catch {
    return null
  }
}

export function NotificationBell() {
  const [count, setCount] = React.useState(0)
  const [items, setItems] = React.useState<NotificationItem[]>([])
  const [loading, setLoading] = React.useState(true)

  const load = React.useCallback(async () => {
    setLoading(true)
    try {
      const [countRes, listRes] = await Promise.all([getUnreadCount(), listNotifications({ limit: 8 })])
      setCount(countRes.count)
      setItems(listRes.items)
    } finally {
      setLoading(false)
    }
  }, [])

  React.useEffect(() => {
    load()
  }, [load])

  React.useEffect(() => {
    const token = getStoredToken()
    if (!token) return

    const socket = connectNotificationSocket(token)
    const userId = decodeUserId(token)

    socket.on("connect", () => {
      if (userId) {
        socket.emit("notifications.join", { userId })
      }
    })

    const refresh = () => {
      void load()
    }

    const updateUnread = (payload?: { count?: number }) => {
      if (typeof payload?.count === "number") {
        setCount(payload.count)
      } else {
        void load()
      }
    }

    socket.on("notification.created", refresh)
    socket.on("notification.read", refresh)
    socket.on("notification.deleted", refresh)
    socket.on("notification.unread_count", updateUnread)

    socket.on("notification", refresh)
    socket.on("notification:unread-count", updateUnread)

    return () => {
      socket.off("notification.created", refresh)
      socket.off("notification.read", refresh)
      socket.off("notification.deleted", refresh)
      socket.off("notification.unread_count", updateUnread)
      socket.off("notification", refresh)
      socket.off("notification:unread-count", updateUnread)
      socket.disconnect()
    }
  }, [load])

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="outline" size="icon" className="relative rounded-2xl">
          <Bell className="h-4 w-4" />
          {count > 0 ? (
            <span className="absolute -right-1 -top-1 flex h-5 min-w-5 items-center justify-center rounded-full bg-primary px-1 text-[10px] font-semibold text-primary-foreground">
              {count > 99 ? "99+" : count}
            </span>
          ) : null}
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-[380px] rounded-2xl p-0">
        <DropdownMenuLabel className="flex items-center justify-between px-4 py-3">
          <div>
            <p className="text-sm font-semibold">Notifications</p>
            <p className="text-xs text-muted-foreground">Live updates from datasets, reviews, reports, and workspaces</p>
          </div>
          <Button
            variant="ghost"
            size="sm"
            className="h-8 rounded-xl"
            onClick={async () => {
              await markAllNotificationsRead()
              await load()
            }}
          >
            <CheckCheck className="mr-2 h-4 w-4" />
            Read all
          </Button>
        </DropdownMenuLabel>
        <DropdownMenuSeparator />
        <ScrollArea className="h-[360px]">
          <div className="p-2">
            {loading ? (
              <div className="space-y-2 p-2">
                {Array.from({ length: 4 }).map((_, i) => (
                  <div key={i} className="rounded-2xl border p-3">
                    <div className="mb-2 h-4 w-40 animate-pulse rounded bg-muted" />
                    <div className="h-3 w-full animate-pulse rounded bg-muted" />
                  </div>
                ))}
              </div>
            ) : items.length === 0 ? (
              <div className="p-8 text-center text-sm text-muted-foreground">No notifications yet.</div>
            ) : (
              items.map((item) => (
                <DropdownMenuItem
                  key={item.id}
                  className="mb-2 flex cursor-pointer flex-col items-start rounded-2xl border p-3 focus:bg-accent"
                  onClick={async () => {
                    if (item.status === "UNREAD") {
                      await markNotificationRead(item.id)
                      await load()
                    }
                  }}
                >
                  <div className="mb-1 flex w-full items-start justify-between gap-3">
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-semibold">{item.title}</span>
                      {item.status === "UNREAD" ? <Badge variant="secondary">New</Badge> : null}
                    </div>
                    <span className="text-xs text-muted-foreground">{formatRelativeDate(item.createdAt)}</span>
                  </div>
                  <p className="line-clamp-2 text-xs text-muted-foreground">{item.message}</p>
                  {item.actionUrl ? (
                    <Link href={item.actionUrl} className="mt-2 inline-flex items-center text-xs font-medium text-primary">
                      Open <ExternalLink className="ml-1 h-3 w-3" />
                    </Link>
                  ) : null}
                </DropdownMenuItem>
              ))
            )}
          </div>
        </ScrollArea>
        <DropdownMenuSeparator />
        <div className="flex items-center justify-between p-2">
          <Button asChild variant="ghost" className="w-full justify-between rounded-xl">
            <Link href="/dashboard/notifications">
              View all notifications
              <ExternalLink className="h-4 w-4" />
            </Link>
          </Button>
        </div>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
