"use client"

import { Search, RotateCcw } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"

export interface CollaboratorFiltersState {
  search: string
  role: string
  status: string
  type: string
  workspace: string
}

export function CollaboratorFilters({
  filters,
  onChange,
  onReset,
}: {
  filters: CollaboratorFiltersState
  onChange: (next: CollaboratorFiltersState) => void
  onReset: () => void
}) {
  return (
    <div className="rounded-2xl border bg-card p-4 shadow-sm">
      <div className="grid gap-3 lg:grid-cols-12">
        <div className="relative lg:col-span-4">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            className="pl-9"
            placeholder="Name, email, institution, role, workspace"
            value={filters.search}
            onChange={(e) => onChange({ ...filters, search: e.target.value })}
          />
        </div>

        <div className="lg:col-span-2">
          <Select value={filters.role} onValueChange={(value) => onChange({ ...filters, role: value })}>
            <SelectTrigger>
              <SelectValue placeholder="Role" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="ALL">All roles</SelectItem>
              <SelectItem value="OWNER">Owner</SelectItem>
              <SelectItem value="ADMIN">Admin</SelectItem>
              <SelectItem value="RESEARCHER">Researcher</SelectItem>
              <SelectItem value="REVIEWER">Reviewer</SelectItem>
              <SelectItem value="VIEWER">Viewer</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="lg:col-span-2">
          <Select value={filters.status} onValueChange={(value) => onChange({ ...filters, status: value })}>
            <SelectTrigger>
              <SelectValue placeholder="Status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="ALL">All status</SelectItem>
              <SelectItem value="ACTIVE">Active</SelectItem>
              <SelectItem value="INVITED">Invited</SelectItem>
              <SelectItem value="SUSPENDED">Suspended</SelectItem>
              <SelectItem value="INACTIVE">Inactive</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="lg:col-span-2">
          <Select value={filters.type} onValueChange={(value) => onChange({ ...filters, type: value })}>
            <SelectTrigger>
              <SelectValue placeholder="Type" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="ALL">All types</SelectItem>
              <SelectItem value="INTERNAL">Internal</SelectItem>
              <SelectItem value="EXTERNAL">External</SelectItem>
              <SelectItem value="STUDENT">Student</SelectItem>
              <SelectItem value="REVIEWER">Reviewer</SelectItem>
              <SelectItem value="PI">PI / Lead</SelectItem>
              <SelectItem value="ANALYST">Analyst</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="lg:col-span-2">
          <Select value={filters.workspace} onValueChange={(value) => onChange({ ...filters, workspace: value })}>
            <SelectTrigger>
              <SelectValue placeholder="Workspace" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="ALL">All workspaces</SelectItem>
              <SelectItem value="Environment Verification">Environment Verification</SelectItem>
              <SelectItem value="T2DM Wearables Study">T2DM Wearables Study</SelectItem>
              <SelectItem value="Predictive Modeling">Predictive Modeling</SelectItem>
              <SelectItem value="Peer Review Workspace">Peer Review Workspace</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="mt-3 flex items-center justify-end">
        <Button variant="outline" className="gap-2" onClick={onReset}>
          <RotateCcw className="h-4 w-4" />
          Reset filters
        </Button>
      </div>
    </div>
  )
}
