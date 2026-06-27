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
  type GovernanceRole,
  type GovernanceStatus,
  listGovernanceUsers,
  updateGovernanceUserRole,
  updateGovernanceUserStatus,
  type GovernanceUser,
} from '@/lib/api/admin-governance-api-client';
import { bulkAssignPolicyRole, bulkUpdatePolicyStatus } from '@/lib/api/admin-policy-api-client';

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

  const selectedUsers = React.useMemo(
    () => users.filter((item) => selectedIds.includes(item.id)),
    [users, selectedIds],
  );

  const getBulkEligibleIds = React.useCallback(
    (status: GovernanceStatus) =>
      selectedUsers
        .filter((item) => item.status !== status)
        .filter((item) => item.id !== user?.id)
        .filter((item) => canManageRoles || item.role !== 'SUPER_ADMIN')
        .map((item) => item.id),
    [canManageRoles, selectedUsers, user?.id],
  );

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
    if (userId === user?.id) {
      toast.error('You cannot change your own role from this screen.');
      return;
    }

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
    if (userId === user?.id) {
      toast.error('You cannot change your own status from this screen.');
      return;
    }

    const target = users.find((item) => item.id === userId);
    if (!canManageRoles && target?.role === 'SUPER_ADMIN') {
      toast.error('Only SUPER_ADMIN can update SUPER_ADMIN account status.');
      return;
    }

    if (target?.status === status) {
      toast.info(`User is already ${status}.`);
      return;
    }

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
    const eligibleIds = selectedUsers
      .filter((item) => item.role !== role)
      .filter((item) => item.id !== user?.id)
      .map((item) => item.id);

    if (!eligibleIds.length) {
      toast.info(`No eligible selected users for role ${role}.`);
      return;
    }

    const reason = window.prompt(`Provide a reason for bulk role assignment to ${role}:`);
    if (!reason || reason.trim().length < 3) {
      toast.error('A reason is required.');
      return;
    }

    setBulkPending(true);
    try {
      await bulkAssignPolicyRole(eligibleIds, role, reason.trim());
      if (eligibleIds.length < selectedIds.length) {
        toast.info(`Skipped ${selectedIds.length - eligibleIds.length} ineligible selections.`);
      }
      toast.success(`Updated ${eligibleIds.length} users to ${role}.`);
      setSelectedIds([]);
      await load();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Bulk role assignment failed.');
    } finally {
      setBulkPending(false);
    }
  }

  async function bulkStatusUpdate(status: GovernanceStatus) {
    if (!selectedIds.length) return;
    const eligibleIds = getBulkEligibleIds(status);

    if (!eligibleIds.length) {
      toast.info(`No eligible selected users for status ${status}.`);
      return;
    }

    const reason = window.prompt(`Provide a reason for bulk status update to ${status}:`);
    if (!reason || reason.trim().length < 3) {
      toast.error('A reason is required.');
      return;
    }

    setBulkPending(true);
    try {
      await bulkUpdatePolicyStatus(eligibleIds, status, reason.trim());
      if (eligibleIds.length < selectedIds.length) {
        toast.info(`Skipped ${selectedIds.length - eligibleIds.length} ineligible selections.`);
      }
      toast.success(`Updated ${eligibleIds.length} users to ${status}.`);
      setSelectedIds([]);
      await load();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Bulk status update failed.');
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
              currentUserId={user?.id ?? null}
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
              onBulkStatusUpdate={(status) => void bulkStatusUpdate(status)}
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