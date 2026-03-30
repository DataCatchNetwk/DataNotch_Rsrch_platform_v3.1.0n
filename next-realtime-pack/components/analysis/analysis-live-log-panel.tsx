"use client"

import * as React from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import type { AnalysisJobLogEntry } from "@/types/analysis"

export function AnalysisLiveLogPanel({ logs }: { logs: AnalysisJobLogEntry[] }) {
  const endRef = React.useRef<HTMLDivElement | null>(null)

  React.useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: "smooth" })
  }, [logs])

  return (
    <Card className="rounded-2xl shadow-sm">
      <CardHeader>
        <CardTitle>Live Logs</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="max-h-[420px] overflow-auto rounded-xl border bg-black p-4 font-mono text-xs text-zinc-100">
          {logs.length ? (
            <div className="space-y-2">
              {logs.map((log) => (
                <div key={log.id} className="whitespace-pre-wrap break-words">
                  <span className="text-zinc-400">[{log.timestamp}]</span>{" "}
                  <span className="text-cyan-300">{log.level}</span>{" "}
                  <span>{log.message}</span>
                </div>
              ))}
              <div ref={endRef} />
            </div>
          ) : (
            <div className="text-zinc-400">Awaiting job logs…</div>
          )}
        </div>
      </CardContent>
    </Card>
  )
}
