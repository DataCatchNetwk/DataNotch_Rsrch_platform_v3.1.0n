"use client"

import { format } from "date-fns"
import { MailClock, RefreshCcw, XCircle } from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import type { InviteItem } from "@/types/collaborator"

export function PendingInvitesPanel({ invites }: { invites: InviteItem[] }) {
  return (
    <Card className="rounded-2xl shadow-sm">
      <CardHeader className="flex flex-row items-center justify-between space-y-0">
        <CardTitle>Pending Invites</CardTitle>
        <Badge variant="secondary">{invites.length} open</Badge>
      </CardHeader>
      <CardContent>
        {invites.length === 0 ? (
          <div className="flex flex-col items-center gap-3 py-10 text-center">
            <MailClock className="h-6 w-6 text-muted-foreground" />
            <p className="text-sm text-muted-foreground">No pending invites at the moment.</p>
          </div>
        ) : (
          <div className="space-y-3">
            {invites.map((invite) => (
              <div key={invite.id} className="rounded-2xl border p-4">
                <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
                  <div>
                    <p className="font-medium">{invite.email}</p>
                    <p className="text-sm text-muted-foreground">
                      {invite.workspaceName} · {invite.role} · invited by {invite.invitedBy}
                    </p>
                    <p className="mt-1 text-xs text-muted-foreground">
                      Sent {format(new Date(invite.sentAt), "PPP p")} · Expires {format(new Date(invite.expiresAt), "PPP p")}
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    <Button variant="outline" size="sm">
                      <RefreshCcw className="mr-2 h-4 w-4" />
                      Resend
                    </Button>
                    <Button variant="outline" size="sm">
                      <XCircle className="mr-2 h-4 w-4" />
                      Cancel
                    </Button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  )
}
