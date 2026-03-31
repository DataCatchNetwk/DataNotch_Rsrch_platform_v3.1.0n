
"use client";

import * as React from "react";
import {
  Activity,
  AlertTriangle,
  CheckCircle2,
  Download,
  RefreshCw,
  RotateCcw,
  ServerCog,
  ShieldCheck,
  Trash2,
} from "lucide-react";
import {
  Line,
  LineChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { MonitoringShell } from "@/components/admin-monitoring/monitoring-shell";
import { MonitoringError, MonitoringLoading } from "@/components/admin-monitoring/monitoring-states";
import { RealtimeToggle } from "@/components/admin-monitoring/realtime-toggle";
import { useSystemMonitoringSSE } from "@/hooks/use-system-monitoring-sse";
import { useSystemMonitoringWebSocket } from "@/hooks/use-system-monitoring-websocket";
import {
  clearMonitoringQueue,
  getMonitoringAlerts,
  getMonitoringLogs,
  getMonitoringMetrics,
  getMonitoringOverview,
  getMonitoringQueue,
  getMonitoringServices,
  refreshMonitoring,
  retryFailedJobs,
  type MonitoringAlert,
  type MonitoringLogItem,
  type MonitoringMetrics,
  type MonitoringOverview,
  type QueueBreakdown,
  type ServiceHealthItem,
} from "@/lib/api/system-monitoring-api-client";

type RealtimeMode = "off" | "sse" | "ws";

function healthBadge(health: MonitoringOverview["health"]) {
  if (health === "Healthy") {
    return <Badge className="border-emerald-200 bg-emerald-50 text-emerald-700">Healthy</Badge>;
  }
  if (health === "Warning") {
    return <Badge className="border-amber-200 bg-amber-50 text-amber-700">Warning</Badge>;
  }
  return <Badge className="border-red-200 bg-red-50 text-red-700">Critical</Badge>;
}

function serviceBadge(status: ServiceHealthItem["status"]) {
  if (status === "Online") {
    return <Badge className="border-emerald-200 bg-emerald-50 text-emerald-700">Online</Badge>;
  }
  if (status === "Degraded") {
    return <Badge className="border-amber-200 bg-amber-50 text-amber-700">Degraded</Badge>;
  }
  return <Badge className="border-red-200 bg-red-50 text-red-700">Offline</Badge>;
}

function logBadge(level: MonitoringLogItem["level"]) {
  if (level === "INFO") return <Badge variant="secondary">INFO</Badge>;
  if (level === "WARN") {
    return <Badge className="border-amber-200 bg-amber-50 text-amber-700">WARN</Badge>;
  }
  return <Badge className="border-red-200 bg-red-50 text-red-700">ERROR</Badge>;
}

function alertToneClass(tone: MonitoringAlert["tone"]) {
  switch (tone) {
    case "healthy":
      return "border-emerald-200 bg-emerald-50";
    case "warning":
      return "border-amber-200 bg-amber-50";
    case "critical":
      return "border-red-200 bg-red-50";
    default:
      return "border-slate-200 bg-slate-50";
  }
}

export default function SystemMonitoringPage() {
  const [overview, setOverview] = React.useState<MonitoringOverview | null>(null);
  const [alerts, setAlerts] = React.useState<MonitoringAlert[]>([]);
  const [metrics, setMetrics] = React.useState<MonitoringMetrics | null>(null);
  const [services, setServices] = React.useState<ServiceHealthItem[]>([]);
  const [queue, setQueue] = React.useState<QueueBreakdown | null>(null);
  const [logs, setLogs] = React.useState<MonitoringLogItem[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [actionLoading, setActionLoading] = React.useState<string | null>(null);
  const [error, setError] = React.useState<string | null>(null);
  const [realtimeMode, setRealtimeMode] = React.useState<RealtimeMode>("sse");

  const sse = useSystemMonitoringSSE(realtimeMode === "sse");
  const ws = useSystemMonitoringWebSocket(realtimeMode === "ws");

  const load = React.useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const [
        overviewRes,
        alertsRes,
        metricsRes,
        servicesRes,
        queueRes,
        logsRes,
      ] = await Promise.all([
        getMonitoringOverview(),
        getMonitoringAlerts(),
        getMonitoringMetrics(),
        getMonitoringServices(),
        getMonitoringQueue(),
        getMonitoringLogs(),
      ]);

      setOverview(overviewRes);
      setAlerts(alertsRes);
      setMetrics(metricsRes);
      setServices(servicesRes);
      setQueue(queueRes);
      setLogs(logsRes);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load monitoring.");
    } finally {
      setLoading(false);
    }
  }, []);

  React.useEffect(() => {
    void load();
  }, [load]);

  React.useEffect(() => {
    const payload =
      realtimeMode === "sse" ? sse.data : realtimeMode === "ws" ? ws.data : null;
    if (!payload) return;

    setOverview({
      health: payload.overview.health,
      uptime: payload.overview.uptime,
      environment: payload.overview.environment,
      lastSync: payload.overview.lastSync,
      autoRefreshEnabled: payload.overview.autoRefreshEnabled,
    });

    setMetrics((current) =>
      current
        ? {
            ...current,
            apiLatencyMs: payload.metrics.apiLatencyMs,
            workerStatus: payload.metrics.workerStatus,
            queueDepth: payload.metrics.queueDepth,
            failureRate: payload.metrics.failureRate,
            cpuLoad: payload.metrics.cpuLoad,
            memoryUsage: payload.metrics.memoryUsage,
          }
        : null,
    );

    setQueue({
      queued: payload.queue.queued,
      processing: payload.queue.processing,
      failed: payload.queue.failed,
      delayed: payload.queue.delayed,
      completed: payload.queue.completed,
    });

    setLogs((current) => {
      const merged = [...payload.logs, ...current];
      const deduped = Array.from(new Map(merged.map((item) => [item.id, item])).values());
      return deduped.slice(0, 12);
    });
  }, [realtimeMode, sse.data, ws.data]);

  React.useEffect(() => {
    const realtimeError =
      realtimeMode === "sse" ? sse.error : realtimeMode === "ws" ? ws.error : null;
    if (realtimeError) {
      setError(realtimeError);
    }
  }, [realtimeMode, sse.error, ws.error]);

  const runAction = async (key: string, fn: () => Promise<unknown>) => {
    setActionLoading(key);
    try {
      await fn();
      await load();
    } finally {
      setActionLoading(null);
    }
  };

  const realtimeConnected =
    realtimeMode === "sse"
      ? sse.connected
      : realtimeMode === "ws"
        ? ws.connected
        : false;

  return (
    <MonitoringShell>
      {loading ? (
        <MonitoringLoading />
      ) : error && !overview ? (
        <MonitoringError message={error} onRetry={() => void load()} />
      ) : overview && metrics && queue ? (
        <div className="space-y-6">
          <Card className="rounded-3xl border-0 shadow-sm">
            <CardContent className="flex flex-col gap-6 p-6 xl:flex-row xl:items-start xl:justify-between">
              <div>
                <p className="text-sm font-medium text-slate-500">Operations Overview</p>
                <h2 className="mt-2 text-3xl font-semibold tracking-tight text-slate-950">
                  System Health Control Plane
                </h2>
                <p className="mt-3 text-sm text-slate-600">
                  Live operational state for API, queues, workers, and services.
                </p>
                <div className="mt-4 flex flex-wrap gap-2">
                  <Badge variant="secondary">Uptime: {overview.uptime}</Badge>
                  <Badge variant="secondary">Environment: {overview.environment}</Badge>
                  <Badge variant="secondary">Last Sync: {overview.lastSync}</Badge>
                  {healthBadge(overview.health)}
                </div>
              </div>

              <div className="flex flex-col items-start gap-3 xl:items-end">
                <RealtimeToggle
                  mode={realtimeMode}
                  onModeChange={setRealtimeMode}
                  connected={realtimeConnected}
                />
                <div className="flex flex-wrap gap-2">
                  <Button
                    variant="outline"
                    onClick={() => void runAction("refresh", refreshMonitoring)}
                    disabled={actionLoading === "refresh"}
                  >
                    <RefreshCw className="mr-2 h-4 w-4" />
                    Refresh
                  </Button>
                  <Button
                    variant="outline"
                    onClick={() => void runAction("retry", retryFailedJobs)}
                    disabled={actionLoading === "retry"}
                  >
                    <RotateCcw className="mr-2 h-4 w-4" />
                    Retry Failed Jobs
                  </Button>
                  <Button
                    variant="destructive"
                    onClick={() => void runAction("clear", clearMonitoringQueue)}
                    disabled={actionLoading === "clear"}
                  >
                    <Trash2 className="mr-2 h-4 w-4" />
                    Clear Queue
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>

          {error ? <MonitoringError message={error} onRetry={() => void load()} /> : null}

          <section className="grid gap-4 xl:grid-cols-3">
            {alerts.map((item) => (
              <div
                key={item.id}
                className={`rounded-2xl border p-4 shadow-sm ${alertToneClass(item.tone)}`}
              >
                <div className="flex items-start gap-3">
                  {item.tone === "critical" ? (
                    <AlertTriangle className="mt-0.5 h-4 w-4 text-red-700" />
                  ) : item.tone === "warning" ? (
                    <Activity className="mt-0.5 h-4 w-4 text-amber-700" />
                  ) : (
                    <CheckCircle2 className="mt-0.5 h-4 w-4 text-emerald-700" />
                  )}
                  <div>
                    <p className="font-semibold text-slate-950">{item.title}</p>
                    <p className="mt-1 text-sm text-slate-600">{item.text}</p>
                  </div>
                </div>
              </div>
            ))}
          </section>

          <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
            {[
              ["API Latency (ms)", metrics.apiLatencyMs, "Current request latency"],
              ["Worker Status", metrics.workerStatus, "Worker runtime state"],
              ["Queue Depth", metrics.queueDepth, "Pending and in-flight jobs"],
              ["Failure Rate (%)", metrics.failureRate, "Error ratio across recent jobs"],
              ["CPU Load (%)", metrics.cpuLoad, "Application compute usage"],
              ["Memory Usage (%)", metrics.memoryUsage, "Current memory pressure"],
            ].map(([label, value, helper]) => (
              <Card key={String(label)} className="rounded-2xl border-0 shadow-sm">
                <CardContent className="p-5">
                  <p className="text-sm font-medium text-slate-500">{label}</p>
                  <p className="mt-3 text-4xl font-semibold tracking-tight text-slate-950">
                    {String(value)}
                  </p>
                  <p className="mt-2 text-sm text-slate-600">{helper}</p>
                </CardContent>
              </Card>
            ))}
          </section>

          <section className="grid gap-6 xl:grid-cols-[1.35fr_0.65fr]">
            <div className="space-y-6">
              <Card className="rounded-2xl border-0 shadow-sm">
                <CardHeader>
                  <CardTitle>Trend Monitoring</CardTitle>
                  <CardDescription>
                    Rolling activity across latency, CPU, memory, and queue depth.
                  </CardDescription>
                </CardHeader>
                <CardContent className="grid gap-6 xl:grid-cols-2">
                  {[
                    ["API Latency", metrics.apiLatencyTrend],
                    ["CPU Load", metrics.cpuTrend],
                    ["Memory Usage", metrics.memoryTrend],
                    ["Queue Depth", metrics.queueTrend],
                  ].map(([title, data]) => (
                    <div key={String(title)} className="space-y-3">
                      <p className="text-sm font-medium text-slate-700">{String(title)}</p>
                      <div className="h-56 rounded-2xl border bg-white p-3">
                        <ResponsiveContainer width="100%" height="100%">
                          <LineChart data={data as any[]}>
                            <CartesianGrid strokeDasharray="3 3" />
                            <XAxis dataKey="label" />
                            <YAxis />
                            <Tooltip />
                            <Line type="monotone" dataKey="value" strokeWidth={2} dot={false} />
                          </LineChart>
                        </ResponsiveContainer>
                      </div>
                    </div>
                  ))}
                </CardContent>
              </Card>

              <Card className="rounded-2xl border-0 shadow-sm">
                <CardHeader>
                  <CardTitle>Service Health</CardTitle>
                  <CardDescription>
                    Component-level runtime visibility for the platform stack.
                  </CardDescription>
                </CardHeader>
                <CardContent className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
                  {services.map((service) => (
                    <div key={service.key} className="rounded-2xl border bg-white p-4">
                      <div className="flex items-center justify-between gap-2">
                        <p className="font-medium text-slate-950">{service.title}</p>
                        {serviceBadge(service.status)}
                      </div>
                      <p className="mt-2 text-sm text-slate-600">{service.helper}</p>
                    </div>
                  ))}
                </CardContent>
              </Card>
            </div>

            <div className="space-y-6">
              <Card className="rounded-2xl border-0 shadow-sm">
                <CardHeader>
                  <CardTitle>Queue Inspector</CardTitle>
                  <CardDescription>
                    Breakdown of current queue state across execution stages.
                  </CardDescription>
                </CardHeader>
                <CardContent className="grid gap-3">
                  {[
                    ["Queued", queue.queued],
                    ["Processing", queue.processing],
                    ["Failed", queue.failed],
                    ["Delayed", queue.delayed],
                    ["Completed", queue.completed],
                  ].map(([label, value]) => (
                    <div
                      key={String(label)}
                      className="flex items-center justify-between rounded-2xl border bg-slate-50 p-4"
                    >
                      <span className="text-sm font-medium text-slate-700">{label}</span>
                      <span className="text-xl font-semibold text-slate-950">{String(value)}</span>
                    </div>
                  ))}
                </CardContent>
              </Card>

              <Card className="rounded-2xl border-0 shadow-sm">
                <CardHeader>
                  <CardTitle>Live Activity & Logs</CardTitle>
                  <CardDescription>
                    Recent runtime events, warnings, and service-level messages.
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-3">
                  {logs.map((log) => (
                    <div key={log.id} className="rounded-2xl border bg-white p-4">
                      <div className="flex items-center justify-between gap-3">
                        <div className="flex items-center gap-2">
                          {logBadge(log.level)}
                          <span className="text-sm font-medium text-slate-800">{log.source}</span>
                        </div>
                        <span className="text-xs text-slate-500">{log.time}</span>
                      </div>
                      <p className="mt-2 text-sm text-slate-700">{log.message}</p>
                    </div>
                  ))}
                </CardContent>
              </Card>

              <Card className="rounded-2xl border-0 shadow-sm">
                <CardHeader>
                  <CardTitle>Operations Actions</CardTitle>
                  <CardDescription>
                    Immediate operational actions for admins on duty.
                  </CardDescription>
                </CardHeader>
                <CardContent className="grid gap-2">
                  <Button variant="outline" className="justify-start">
                    <ServerCog className="mr-2 h-4 w-4" />
                    Restart Worker Cluster
                  </Button>
                  <Button variant="outline" className="justify-start">
                    <ShieldCheck className="mr-2 h-4 w-4" />
                    Run Health Check
                  </Button>
                  <Button variant="outline" className="justify-start">
                    <Download className="mr-2 h-4 w-4" />
                    Export Monitoring Logs
                  </Button>
                </CardContent>
              </Card>
            </div>
          </section>
        </div>
      ) : null}
    </MonitoringShell>
  );
}
