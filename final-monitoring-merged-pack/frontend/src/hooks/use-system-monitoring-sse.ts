
"use client";

import * as React from "react";
import { RealtimeMonitoringPayload } from "@/lib/api/system-monitoring-realtime-client";

const API_BASE = process.env.NEXT_PUBLIC_API_BASE_URL?.replace(/\/$/, "") ?? "http://localhost:4000";
const API_PREFIX = "/api/v1";

export function useSystemMonitoringSSE(enabled = true) {
  const [data, setData] = React.useState<RealtimeMonitoringPayload | null>(null);
  const [connected, setConnected] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);

  React.useEffect(() => {
    if (!enabled) return;

    const url = `${API_BASE}${API_PREFIX}/system-monitoring/stream`;
    const es = new EventSource(url, { withCredentials: true });

    es.onopen = () => {
      setConnected(true);
      setError(null);
    };

    es.onmessage = (event) => {
      try {
        const parsed = JSON.parse(event.data) as RealtimeMonitoringPayload;
        setData(parsed);
      } catch {
        setError("Failed to parse realtime monitoring payload.");
      }
    };

    es.onerror = () => {
      setConnected(false);
      setError("Realtime SSE connection lost.");
      es.close();
    };

    return () => {
      es.close();
      setConnected(false);
    };
  }, [enabled]);

  return { data, connected, error };
}
