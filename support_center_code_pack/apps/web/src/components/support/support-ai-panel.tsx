"use client"

import { useState } from "react"
import type { SupportTicket } from "@/lib/types/support"
import { runAiTriage, suggestAiReply } from "@/lib/api/support"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Sparkles } from "lucide-react"

export function SupportAiPanel({
  ticket,
  onTicketUpdated,
  onReplySuggested,
}: {
  ticket: SupportTicket
  onTicketUpdated: (ticket: SupportTicket) => void
  onReplySuggested: (reply: string) => void
}) {
  const [loadingTriage, setLoadingTriage] = useState(false)
  const [loadingReply, setLoadingReply] = useState(false)

  async function handleTriage() {
    setLoadingTriage(true)
    try {
      const updated = await runAiTriage(ticket.id)
      onTicketUpdated(updated)
    } finally {
      setLoadingTriage(false)
    }
  }

  async function handleSuggestReply() {
    setLoadingReply(true)
    try {
      const res = await suggestAiReply(ticket.id)
      onReplySuggested(res.suggestion)
    } finally {
      setLoadingReply(false)
    }
  }

  return (
    <Card className="rounded-2xl">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Sparkles className="h-4 w-4" />
          AI Support Automation
        </CardTitle>
      </CardHeader>

      <CardContent className="space-y-4">
        <div>
          <div className="mb-1 text-sm font-medium">AI Summary</div>
          <div className="rounded-xl border p-3 text-sm">
            {ticket.aiSummary || "No AI summary yet."}
          </div>
        </div>

        <div>
          <div className="mb-1 text-sm font-medium">AI Triage Reason</div>
          <div className="rounded-xl border p-3 text-sm">
            {ticket.aiTriageReason || "No AI triage analysis yet."}
          </div>
        </div>

        <div className="grid gap-3 text-sm md:grid-cols-3">
          <div className="rounded-xl border p-3">
            <div className="text-muted-foreground">Urgency</div>
            <div className="mt-1 font-medium">{ticket.urgencyScore ?? "-"}</div>
          </div>
          <div className="rounded-xl border p-3">
            <div className="text-muted-foreground">Spam Risk</div>
            <div className="mt-1 font-medium">{ticket.spamScore ?? "-"}</div>
          </div>
          <div className="rounded-xl border p-3">
            <div className="text-muted-foreground">Sentiment</div>
            <div className="mt-1 font-medium">{ticket.sentimentScore ?? "-"}</div>
          </div>
        </div>

        <div className="flex flex-wrap gap-2">
          <Button onClick={handleTriage} disabled={loadingTriage}>
            {loadingTriage ? "Analyzing..." : "Run AI Triage"}
          </Button>
          <Button variant="outline" onClick={handleSuggestReply} disabled={loadingReply}>
            {loadingReply ? "Generating..." : "Suggest Reply"}
          </Button>
        </div>
      </CardContent>
    </Card>
  )
}
