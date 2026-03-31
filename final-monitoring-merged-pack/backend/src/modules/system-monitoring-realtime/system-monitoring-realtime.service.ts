
import { Injectable } from "@nestjs/common";

@Injectable()
export class SystemMonitoringRealtimeService {
  buildSnapshot() {
    const now = new Date();
    const seconds = now.getSeconds();

    return {
      overview: {
        health: seconds % 20 === 0 ? "Warning" : "Healthy",
        uptime: "14d 6h 12m",
        environment: "Production",
        lastSync: now.toLocaleTimeString(),
        autoRefreshEnabled: true,
      },
      metrics: {
        apiLatencyMs: 100 + (seconds % 25),
        workerStatus: seconds % 30 === 0 ? "Degraded" : "Online",
        queueDepth: seconds % 4,
        failureRate: seconds % 10 === 0 ? 2 : 0,
        cpuLoad: 20 + (seconds % 18),
        memoryUsage: 40 + (seconds % 12),
      },
      queue: {
        queued: seconds % 4,
        processing: seconds % 3,
        failed: seconds % 10 === 0 ? 1 : 0,
        delayed: seconds % 5 === 0 ? 1 : 0,
        completed: 248 + seconds,
      },
      logs: [
        {
          id: `log-${now.getTime()}`,
          level: seconds % 10 === 0 ? "WARN" : "INFO",
          message: seconds % 10 === 0
            ? "Queue latency soft threshold crossed."
            : "Realtime heartbeat received.",
          source: seconds % 10 === 0 ? "queue-monitor" : "worker-cluster",
          time: now.toLocaleTimeString(),
        },
      ],
    };
  }
}
