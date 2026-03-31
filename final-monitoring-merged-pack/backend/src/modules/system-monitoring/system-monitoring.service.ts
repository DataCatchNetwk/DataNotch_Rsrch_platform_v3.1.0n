
import { Injectable } from "@nestjs/common";

@Injectable()
export class SystemMonitoringService {
  async overview() {
    return {
      health: "Healthy",
      uptime: "14d 6h 12m",
      environment: "Production",
      lastSync: new Date().toLocaleTimeString(),
      autoRefreshEnabled: true,
    };
  }

  async alerts() {
    return [
      {
        id: "a1",
        title: "Approvals Queue",
        text: "No pending registration approvals right now.",
        tone: "healthy",
        ctaPath: "/admin/registrations",
      },
      {
        id: "a2",
        title: "Security Watch",
        text: "2 recent high-value login events need review.",
        tone: "warning",
        ctaPath: "/admin/audit",
      },
      {
        id: "a3",
        title: "Worker Queue",
        text: "Job queue is stable and below threshold.",
        tone: "healthy",
        ctaPath: "/admin/monitoring",
      },
    ];
  }

  async metrics() {
    const trend = (values: number[]) =>
      values.map((value, i) => ({ label: `T${i + 1}`, value }));

    return {
      apiLatencyMs: 118,
      workerStatus: "Online",
      queueDepth: 0,
      failureRate: 0,
      cpuLoad: 25,
      memoryUsage: 40,
      apiLatencyTrend: trend([102, 112, 109, 118, 121, 115]),
      cpuTrend: trend([20, 24, 22, 25, 28, 25]),
      memoryTrend: trend([34, 35, 36, 38, 39, 40]),
      queueTrend: trend([1, 0, 2, 1, 0, 0]),
    };
  }

  async services() {
    return [
      { key: "api", title: "API Service", status: "Online", helper: "Primary HTTP service is responsive." },
      { key: "workers", title: "Worker Cluster", status: "Online", helper: "Background workers are healthy." },
      { key: "database", title: "Database", status: "Online", helper: "PostgreSQL connectivity is stable." },
      { key: "redis", title: "Redis Cache", status: "Online", helper: "Queue broker and cache are available." },
      { key: "storage", title: "Object Storage", status: "Degraded", helper: "Uploads responding with mild latency." },
      { key: "integrations", title: "External Integrations", status: "Online", helper: "External connectors are healthy." },
    ];
  }

  async queue() {
    return {
      queued: 0,
      processing: 0,
      failed: 0,
      delayed: 0,
      completed: 248,
    };
  }

  async logs() {
    return [
      {
        id: "l1",
        level: "INFO",
        message: "Health check completed successfully.",
        source: "api-service",
        time: "2 min ago",
      },
      {
        id: "l2",
        level: "WARN",
        message: "Object storage latency crossed soft threshold.",
        source: "storage-adapter",
        time: "9 min ago",
      },
      {
        id: "l3",
        level: "INFO",
        message: "Worker heartbeat received.",
        source: "worker-cluster",
        time: "11 min ago",
      },
    ];
  }

  async refresh() {
    return { ok: true as const, message: "Monitoring snapshot refreshed." };
  }

  async retryFailed() {
    return { ok: true as const, message: "Retry for failed jobs has been triggered." };
  }

  async clearQueue() {
    return { ok: true as const, message: "Monitoring queue clear operation completed." };
  }
}
