'use client';

import * as React from 'react';
import { Shield, UserX } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import type { GovernanceRole, GovernanceStatus, GovernanceUser } from '@/lib/api/admin-governance-api-client';

type GovernanceUserTableProps = {
  users: GovernanceUser[];
  selectedIds: string[];
  pendingRoleUserId?: string | null;
  pendingStatusUserId?: string | null;
  currentUserId?: string | null;
  search: string;
  roleFilter: string;
  statusFilter: string;
  isSuperAdmin: boolean;
  onSelectedIdsChange: (ids: string[]) => void;
  onSearchChange: (value: string) => void;
  onRoleFilterChange: (value: string) => void;
  onStatusFilterChange: (value: string) => void;
  onUserRoleChange: (userId: string, role: GovernanceRole) => void;
  onUserStatusChange: (userId: string, status: GovernanceStatus) => void;
  onBulkRoleAssign: (role: GovernanceRole) => void;
  onBulkStatusUpdate: (status: GovernanceStatus) => void;
};

export function GovernanceUserTable({
  users,
  selectedIds,
  pendingRoleUserId,
  pendingStatusUserId,
  currentUserId,
  search,
  roleFilter,
  statusFilter,
  isSuperAdmin,
  onSelectedIdsChange,
  onSearchChange,
  onRoleFilterChange,
  onStatusFilterChange,
  onUserRoleChange,
  onUserStatusChange,
  onBulkRoleAssign,
  onBulkStatusUpdate,
}: GovernanceUserTableProps) {
  const isLocked = React.useCallback(
    (user: GovernanceUser) => user.id === currentUserId || (!isSuperAdmin && user.role === 'SUPER_ADMIN'),
    [currentUserId, isSuperAdmin],
  );

  const selectableUsers = React.useMemo(() => users.filter((user) => !isLocked(user)), [isLocked, users]);
  const allSelected = selectableUsers.length > 0 && selectableUsers.every((user) => selectedIds.includes(user.id));
  const selectedUsers = React.useMemo(() => users.filter((user) => selectedIds.includes(user.id)), [selectedIds, users]);

  const bulkSuspendCount = selectedUsers.filter((user) => !isLocked(user) && user.status !== 'SUSPENDED').length;
  const bulkActivateCount = selectedUsers.filter((user) => !isLocked(user) && user.status !== 'ACTIVE').length;
  const bulkPendingCount = selectedUsers.filter((user) => !isLocked(user) && user.status !== 'PENDING').length;

  const toggleAll = (checked: boolean) => {
    if (checked) {
      onSelectedIdsChange(selectableUsers.map((user) => user.id));
      return;
    }
    onSelectedIdsChange([]);
  };

  const toggleOne = (userId: string, checked: boolean) => {
    const target = users.find((user) => user.id === userId);
    if (!target || isLocked(target)) {
      return;
    }

    if (checked) {
      onSelectedIdsChange(Array.from(new Set([...selectedIds, userId])));
      return;
    }
    onSelectedIdsChange(selectedIds.filter((id) => id !== userId));
  };

  return (
    <div className="space-y-4">
      <div className="grid gap-3 lg:grid-cols-[1.4fr_220px_220px]">
        <Input value={search} onChange={(event) => onSearchChange(event.target.value)} placeholder="Search users by name or email" />
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
              <Button size="sm" variant="outline" onClick={() => onBulkRoleAssign('REVIEWER')}>
                <Shield className="mr-2 h-4 w-4" />
                Bulk Assign Reviewer
              </Button>
              <Button size="sm" variant="outline" onClick={() => onBulkRoleAssign('STAFF')}>
                <Shield className="mr-2 h-4 w-4" />
                Bulk Assign Staff
              </Button>
              <Button size="sm" variant="outline" onClick={() => onBulkRoleAssign('ADMIN')}>
                <Shield className="mr-2 h-4 w-4" />
                Bulk Assign Admin
              </Button>
            </>
          ) : null}
          <Button size="sm" variant="destructive" disabled={bulkSuspendCount === 0} onClick={() => onBulkStatusUpdate('SUSPENDED')}>
            <UserX className="mr-2 h-4 w-4" />
            Bulk Suspend
          </Button>
          <Button size="sm" variant="outline" disabled={bulkActivateCount === 0} onClick={() => onBulkStatusUpdate('ACTIVE')}>
            Reactivate to ACTIVE
          </Button>
          <Button size="sm" variant="outline" disabled={bulkPendingCount === 0} onClick={() => onBulkStatusUpdate('PENDING')}>
            Set PENDING
          </Button>
          {bulkSuspendCount === 0 ? <span className="text-xs text-slate-500">All selected users are already SUSPENDED or protected.</span> : null}
        </div>
      ) : null}

      <div className="overflow-x-auto rounded-2xl border bg-white">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-12">
                <Checkbox checked={allSelected} onCheckedChange={(checked) => toggleAll(Boolean(checked))} />
              </TableHead>
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
                <TableCell>
                  <Checkbox
                    checked={selectedIds.includes(user.id)}
                    disabled={isLocked(user)}
                    onCheckedChange={(checked) => toggleOne(user.id, Boolean(checked))}
                  />
                </TableCell>
                <TableCell className="font-medium">{user.fullName}</TableCell>
                <TableCell>{user.email}</TableCell>
                <TableCell>{user.institution ?? '—'}</TableCell>
                <TableCell>{user.lastLogin ?? '—'}</TableCell>
                <TableCell>
                  <Select
                    value={user.role}
                    onValueChange={(value) => onUserRoleChange(user.id, value as GovernanceRole)}
                    disabled={!isSuperAdmin || pendingRoleUserId === user.id || user.id === currentUserId}
                  >
                    <SelectTrigger className="w-44"><SelectValue /></SelectTrigger>
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
                  <Select
                    value={user.status}
                    onValueChange={(value) => onUserStatusChange(user.id, value as GovernanceStatus)}
                    disabled={pendingStatusUserId === user.id || isLocked(user)}
                  >
                    <SelectTrigger className="w-44"><SelectValue /></SelectTrigger>
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
