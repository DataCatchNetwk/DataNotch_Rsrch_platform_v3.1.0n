import { Badge } from "@/components/ui/badge"

type StreamState = "connecting" | "open" | "closed" | "error"

const config: Record<StreamState, { label: string; variant: "default" | "secondary" | "destructive" | "outline" }> = {
  connecting: { label: "Connecting", variant: "secondary" },
  open: { label: "Live", variant: "default" },
  closed: { label: "Closed", variant: "outline" },
  error: { label: "Error", variant: "destructive" },
}

export function StreamStatusBadge({ state }: { state: StreamState }) {
  const item = config[state]
  return <Badge variant={item.variant}>{item.label}</Badge>
}
