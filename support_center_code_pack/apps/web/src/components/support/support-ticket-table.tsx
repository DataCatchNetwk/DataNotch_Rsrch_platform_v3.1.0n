"use client"

import Link from "next/link"
import type { SupportTicket } from "@/lib/types/support"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { SupportSlaBadge } from "./support-sla-badge"

export function SupportTicketTable({ tickets }: { tickets: SupportTicket[] }) {
  return (
    <div className="overflow-hidden rounded-2xl border">
      <table className="w-full text-sm">
        <thead className="bg-muted/40">
          <tr className="text-left">
            <th className="px-4 py-3">Ticket</th>
            <th className="px-4 py-3">Requester</th>
            <th className="px-4 py-3">Category</th>
            <th className="px-4 py-3">Priority</th>
            <th className="px-4 py-3">Status</th>
            <th className="px-4 py-3">SLA</th>
            <th className="px-4 py-3">Assigned</th>
            <th className="px-4 py-3">Action</th>
          </tr>
        </thead>
        <tbody>
          {tickets.map((ticket) => (
            <tr key={ticket.id} className="border-t align-top">
              <td className="px-4 py-4">
                <div className="font-medium">{ticket.ticketNumber}</div>
                <div className="text-muted-foreground">{ticket.subject}</div>
              </td>
              <td className="px-4 py-4">
                <div>{ticket.requesterName || "Unknown"}</div>
                <div className="text-muted-foreground">{ticket.requesterEmail}</div>
              </td>
              <td className="px-4 py-4">{ticket.category}</td>
              <td className="px-4 py-4">
                <Badge>{ticket.priority}</Badge>
              </td>
              <td className="px-4 py-4">
                <Badge variant="outline">{ticket.status}</Badge>
              </td>
              <td className="px-4 py-4">
                <SupportSlaBadge ticket={ticket} />
              </td>
              <td className="px-4 py-4">
                {ticket.assignedTo?.name || ticket.assignedTo?.email || "Unassigned"}
              </td>
              <td className="px-4 py-4">
                <Button asChild size="sm" className="rounded-xl">
                  <Link href={`/admin/support/${ticket.id}`}>Open</Link>
                </Button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}
