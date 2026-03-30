'use client';

import * as React from 'react';
import Link from 'next/link';
import {
  Bell,
  BellRing,
  CheckCheck,
  Filter,
  FolderOpen,
  ShieldAlert,
  Trash2,
  FlaskConical,
  Users,
  FileText,
} from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { archiveAllReadNotifications, deleteNotification, listNotifications, markAllNotificationsRead, markNotificationRead } from '@/lib/api/notifications';
import { NotificationCategory, NotificationItem, NotificationStatus } from '@/types/notification';
import { categoryTone, formatRelativeDate } from './notification-utils';

function iconForCategory(category: NotificationCategory) {
  switch (category) {
    case 'WORKSPACE':
    case 'COLLABORATION':
      return Users;
    case 'DATASET':
      return FolderOpen;
    case 'ANALYSIS':
      return FlaskConical;
    case 'REPORT':
      return FileText;
    case 'SECURITY':
      return ShieldAlert;
    default:
      return BellRing;
  }
}

export function NotificationsPage() {
  const [items, setItems] = React.useState<NotificationItem[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [status, setStatus] = React.useState<NotificationStatus | 'ALL'>('ALL');
  const [category, setCategory] = React.useState<NotificationCategory | 'ALL'>('ALL');
  const [search, setSearch] = React.useState('');
  const [unreadCount, setUnreadCount] = React.useState(0);

  const load = React.useCallback(async () => {
    setLoading(true);
    try {
      const res = await listNotifications({
        limit: 50,
        ...(status !== 'ALL' ? { status } : {}),
        ...(category !== 'ALL' ? { category } : {}),
      });
      setItems(res.items);
      setUnreadCount(res.unreadCount);
    } finally {
      setLoading(false);
    }
  }, [status, category]);

  React.useEffect(() => {
    load();
  }, [load]);

  const visible = React.useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return items;
    return items.filter((item) =>
      [item.title, item.message, item.category].join(' ').toLowerCase().includes(q),
    );
  }, [items, search]);

  const stats = React.useMemo(() => {
    const total = items.length;
    const unread = items.filter((i) => i.status === 'UNREAD').length;
    const critical = items.filter((i) => i.priority === 'CRITICAL').length;
    const actionRequired = items.filter((i) => !!i.actionUrl).length;
    return { total, unread, critical, actionRequired };
  }, [items]);

  return (
    <div className="space-y-6 p-6">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Notifications</h1>
          <p className="text-sm text-muted-foreground">
            Track datasets, workspaces, review decisions, analysis jobs, reports, and platform alerts in one place.
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button variant="outline" className="rounded-2xl" onClick={() => markAllNotificationsRead().then(load)}>
            <CheckCheck className="mr-2 h-4 w-4" />
            Mark all as read
          </Button>
          <Button variant="outline" className="rounded-2xl" onClick={() => archiveAllReadNotifications().then(load)}>
            Archive read
          </Button>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <Card className="rounded-3xl">
          <CardHeader className="pb-2"><CardDescription>Total</CardDescription><CardTitle>{stats.total}</CardTitle></CardHeader>
        </Card>
        <Card className="rounded-3xl">
          <CardHeader className="pb-2"><CardDescription>Unread</CardDescription><CardTitle>{stats.unread}</CardTitle></CardHeader>
        </Card>
        <Card className="rounded-3xl">
          <CardHeader className="pb-2"><CardDescription>Critical</CardDescription><CardTitle>{stats.critical}</CardTitle></CardHeader>
        </Card>
        <Card className="rounded-3xl">
          <CardHeader className="pb-2"><CardDescription>Action Required</CardDescription><CardTitle>{stats.actionRequired}</CardTitle></CardHeader>
        </Card>
      </div>

      <Card className="rounded-3xl">
        <CardContent className="flex flex-col gap-4 p-4 lg:flex-row lg:items-center lg:justify-between">
          <div className="flex flex-1 items-center gap-3">
            <div className="relative w-full max-w-md">
              <Input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search notifications"
                className="rounded-2xl"
              />
            </div>
            <Button variant="outline" className="rounded-2xl">
              <Filter className="mr-2 h-4 w-4" />
              Filters
            </Button>
          </div>
          <Tabs value={status} onValueChange={(v) => setStatus(v as NotificationStatus | 'ALL')}>
            <TabsList className="rounded-2xl">
              <TabsTrigger value="ALL">All</TabsTrigger>
              <TabsTrigger value="UNREAD">Unread</TabsTrigger>
              <TabsTrigger value="READ">Read</TabsTrigger>
              <TabsTrigger value="ARCHIVED">Archived</TabsTrigger>
            </TabsList>
          </Tabs>
        </CardContent>
      </Card>

      <div className="grid gap-6 xl:grid-cols-[280px_minmax(0,1fr)]">
        <Card className="rounded-3xl">
          <CardHeader>
            <CardTitle className="text-base">Categories</CardTitle>
            <CardDescription>Focus on the alerts that matter most.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-2">
            {(['ALL', 'DATASET', 'WORKSPACE', 'COLLABORATION', 'REVIEW', 'ANALYSIS', 'REPORT', 'SECURITY', 'SYSTEM'] as const).map((entry) => (
              <button
                key={entry}
                onClick={() => setCategory(entry as NotificationCategory | 'ALL')}
                className={`flex w-full items-center justify-between rounded-2xl border px-3 py-2 text-sm transition hover:bg-accent ${category === entry ? 'bg-accent' : ''}`}
              >
                <span>{entry}</span>
                {entry === 'ALL' ? <Badge variant="secondary">{items.length}</Badge> : null}
              </button>
            ))}
          </CardContent>
        </Card>

        <Card className="rounded-3xl">
          <CardHeader className="border-b pb-4">
            <div className="flex items-center justify-between gap-3">
              <div>
                <CardTitle className="text-base">Inbox</CardTitle>
                <CardDescription>{unreadCount} unread notifications</CardDescription>
              </div>
              <Badge variant="secondary" className="rounded-full px-3 py-1">
                <Bell className="mr-1 h-3.5 w-3.5" /> Live
              </Badge>
            </div>
          </CardHeader>
          <CardContent className="p-0">
            <ScrollArea className="h-[720px]">
              {loading ? (
                <div className="space-y-3 p-4">
                  {Array.from({ length: 6 }).map((_, i) => (
                    <div key={i} className="rounded-3xl border p-4">
                      <div className="mb-2 h-5 w-52 animate-pulse rounded bg-muted" />
                      <div className="mb-2 h-4 w-full animate-pulse rounded bg-muted" />
                      <div className="h-4 w-24 animate-pulse rounded bg-muted" />
                    </div>
                  ))}
                </div>
              ) : visible.length === 0 ? (
                <div className="flex min-h-[420px] flex-col items-center justify-center gap-3 p-8 text-center">
                  <div className="rounded-full border p-4"><Bell className="h-6 w-6" /></div>
                  <h3 className="text-lg font-semibold">No notifications found</h3>
                  <p className="max-w-md text-sm text-muted-foreground">
                    You are all caught up. New alerts from datasets, workspaces, analysis jobs, and reports will appear here.
                  </p>
                </div>
              ) : (
                visible.map((item, index) => {
                  const Icon = iconForCategory(item.category);
                  return (
                    <React.Fragment key={item.id}>
                      <div className="flex gap-4 p-5 transition hover:bg-muted/40">
                        <div className="mt-1 rounded-2xl border p-2"><Icon className="h-5 w-5" /></div>
                        <div className="min-w-0 flex-1">
                          <div className="mb-2 flex flex-wrap items-center gap-2">
                            <h3 className="text-sm font-semibold">{item.title}</h3>
                            <Badge className={`rounded-full ${categoryTone(item.category)}`}>{item.category}</Badge>
                            {item.status === 'UNREAD' ? <Badge variant="secondary">Unread</Badge> : null}
                            {item.priority === 'CRITICAL' ? <Badge variant="destructive">Critical</Badge> : null}
                          </div>
                          <p className="mb-3 text-sm text-muted-foreground">{item.message}</p>
                          <div className="flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
                            <span>{formatRelativeDate(item.createdAt)}</span>
                            {item.actor?.name ? <span>• by {item.actor.name}</span> : null}
                          </div>
                          <div className="mt-4 flex flex-wrap gap-2">
                            {item.actionUrl ? (
                              <Button asChild size="sm" className="rounded-xl">
                                <Link href={item.actionUrl}>{item.actionLabel || 'Open'}</Link>
                              </Button>
                            ) : null}
                            {item.status === 'UNREAD' ? (
                              <Button variant="outline" size="sm" className="rounded-xl" onClick={() => markNotificationRead(item.id).then(load)}>
                                Mark read
                              </Button>
                            ) : null}
                            <Button variant="ghost" size="sm" className="rounded-xl text-muted-foreground" onClick={() => deleteNotification(item.id).then(load)}>
                              <Trash2 className="mr-2 h-4 w-4" />
                              Remove
                            </Button>
                          </div>
                        </div>
                      </div>
                      {index < visible.length - 1 ? <Separator /> : null}
                    </React.Fragment>
                  );
                })
              )}
            </ScrollArea>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
