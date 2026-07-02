import type { AnalysisJobLogEntry, AnalysisStreamEvent } from "@/types/analysis"

function renderStreamLine(event: AnalysisStreamEvent, index: number) {
  if (event.type === "job.log" && typeof event.payload === "object" && event.payload) {
    const payload = event.payload as Record<string, unknown>
    const level = String(payload.level ?? "INFO")
    const message = String(payload.message ?? "")
    return (
      <p key={`${event.jobId}-${index}`} className="font-mono text-xs">
        [{level}] {message}
      </p>
    )
  }

  return (
    <p key={`${event.jobId}-${index}`} className="font-mono text-xs text-muted-foreground">
      {event.type}
    </p>
  )
}

export function LiveLogPanel({
  logs,
  streamEvents,
}: {
  logs: AnalysisJobLogEntry[]
  streamEvents: AnalysisStreamEvent[]
}) {
  return (
    <section className="rounded-lg border">
      <header className="border-b px-3 py-2">
        <h3 className="text-sm font-semibold">Live Logs</h3>
      </header>
      <div className="max-h-96 space-y-1 overflow-auto px-3 py-2">
        {logs.map((log, index) => (
          <p key={`${log.id ?? "log"}-${index}`} className="font-mono text-xs">
            [{log.level}] {log.message}
          </p>
        ))}
        {streamEvents.map((event, index) => renderStreamLine(event, index))}
      </div>
    </section>
  )
}
