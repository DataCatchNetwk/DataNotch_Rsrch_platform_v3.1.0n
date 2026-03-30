"use client";
import * as React from "react";
import { Shield, UserX } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { GovernanceRole, GovernanceStatus, GovernanceUser } from "@/lib/api/admin-governance-api-client";

export function GovernanceUserTable(props: {
  users: GovernanceUser[];
  selectedIds: string[];
  onSelectedIdsChange: (ids: string[]) => void;
  search: string;
  onSearchChange: (value: string) => void;
  roleFilter: string;
  onRoleFilterChange: (value: string) => void;
  statusFilter: string;
  onStatusFilterChange: (value: string) => void;
  onUserRoleChange: (userId: string, role: GovernanceRole) => void;
  onUserStatusChange: (userId: string, status: GovernanceStatus) => void;
  onBulkRoleAssign: (role: GovernanceRole) => void;
  onBulkSuspend: () => void;
  isSuperAdmin: boolean;
}) {
  const { users, selectedIds, onSelectedIdsChange, search, onSearchChange, roleFilter, onRoleFilterChange, statusFilter, onStatusFilterChange, onUserRoleChange, onUserStatusChange, onBulkRoleAssign, onBulkSuspend, isSuperAdmin } = props;
  const allSelected = users.length > 0 && users.every((user) => selectedIds.includes(user.id));
  const toggleAll = (checked: boolean) => checked ? onSelectedIdsChange(users.map((u) => u.id)) : onSelectedIdsChange([]);
  const toggleOne = (userId: string, checked: boolean) => checked ? onSelectedIdsChange(Array.from(new Set([...selectedIds, userId]))) : onSelectedIdsChange(selectedIds.filter((id) => id !== userId));

  return (
    <div className="space-y-4">
      <div className="grid gap-3 lg:grid-cols-[1.4fr_220px_220px]">
        <Input value={search} onChange={(e) => onSearchChange(e.target.value)} placeholder="Search users by name or email" />
        <Select value={roleFilter} onValueChange={onRoleFilterChange}>
          <SelectTrigger><SelectValue placeholder="Filter by role" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="ALL">All Roles</SelectItem>
            <SelectItem value="USER">USER</SelectItem>
            <SelectItem value="REVIEWER">REVIEWER</SelectItem>
            <SelectItem value="STAFF">STAFF</SelectItem>
            <SelectItem value="ADMIN">ADMIN</SelectItem>
            <SelectItem value="SUPER_ADMIN">SUPER_ADMIN</SelectItem>
          </SelectContent>
        </Select>
        <Select value={statusFilter} onValueChange={onStatusFilterChange}>
          <SelectTrigger><SelectValue placeholder="Filter by status" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="ALL">All Statuses</SelectItem>
            <SelectItem value="ACTIVE">ACTIVE</SelectItem>
            <SelectItem value="PENDING">PENDING</SelectItem>
            <SelectItem value="SUSPENDED">SUSPENDED</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {selectedIds.length > 0 ? (
        <div className="flex flex-wrap items-center gap-2 rounded-2xl border border-violet-200 bg-violet-50 p-4">
          <span className="text-sm font-medium text-slate-800">{selectedIds.length} selected</span>
          {isSuperAdmin ? (
            <>
              <Button size="sm" variant="outline" onClick={() => onBulkRoleAssign("REVIEWER")}><Shield className="mr-2 h-4 w-4" />Bulk Assign Reviewer</Button>
              <Button size="sm" variant="outline" onClick={() => onBulkRoleAssign("STAFF")}><Shield className="mr-2 h-4 w-4" />Bulk Assign Staff</Button>
            </>
          ) : null}
          <Button size="sm" variant="destructive" onClick={onBulkSuspend}><UserX className="mr-2 h-4 w-4" />Bulk Suspend</Button>
        </div>
      ) : null}

      <div className="overflow-x-auto rounded-2xl border bg-white">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-12"><Checkbox checked={allSelected} onCheckedChange={(checked) => toggleAll(Boolean(checked))} /></TableHead>
              <TableHead>Name</TableHead>
              <TableHead>Email</TableHead>
              <TableHead>Institution</TableHead>
              <TableHead>Last Login</TableHead>
              <TableHead>Role</TableHead>
              <TableHead>Status</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {users.map((user) => (
              <TableRow key={user.id}>
                <TableCell><Checkbox checked={selectedIds.includes(user.id)} onCheckedChange={(checked) => toggleOne(user.id, Boolean(checked))} /></TableCell>
                <TableCell className="font-medium">{user.fullName}</TableCell>
                <TableCell>{user.email}</TableCell>
                <TableCell>{user.institution ?? "—"}</TableCell>
                <TableCell>{user.lastLogin ?? "—"}</TableCell>
                <TableCell>
                  <Select value={user.role} onValueChange={(value) => onUserRoleChange(user.id, value as GovernanceRole)} disabled={!isSuperAdmin}>
                    <SelectTrigger className="w-[170px]"><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="USER">USER</SelectItem>
                      <SelectItem value="REVIEWER">REVIEWER</SelectItem>
                      <SelectItem value="STAFF">STAFF</SelectItem>
                      <SelectItem value="ADMIN">ADMIN</SelectItem>
                      <SelectItem value="SUPER_ADMIN">SUPER_ADMIN</SelectItem>
                    </SelectContent>
                  </Select>
                </TableCell>
                <TableCell>
                  <Select value={user.status} onValueChange={(value) => onUserStatusChange(user.id, value as GovernanceStatus)}>
                    <SelectTrigger className="w-[170px]"><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="ACTIVE">ACTIVE</SelectItem>
                      <SelectItem value="PENDING">PENDING</SelectItem>
                      <SelectItem value="SUSPENDED">SUSPENDED</SelectItem>
                    </SelectContent>
                  </Select>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
