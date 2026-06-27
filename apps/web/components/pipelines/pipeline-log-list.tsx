"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import type { PipelineEvent } from "@/src/lib/api/workspaces";

function formatTime(value?: string | null) {
  if (!value) {
    return "Pending";
  }

  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? value : date.toLocaleString();
}

export function PipelineLogList({ events }: { events: PipelineEvent[] }) {
  return (
    <Card className="rounded-2xl border-slate-200 bg-white shadow-sm">
      <CardHeader>
        <CardTitle>Live Event Log</CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        {events.length ? (
          events.map((event) => (
            <div className="rounded-xl border border-slate-200 p-3" key={event.id}>
              <div className="flex items-center justify-between gap-3">
                <p className="text-sm font-semibold text-slate-900">{event.eventType}</p>
                <span className="text-xs text-slate-500">{formatTime(event.createdAt)}</span>
              </div>
              <p className="mt-1 text-sm text-slate-600">{event.message}</p>
            </div>
          ))
        ) : (
          <div className="text-sm text-slate-500">No events yet.</div>
        )}
      </CardContent>
    </Card>
  );
}
