"use client"

import Link from "next/link"
import type { SupportTicket } from "@/lib/types/support"

const columns = ["OPEN", "TRIAGED", "IN_PROGRESS", "WAITING_FOR_USER", "RESOLVED"] as const

export function SupportTicketKanban({ tickets }: { tickets: SupportTicket[] }) {
  return (
    <div className="grid gap-4 lg:grid-cols-5">
      {columns.map((column) => {
        const grouped = tickets.filter((t) => t.status === column)
        return (
          <div key={column} className="rounded-2xl border bg-muted/20 p-3">
            <div className="mb-3 flex items-center justify-between">
              <h3 className="text-sm font-semibold">{column.replaceAll("_", " ")}</h3>
              <span className="text-xs text-muted-foreground">{grouped.length}</span>
            </div>

            <div className="space-y-3">
              {grouped.map((ticket) => (
                <Link
                  href={`/admin/support/${ticket.id}`}
                  key={ticket.id}
                  className="block rounded-xl border bg-background p-3 shadow-sm transition hover:shadow"
                >
                  <div className="text-xs text-muted-foreground">{ticket.ticketNumber}</div>
                  <div className="mt-1 font-medium">{ticket.subject}</div>
                  <div className="mt-2 text-xs text-muted-foreground">{ticket.requesterEmail}</div>
                </Link>
              ))}
            </div>
          </div>
        )
      })}
    </div>
  )
}
