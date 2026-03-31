"use client"

import { useState } from "react"
import type { SupportTicket } from "@/lib/types/support"
import { addSupportReply, updateSupportTicket } from "@/lib/api/support"
import { SupportAiPanel } from "./support-ai-panel"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Textarea } from "@/components/ui/textarea"
import { Button } from "@/components/ui/button"

export function SupportTicketDetail({
  initialTicket,
}: {
  initialTicket: SupportTicket
}) {
  const [ticket, setTicket] = useState(initialTicket)
  const [reply, setReply] = useState("")
  const [saving, setSaving] = useState(false)

  async function submitReply(isInternal = false) {
    if (!reply.trim()) return
    setSaving(true)
    try {
      const updated = await addSupportReply(ticket.id, {
        message: reply,
        isInternal,
      })
      setTicket(updated)
      setReply("")
    } finally {
      setSaving(false)
    }
  }

  async function changeStatus(status: string) {
    const updated = await updateSupportTicket(ticket.id, { status })
    setTicket(updated)
  }

  return (
    <div className="grid gap-6 xl:grid-cols-[1.5fr_0.9fr]">
      <div className="space-y-6">
        <Card className="rounded-2xl">
          <CardHeader>
            <CardTitle>
              {ticket.ticketNumber} — {ticket.subject}
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="rounded-xl border p-4 text-sm">{ticket.description}</div>

            <div className="flex flex-wrap gap-2">
              <Button size="sm" variant="outline" onClick={() => changeStatus("TRIAGED")}>
                Mark Triaged
              </Button>
              <Button size="sm" variant="outline" onClick={() => changeStatus("IN_PROGRESS")}>
                Start Work
              </Button>
              <Button size="sm" variant="outline" onClick={() => changeStatus("WAITING_FOR_USER")}>
                Waiting for User
              </Button>
              <Button size="sm" onClick={() => changeStatus("RESOLVED")}>
                Resolve
              </Button>
            </div>
          </CardContent>
        </Card>

        <Card className="rounded-2xl">
          <CardHeader>
            <CardTitle>Conversation</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {(ticket.messages || []).map((msg) => (
              <div key={msg.id} className="rounded-xl border p-4">
                <div className="mb-1 text-xs text-muted-foreground">
                  {msg.authorType} • {new Date(msg.createdAt).toLocaleString()}
                  {msg.isInternal ? " • Internal Note" : ""}
                </div>
                <div className="text-sm whitespace-pre-wrap">{msg.body}</div>
              </div>
            ))}

            <Textarea
              value={reply}
              onChange={(e) => setReply(e.target.value)}
              placeholder="Write a reply or internal note..."
              className="min-h-[140px]"
            />

            <div className="flex gap-2">
              <Button onClick={() => submitReply(false)} disabled={saving}>
                Send Reply
              </Button>
              <Button variant="outline" onClick={() => submitReply(true)} disabled={saving}>
                Save Internal Note
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>

      <SupportAiPanel
        ticket={ticket}
        onTicketUpdated={setTicket}
        onReplySuggested={(suggested) => setReply(suggested)}
      />
    </div>
  )
}
