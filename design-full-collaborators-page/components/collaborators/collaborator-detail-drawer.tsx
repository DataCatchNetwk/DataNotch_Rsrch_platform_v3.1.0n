"use client"

import { formatDistanceToNow } from "date-fns"
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle } from "@/components/ui/sheet"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { Button } from "@/components/ui/button"
import type { CollaboratorItem } from "@/types/collaborator"

function initials(name: string) {
  return name
    .split(" ")
    .map((part) => part[0])
    .join("")
    .slice(0, 2)
    .toUpperCase()
}

export function CollaboratorDetailDrawer({
  open,
  onOpenChange,
  collaborator,
}: {
  open: boolean
  onOpenChange: (open: boolean) => void
  collaborator: CollaboratorItem | null
}) {
  if (!collaborator) return null

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="w-full sm:max-w-2xl overflow-y-auto">
        <SheetHeader>
          <SheetTitle>Collaborator Details</SheetTitle>
          <SheetDescription>
            Review access, workspace memberships, and research-specific collaboration context.
          </SheetDescription>
        </SheetHeader>

        <div className="mt-6 space-y-6">
          <div className="flex items-start gap-4 rounded-2xl border p-4">
            <Avatar className="h-14 w-14">
              <AvatarFallback>{initials(collaborator.name)}</AvatarFallback>
            </Avatar>
            <div className="space-y-2">
              <div>
                <p className="text-lg font-semibold">{collaborator.name}</p>
                <p className="text-sm text-muted-foreground">{collaborator.email}</p>
              </div>
              <div className="flex flex-wrap gap-2">
                <Badge>{collaborator.primaryRole}</Badge>
                <Badge variant="outline">{collaborator.status}</Badge>
                <Badge variant="secondary">{collaborator.type}</Badge>
              </div>
            </div>
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            <div className="rounded-2xl border p-4">
              <p className="text-sm text-muted-foreground">Institution</p>
              <p className="font-medium">{collaborator.institution}</p>
            </div>
            <div className="rounded-2xl border p-4">
              <p className="text-sm text-muted-foreground">Department</p>
              <p className="font-medium">{collaborator.department || "—"}</p>
            </div>
            <div className="rounded-2xl border p-4">
              <p className="text-sm text-muted-foreground">Last Active</p>
              <p className="font-medium">
                {formatDistanceToNow(new Date(collaborator.lastActiveAt), { addSuffix: true })}
              </p>
            </div>
            <div className="rounded-2xl border p-4">
              <p className="text-sm text-muted-foreground">Memberships</p>
              <p className="font-medium">{collaborator.membershipCount}</p>
            </div>
          </div>

          <Separator />

          <section className="space-y-3">
            <h3 className="font-semibold">Workspace Roles</h3>
            <div className="space-y-3">
              {collaborator.workspaces.map((workspace) => (
                <div key={workspace.workspaceId} className="rounded-2xl border p-4 flex items-center justify-between gap-3">
                  <div>
                    <p className="font-medium">{workspace.workspaceName}</p>
                    <p className="text-sm text-muted-foreground">Scoped workspace membership</p>
                  </div>
                  <Badge variant="outline">{workspace.role}</Badge>
                </div>
              ))}
            </div>
          </section>

          <section className="space-y-3">
            <h3 className="font-semibold">Permission Scope</h3>
            <div className="flex flex-wrap gap-2">
              {collaborator.permissions.map((permission) => (
                <Badge key={permission.key} variant="secondary">
                  {permission.label}
                </Badge>
              ))}
            </div>
          </section>

          <section className="space-y-3">
            <h3 className="font-semibold">Compliance & Access Tags</h3>
            <div className="flex flex-wrap gap-2">
              {collaborator.complianceTags.map((tag) => (
                <Badge key={tag} variant="outline">
                  {tag}
                </Badge>
              ))}
            </div>
          </section>

          <div className="grid gap-2 md:grid-cols-2">
            <Button variant="outline">Audit Activity</Button>
            <Button>Manage Access</Button>
          </div>
        </div>
      </SheetContent>
    </Sheet>
  )
}
