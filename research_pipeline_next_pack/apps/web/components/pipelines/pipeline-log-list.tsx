'use client';

import type { PipelineLogEvent } from '@/lib/types/pipeline';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

export function PipelineLogList({ logs }: { logs: PipelineLogEvent[] }) {
  return (
    <Card className="rounded-2xl">
      <CardHeader>
        <CardTitle>Live Event Log</CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        {logs.length === 0 ? (
          <p className="text-sm text-muted-foreground">No events yet.</p>
        ) : (
          logs.map((log) => (
            <div key={log.id} className="rounded-xl border p-3">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <p className="text-sm font-semibold">{log.message}</p>
                <p className="text-xs text-muted-foreground">
                  {new Date(log.timestamp).toLocaleString()}
                </p>
              </div>
              <p className="mt-1 text-xs text-muted-foreground">
                {log.type} {log.stage ? `• ${log.stage}` : ''}
              </p>
            </div>
          ))
        )}
      </CardContent>
    </Card>
  );
}
