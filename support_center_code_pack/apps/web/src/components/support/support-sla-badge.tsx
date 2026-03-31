import { Badge } from "@/components/ui/badge"
import type { SupportTicket } from "@/lib/types/support"

export function SupportSlaBadge({ ticket }: { ticket: SupportTicket }) {
  const ageMs = Date.now() - new Date(ticket.createdAt).getTime()
  const ageHours = ageMs / (1000 * 60 * 60)

  let label = "Healthy"
  let variant: "default" | "secondary" | "destructive" | "outline" = "secondary"

  if (ageHours >= 24 && !ticket.firstResponseAt) {
    label = "SLA Risk"
    variant = "destructive"
  } else if (ageHours >= 8 && !ticket.firstResponseAt) {
    label = "Due Soon"
    variant = "outline"
  }

  return <Badge variant={variant}>{label}</Badge>
}
