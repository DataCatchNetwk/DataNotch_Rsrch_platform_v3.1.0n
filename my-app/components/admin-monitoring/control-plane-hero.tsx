'use client';

import { LogOut } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { RealtimeToggle } from '@/components/admin-monitoring/realtime-toggle';
import type { MonitoringOverview } from '@/lib/api/system-monitoring-api-client';
import { useAuth } from '@/lib/auth-context';
import Link from 'next/link';

function healthBadge(health: MonitoringOverview['health']) {
  if (health === 'Healthy') return <Badge className="border-emerald-200 bg-emerald-50 text-emerald-700">Healthy</Badge>;
  if (health === 'Warning') return <Badge className="border-amber-200 bg-amber-50 text-amber-700">Warning</Badge>;
  return <Badge className="border-red-200 bg-red-50 text-red-700">Critical</Badge>;
}

export function MonitoringControlPlaneHero({
  overview,
  realtimeMode,
  onRealtimeModeChange,
  realtimeConnected,
  realtimeError,
  healthPanel,
  actionLoading,
  onRefresh,
  onRetryFailed,
  onClearQueue,
  refreshIcon,
  retryIcon,
  clearIcon,
}: {
  overview: MonitoringOverview;
  realtimeMode: 'off' | 'sse' | 'ws';
  onRealtimeModeChange: (mode: 'off' | 'sse' | 'ws') => void;
  realtimeConnected: boolean;
  realtimeError: string | null;
  healthPanel: {
    modeLabel: string;
    connectionLabel: string;
    lastEventLabel: string;
    autoRecoveryLabel: string;
    recoveryProgressLabel: string | null;
    fallbackNotice: string | null;
    showRecoveryProgress: boolean;
  };
  actionLoading: string | null;
  onRefresh: () => void;
  onRetryFailed: () => void;
  onClearQueue: () => void;
  refreshIcon: React.ReactNode;
  retryIcon: React.ReactNode;
  clearIcon: React.ReactNode;
}) {
  const { logout } = useAuth();
  const router = useRouter();

  function handleSignOut() {
    logout();
    router.push('/admin');
  }

  return (
    <Card className="rounded-xl border-0 shadow-sm">
      <CardContent className="flex flex-col gap-5 p-4 md:p-5 xl:flex-row xl:items-start xl:justify-between">
        <div>
          <p className="text-sm font-medium text-slate-500">Operations Overview</p>
          <h2 className="mt-1.5 text-2xl font-semibold tracking-tight text-slate-950 md:text-3xl">System Health Control Plane</h2>
          <p className="mt-2 text-sm text-slate-600">Live operational state for API, queues, workers, and services.</p>
          <div className="mt-3 flex flex-wrap gap-2">
            <Badge variant="secondary">Uptime: {overview.uptime}</Badge>
            <Badge variant="secondary">Environment: {overview.environment}</Badge>
            <Badge variant="secondary">Last Sync: {overview.lastSync}</Badge>
            {healthBadge(overview.health)}
          </div>
          <div className="mt-3 flex flex-wrap items-center gap-2">
            <RealtimeToggle mode={realtimeMode} onModeChange={onRealtimeModeChange} connected={realtimeConnected} />
            {realtimeError ? <Badge className="border-red-200 bg-red-50 text-red-700">{realtimeError}</Badge> : null}
          </div>
          <div className="mt-2 rounded-lg border bg-white px-3 py-2 text-xs text-slate-600">
            <div className="flex flex-wrap items-center gap-x-4 gap-y-1">
              <span>Mode: <span className="font-semibold text-slate-800">{healthPanel.modeLabel}</span></span>
              <span>Connection: <span className="font-semibold text-slate-800">{healthPanel.connectionLabel}</span></span>
              <span>Last Event: <span className="font-semibold text-slate-800">{healthPanel.lastEventLabel}</span></span>
              <span>Auto Recovery: <span className="font-semibold text-slate-800">{healthPanel.autoRecoveryLabel}</span></span>
              {healthPanel.showRecoveryProgress ? <span>Recovery: <span className="font-semibold text-slate-800">{healthPanel.recoveryProgressLabel}</span></span> : null}
            </div>
            {healthPanel.fallbackNotice ? <p className="mt-1 text-amber-700">{healthPanel.fallbackNotice}</p> : null}
          </div>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button asChild variant="secondary">
            <Link href="/admin">Return to Admin Console</Link>
          </Button>
          <Button variant="outline" onClick={onRefresh} disabled={actionLoading === 'refresh'}>
            {refreshIcon}Refresh
          </Button>
          <Button variant="outline" onClick={onRetryFailed} disabled={actionLoading === 'retry'}>
            {retryIcon}Retry Failed Jobs
          </Button>
          <div className="flex flex-col items-end gap-1.5">
            <Button variant="destructive" onClick={onClearQueue} disabled={actionLoading === 'clear'}>
              {clearIcon}Clear Queue
            </Button>
            <Button variant="ghost" size="sm" className="w-full justify-end" onClick={handleSignOut}>
              <LogOut className="mr-2 h-4 w-4" />
              Sign Out
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}