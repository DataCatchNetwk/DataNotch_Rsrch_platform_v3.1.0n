
"use client";

import * as React from "react";
import { RealtimeMonitoringPayload } from "@/lib/api/system-monitoring-realtime-client";

const WS_BASE = process.env.NEXT_PUBLIC_WS_BASE_URL?.replace(/\/$/, "") ?? "ws://localhost:4000";

export function useSystemMonitoringWebSocket(enabled = false) {
  const [data, setData] = React.useState<RealtimeMonitoringPayload | null>(null);
  const [connected, setConnected] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);

  React.useEffect(() => {
    if (!enabled) return;

    const ws = new WebSocket(`${WS_BASE}/system-monitoring`);

    ws.onopen = () => {
      setConnected(true);
      setError(null);
    };

    ws.onmessage = (event) => {
      try {
        const parsed = JSON.parse(event.data) as RealtimeMonitoringPayload;
        setData(parsed);
      } catch {
        setError("Failed to parse WebSocket monitoring payload.");
      }
    };

    ws.onerror = () => {
      setError("Realtime WebSocket connection error.");
    };

    ws.onclose = () => {
      setConnected(false);
    };

    return () => {
      ws.close();
      setConnected(false);
    };
  }, [enabled]);

  return { data, connected, error };
}
