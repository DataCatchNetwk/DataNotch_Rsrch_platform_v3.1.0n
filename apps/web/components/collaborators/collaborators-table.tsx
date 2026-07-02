"use client"

import { useMemo } from "react"
import { formatDistanceToNow } from "date-fns"
import { MoreHorizontal, Eye, UserCog, ShieldAlert, MailPlus, UserX } from "lucide-react"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import type { CollaboratorItem } from "@/types/collaborator"
import type { CollaboratorFiltersState } from "./collaborator-filters"

function initials(name: string) {
  return name
    .split(" ")
    .map((part) => part[0])
    .join("")
    .slice(0, 2)
    .toUpperCase()
}

export function CollaboratorsTable({
  collaborators,
  filters,
  onView,
}: {
  collaborators: CollaboratorItem[]
  filters: CollaboratorFiltersState
  onView: (collaborator: CollaboratorItem) => void
}) {
  const filtered = useMemo(() => {
    return collaborators.filter((item) => {
      const query = filters.search.trim().toLowerCase()
      const matchesSearch =
        !query ||
        item.name.toLowerCase().includes(query) ||
        item.email.toLowerCase().includes(query) ||
        item.institution.toLowerCase().includes(query) ||
        item.primaryRole.toLowerCase().includes(query) ||
        item.workspaces.some((ws) => ws.workspaceName.toLowerCase().includes(query))

      const matchesRole = filters.role === "ALL" || item.primaryRole === filters.role
      const matchesStatus = filters.status === "ALL" || item.status === filters.status
      const matchesType = filters.type === "ALL" || item.type === filters.type
      const matchesWorkspace =
        filters.workspace === "ALL" ||
        item.workspaces.some((ws) => ws.workspaceName === filters.workspace)

      return matchesSearch && matchesRole && matchesStatus && matchesType && matchesWorkspace
    })
  }, [collaborators, filters])

  return (
    <div className="overflow-x-auto rounded-2xl border bg-card shadow-sm">
      <Table>
        <TableHeader>
          <TableRow className="hover:bg-transparent">
            <TableHead>Collaborator</TableHead>
            <TableHead>Status</TableHead>
            <TableHead>Primary Role</TableHead>
            <TableHead>Workspace Roles</TableHead>
            <TableHead>Access Scope</TableHead>
            <TableHead>Institution</TableHead>
            <TableHead>Last Active</TableHead>
            <TableHead>Memberships</TableHead>
            <TableHead className="text-right">Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {filtered.length === 0 ? (
            <TableRow>
              <TableCell colSpan={9} className="h-28 text-center text-muted-foreground">
                No collaborators matched your filters.
              </TableCell>
            </TableRow>
          ) : (
            filtered.map((item) => (
              <TableRow key={item.id} className="hover:bg-muted/30">
                <TableCell>
                  <div className="flex items-start gap-3">
                    <Avatar className="h-10 w-10">
                      <AvatarFallback>{initials(item.name)}</AvatarFallback>
                    </Avatar>
                    <div>
                      <p className="font-medium">{item.name}</p>
                      <p className="text-sm text-muted-foreground">{item.email}</p>
                      <div className="mt-1 flex flex-wrap gap-1">
                        <Badge variant="outline">{item.type}</Badge>
                        {item.complianceTags.slice(0, 1).map((tag) => (
                          <Badge key={tag} variant="secondary">
                            {tag}
                          </Badge>
                        ))}
                      </div>
                    </div>
                  </div>
                </TableCell>
                <TableCell>
                  <Badge
                    variant={
                      item.status === "SUSPENDED"
                        ? "destructive"
                        : item.status === "ACTIVE"
                          ? "default"
                          : "secondary"
                    }
                  >
                    {item.status}
                  </Badge>
                </TableCell>
                <TableCell>
                  <Badge>{item.primaryRole}</Badge>
                </TableCell>
                <TableCell>
                  <div className="flex max-w-70 flex-wrap gap-1">
                    {item.workspaces.map((ws) => (
                      <Badge key={ws.workspaceId} variant="outline">
                        {ws.workspaceName} · {ws.role}
                      </Badge>
                    ))}
                  </div>
                </TableCell>
                <TableCell>
                  <div className="flex max-w-55 flex-wrap gap-1">
                    {item.permissions.slice(0, 3).map((p) => (
                      <Badge key={p.key} variant="secondary">
                        {p.label}
                      </Badge>
                    ))}
                  </div>
                </TableCell>
                <TableCell>
                  <div>
                    <p className="font-medium">{item.institution}</p>
                    <p className="text-sm text-muted-foreground">{item.department || "—"}</p>
                  </div>
                </TableCell>
                <TableCell>
                  {formatDistanceToNow(new Date(item.lastActiveAt), { addSuffix: true })}
                </TableCell>
                <TableCell>{item.membershipCount}</TableCell>
                <TableCell className="text-right">
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="icon">
                        <MoreHorizontal className="h-4 w-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end" className="w-52">
                      <DropdownMenuItem onClick={() => onView(item)}>
                        <Eye className="mr-2 h-4 w-4" />
                        View profile
                      </DropdownMenuItem>
                      <DropdownMenuItem>
                        <UserCog className="mr-2 h-4 w-4" />
                        Edit role
                      </DropdownMenuItem>
                      <DropdownMenuItem>
                        <MailPlus className="mr-2 h-4 w-4" />
                        Assign workspace
                      </DropdownMenuItem>
                      <DropdownMenuItem>
                        <ShieldAlert className="mr-2 h-4 w-4" />
                        Audit activity
                      </DropdownMenuItem>
                      <DropdownMenuItem className="text-destructive focus:text-destructive">
                        <UserX className="mr-2 h-4 w-4" />
                        Revoke access
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </TableCell>
              </TableRow>
            ))
          )}
        </TableBody>
      </Table>
    </div>
  )
}
