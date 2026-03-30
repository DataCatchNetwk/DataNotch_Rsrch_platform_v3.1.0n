"use client"

import { Badge } from "@/components/ui/badge"

export function AnalysisStreamStatus({
  connected,
  isTerminal,
}: {
  connected: boolean
  isTerminal: boolean
}) {
  if (isTerminal) return <Badge variant="outline">Stream closed</Badge>
  return connected ? <Badge>Live stream connected</Badge> : <Badge variant="secondary">Reconnecting…</Badge>
}
