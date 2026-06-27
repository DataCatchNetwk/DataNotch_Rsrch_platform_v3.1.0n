"use client"

import { useMemo, useState } from "react"
import { Download, MailPlus, Settings2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { CollaboratorStats } from "./collaborator-stats"
import { CollaboratorFilters, type CollaboratorFiltersState } from "./collaborator-filters"
import { CollaboratorsTable } from "./collaborators-table"
import { PendingInvitesPanel } from "./pending-invites-panel"
import { InviteCollaboratorDialog } from "./invite-collaborator-dialog"
import { CollaboratorDetailDrawer } from "./collaborator-detail-drawer"
import { collaborators, collaboratorStats, pendingInvites } from "@/lib/mock/collaborators"
import type { CollaboratorItem } from "@/types/collaborator"

const defaultFilters: CollaboratorFiltersState = {
  search: "",
  role: "ALL",
  status: "ALL",
  type: "ALL",
  workspace: "ALL",
}

export function GlobalCollaboratorsPage() {
  const [filters, setFilters] = useState<CollaboratorFiltersState>(defaultFilters)
  const [inviteOpen, setInviteOpen] = useState(false)
  const [selected, setSelected] = useState<CollaboratorItem | null>(null)
  const [detailOpen, setDetailOpen] = useState(false)

  const quickInsights = useMemo(
    () => [
      "Collaboration is strongest when workspace roles, dataset access, and compliance tags are visible together.",
      "Pending invite follow-up helps prevent stalled onboarding in active studies.",
      "External collaborators should surface clearly for data-governance awareness.",
    ],
    []
  )

  function handleView(item: CollaboratorItem) {
    setSelected(item)
    setDetailOpen(true)
  }

  return (
    <div className="space-y-6 p-6">
      {/* Page header */}
      <div className="flex flex-col gap-4 xl:flex-row xl:items-center xl:justify-between">
        <div className="space-y-1">
          <h1 className="text-3xl font-semibold tracking-tight">Global Collaborators</h1>
          <p className="max-w-3xl text-sm text-muted-foreground">
            Unified collaborator roster tied to workspace memberships, role permissions, invite
            lifecycle, and research access controls.
          </p>
        </div>

        <div className="flex flex-wrap gap-2">
          <Button variant="outline">
            <Download className="mr-2 h-4 w-4" />
            Export Access List
          </Button>
          <Button variant="outline">
            <Settings2 className="mr-2 h-4 w-4" />
            Manage Roles
          </Button>
          <Button onClick={() => setInviteOpen(true)}>
            <MailPlus className="mr-2 h-4 w-4" />
            Invite Collaborator
          </Button>
        </div>
      </div>

      {/* Stats */}
      <CollaboratorStats stats={collaboratorStats} />

      {/* Filters */}
      <CollaboratorFilters
        filters={filters}
        onChange={setFilters}
        onReset={() => setFilters(defaultFilters)}
      />

      {/* Main content: table + side panel */}
      <div className="grid gap-6 xl:grid-cols-[2fr_1fr]">
        <div className="space-y-6">
          <CollaboratorsTable collaborators={collaborators} filters={filters} onView={handleView} />
        </div>

        <div className="space-y-6">
          <PendingInvitesPanel invites={pendingInvites} />

          <div className="rounded-2xl border bg-card p-5 shadow-sm">
            <h3 className="font-semibold">Research Collaboration Notes</h3>
            <div className="mt-3 space-y-3">
              {quickInsights.map((note) => (
                <div
                  key={note}
                  className="rounded-xl border bg-muted/30 p-3 text-sm text-muted-foreground"
                >
                  {note}
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Modals / drawers */}
      <InviteCollaboratorDialog open={inviteOpen} onOpenChange={setInviteOpen} />
      <CollaboratorDetailDrawer
        open={detailOpen}
        onOpenChange={setDetailOpen}
        collaborator={selected}
      />
    </div>
  )
}
