'use client';

import * as React from 'react';
import { ProtectedRoute } from '@/components/protected-route';
import { useAuth } from '@/lib/auth-context';
import { AdminCard } from '@/components/admin/admin-card';
import { AdminShell } from '@/components/admin/admin-shell';
import { AdminError, AdminLoading } from '@/components/admin/admin-states';
import { GovernanceUserTable } from '@/components/admin-governance/user-table';
import { toast } from 'sonner';
import {
  bulkAssignGovernanceRole,
  bulkSuspendGovernanceUsers,
  type GovernanceRole,
  type GovernanceStatus,
  listGovernanceUsers,
  updateGovernanceUserRole,
  updateGovernanceUserStatus,
  type GovernanceUser,
} from '@/lib/api/admin-governance-api-client';

function AdminUsersContent() {
  const { user } = useAuth();
  const [users, setUsers] = React.useState<GovernanceUser[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState<string | null>(null);
  const [search, setSearch] = React.useState('');
  const [roleFilter, setRoleFilter] = React.useState('ALL');
  const [statusFilter, setStatusFilter] = React.useState('ALL');
  const [selectedIds, setSelectedIds] = React.useState<string[]>([]);
  const [pendingRoleUserId, setPendingRoleUserId] = React.useState<string | null>(null);
  const [pendingStatusUserId, setPendingStatusUserId] = React.useState<string | null>(null);
  const [bulkPending, setBulkPending] = React.useState(false);
  const canManageRoles = user?.roles.includes('SUPER_ADMIN') ?? false;

  const load = React.useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      setUsers(
        await listGovernanceUsers({
          search: search || undefined,
          role: roleFilter === 'ALL' ? undefined : roleFilter,
          status: statusFilter === 'ALL' ? undefined : statusFilter,
        }),
      );
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load users.');
    } finally {
      setLoading(false);
    }
  }, [roleFilter, search, statusFilter]);

  React.useEffect(() => {
    void load();
  }, [load]);

  async function updateRole(userId: string, role: GovernanceRole) {
    setPendingRoleUserId(userId);
    try {
      const updated = await updateGovernanceUserRole(userId, role);
      setUsers((current) => current.map((item) => (item.id === userId ? updated : item)));
      toast.success(`Role updated to ${role}.`);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Failed to update user role.');
    } finally {
      setPendingRoleUserId(null);
    }
  }

  async function updateStatus(userId: string, status: GovernanceStatus) {
    setPendingStatusUserId(userId);
    try {
      const updated = await updateGovernanceUserStatus(userId, status);
      setUsers((current) => current.map((item) => (item.id === userId ? updated : item)));
      toast.success(`Account status updated to ${status}.`);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Failed to update account status.');
    } finally {
      setPendingStatusUserId(null);
    }
  }

  async function bulkAssign(role: GovernanceRole) {
    if (!selectedIds.length) return;
    setBulkPending(true);
    try {
      await bulkAssignGovernanceRole(selectedIds, role);
      toast.success(`Updated ${selectedIds.length} users to ${role}.`);
      setSelectedIds([]);
      await load();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Bulk role assignment failed.');
    } finally {
      setBulkPending(false);
    }
  }

  async function bulkSuspend() {
    if (!selectedIds.length) return;
    setBulkPending(true);
    try {
      await bulkSuspendGovernanceUsers(selectedIds);
      toast.success(`Suspended ${selectedIds.length} users.`);
      setSelectedIds([]);
      await load();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Bulk suspend failed.');
    } finally {
      setBulkPending(false);
    }
  }

  return (
    <AdminShell title="User Management" description="View users, assign roles, and manage account status.">
      {loading ? <AdminLoading cards={1} /> : null}
      {!loading && error ? <AdminError message={error} onRetry={() => void load()} /> : null}
      {!loading && !error ? (
        <AdminCard title="Platform Users" description="System-wide identity and account management.">
          <div className={bulkPending ? 'pointer-events-none opacity-60' : ''}>
            <GovernanceUserTable
              users={users}
              selectedIds={selectedIds}
              pendingRoleUserId={pendingRoleUserId}
              pendingStatusUserId={pendingStatusUserId}
              search={search}
              roleFilter={roleFilter}
              statusFilter={statusFilter}
              isSuperAdmin={canManageRoles}
              onSelectedIdsChange={setSelectedIds}
              onSearchChange={setSearch}
              onRoleFilterChange={setRoleFilter}
              onStatusFilterChange={setStatusFilter}
              onUserRoleChange={(userId, role) => void updateRole(userId, role)}
              onUserStatusChange={(userId, status) => void updateStatus(userId, status)}
              onBulkRoleAssign={(role) => void bulkAssign(role)}
              onBulkSuspend={() => void bulkSuspend()}
            />
          </div>
        </AdminCard>
      ) : null}
    </AdminShell>
  );
}

export default function AdminUsersPage() {
  return (
    <ProtectedRoute allowedRoles={['ADMIN', 'SUPER_ADMIN']}>
      <AdminUsersContent />
    </ProtectedRoute>
  );
}