'use client';

import * as React from 'react';
import { Bell, CheckCheck, ExternalLink } from 'lucide-react';
import Link from 'next/link';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuHeader,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { getUnreadCount, listNotifications, markAllNotificationsRead, markNotificationRead } from '@/lib/api/notifications';
import { NotificationItem } from '@/types/notification';
import { formatRelativeDate } from './notification-utils';

export function NotificationBell() {
  const [count, setCount] = React.useState(0);
  const [items, setItems] = React.useState<NotificationItem[]>([]);
  const [loading, setLoading] = React.useState(true);

  const load = React.useCallback(async () => {
    setLoading(true);
    try {
      const [countRes, listRes] = await Promise.all([
        getUnreadCount(),
        listNotifications({ limit: 8 }),
      ]);
      setCount(countRes.count);
      setItems(listRes.items);
    } finally {
      setLoading(false);
    }
  }, []);

  React.useEffect(() => {
    load();
  }, [load]);

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="outline" size="icon" className="relative rounded-2xl">
          <Bell className="h-4 w-4" />
          {count > 0 ? (
            <span className="absolute -right-1 -top-1 flex h-5 min-w-5 items-center justify-center rounded-full bg-primary px-1 text-[10px] font-semibold text-primary-foreground">
              {count > 99 ? '99+' : count}
            </span>
          ) : null}
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-[380px] rounded-2xl p-0">
        <DropdownMenuHeader className="flex items-center justify-between px-4 py-3">
          <div>
            <p className="text-sm font-semibold">Notifications</p>
            <p className="text-xs text-muted-foreground">Live updates from datasets, reviews, reports, and workspaces</p>
          </div>
          <Button
            variant="ghost"
            size="sm"
            className="h-8 rounded-xl"
            onClick={async () => {
              await markAllNotificationsRead();
              await load();
            }}
          >
            <CheckCheck className="mr-2 h-4 w-4" />
            Read all
          </Button>
        </DropdownMenuHeader>
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
                    if (item.status === 'UNREAD') {
                      await markNotificationRead(item.id);
                      await load();
                    }
                  }}
                >
                  <div className="mb-1 flex w-full items-start justify-between gap-3">
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-semibold">{item.title}</span>
                      {item.status === 'UNREAD' ? <Badge variant="secondary">New</Badge> : null}
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
            <Link href="/notifications">
              View all notifications
              <ExternalLink className="h-4 w-4" />
            </Link>
          </Button>
        </div>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
