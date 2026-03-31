'use client';

import {
  RefreshCw,
  RotateCcw,
  Trash2,
} from 'lucide-react';
import { ProtectedRoute } from '@/components/protected-route';
import { MonitoringAlertsStrip } from '@/components/admin-monitoring/alerts-strip';
import { MonitoringControlPlaneHero } from '@/components/admin-monitoring/control-plane-hero';
import { MonitoringLogsPanel } from '@/components/admin-monitoring/logs-panel';
import { MonitoringMetricsGrid } from '@/components/admin-monitoring/metrics-grid';
import { MonitoringOperationsActionsCard } from '@/components/admin-monitoring/operations-actions-card';
import { MonitoringServiceHealthSection } from '@/components/admin-monitoring/service-health-section';
import { MonitoringQueueInspector } from '@/components/admin-monitoring/queue-inspector';
import { MonitoringShell } from '@/components/admin-monitoring/monitoring-shell';
import { MonitoringError, MonitoringLoading } from '@/components/admin-monitoring/monitoring-states';
import { MonitoringTrendSection } from '@/components/admin-monitoring/trend-section';
import {
  clearMonitoringQueue,
  refreshMonitoring,
  retryFailedJobs,
} from '@/lib/api/system-monitoring-api-client';
import { useMonitoringPageData } from '@/hooks/use-monitoring-page-data';
import { useMonitoringRealtimeController } from '@/hooks/use-monitoring-realtime-controller';
import { toast } from 'sonner';

function MonitoringContent() {
  const {
    overview,
    alerts,
    metrics,
    services,
    queue,
    logs,
    loading,
    actionLoading,
    error,
    load,
    applyRealtimeSnapshot,
    runAction,
  } = useMonitoringPageData();

  const {
    realtimeMode,
    handleRealtimeModeChange,
    realtimeConnected,
    realtimeError,
    healthPanel,
  } = useMonitoringRealtimeController({ onSnapshot: applyRealtimeSnapshot });

  const handleAction = async (key: string, fn: () => Promise<{ ok: true; message: string }>) => {
    try {
      const result = await runAction(key, fn);
      toast.success(result.message);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Monitoring action failed.');
    }
  };

  return (
    <MonitoringShell>
      {loading ? <MonitoringLoading /> : error ? <MonitoringError message={error} onRetry={() => void load()} /> : overview && metrics && queue ? (
        <div className="space-y-5">
          <MonitoringControlPlaneHero
            overview={overview}
            realtimeMode={realtimeMode}
            onRealtimeModeChange={handleRealtimeModeChange}
            realtimeConnected={realtimeConnected}
            realtimeError={realtimeError}
            healthPanel={healthPanel}
            actionLoading={actionLoading}
            onRefresh={() => void handleAction('refresh', refreshMonitoring)}
            onRetryFailed={() => void handleAction('retry', retryFailedJobs)}
            onClearQueue={() => void handleAction('clear', clearMonitoringQueue)}
            refreshIcon={<RefreshCw className="mr-2 h-4 w-4" />}
            retryIcon={<RotateCcw className="mr-2 h-4 w-4" />}
            clearIcon={<Trash2 className="mr-2 h-4 w-4" />}
          />

          <MonitoringAlertsStrip alerts={alerts} />

          <MonitoringMetricsGrid metrics={metrics} />

          <section className="grid gap-5 xl:grid-cols-[1.35fr_0.65fr]">
            <div className="space-y-5">
              <MonitoringTrendSection metrics={metrics} />

              <MonitoringServiceHealthSection services={services} />
            </div>

            <div className="space-y-5">
              <MonitoringQueueInspector queue={queue} />

              <MonitoringLogsPanel logs={logs} />

              <MonitoringOperationsActionsCard
                onRestartWorkers={() => toast.info('Worker restart requires infrastructure orchestration access.')}
                onRunHealthCheck={() => void handleAction('refresh-inline', refreshMonitoring)}
                onExportLogs={() => toast.info('Monitoring logs export endpoint can be added in a follow-up.')}
              />
            </div>
          </section>
        </div>
      ) : null}
    </MonitoringShell>
  );
}

export default function MonitoringPage() {
  return (
    <ProtectedRoute allowedRoles={['ADMIN', 'SUPER_ADMIN']}>
      <MonitoringContent />
    </ProtectedRoute>
  );
}