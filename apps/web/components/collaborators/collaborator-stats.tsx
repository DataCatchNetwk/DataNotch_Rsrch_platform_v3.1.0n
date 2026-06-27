"use client"

import { Users, FolderKanban, MailPlus, ShieldCheck, Globe2, Eye } from "lucide-react"
import { Card, CardContent } from "@/components/ui/card"
import type { CollaboratorSummaryStats } from "@/types/collaborator"

const items = [
  { key: "totalCollaborators", label: "Total Collaborators", icon: Users },
  { key: "activeWorkspaces", label: "Active Workspaces", icon: FolderKanban },
  { key: "pendingInvites", label: "Pending Invites", icon: MailPlus },
  { key: "ownersAndAdmins", label: "Owners & Admins", icon: ShieldCheck },
  { key: "externalCollaborators", label: "External Members", icon: Globe2 },
  { key: "viewOnlyMembers", label: "View-Only Members", icon: Eye },
] as const

export function CollaboratorStats({ stats }: { stats: CollaboratorSummaryStats }) {
  return (
    <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-6">
      {items.map((item) => {
        const Icon = item.icon
        const value = stats[item.key]
        return (
          <Card key={item.key} className="rounded-2xl border-border/60 shadow-sm">
            <CardContent className="flex items-start justify-between p-5">
              <div className="space-y-1">
                <p className="text-sm text-muted-foreground">{item.label}</p>
                <p className="text-2xl font-semibold tracking-tight">{value}</p>
              </div>
              <div className="rounded-2xl border bg-muted/40 p-3 text-muted-foreground">
                <Icon className="h-5 w-5" />
              </div>
            </CardContent>
          </Card>
        )
      })}
    </div>
  )
}
