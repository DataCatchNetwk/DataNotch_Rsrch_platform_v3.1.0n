'use client';

import * as React from 'react';
import { ProtectedRoute } from '@/components/protected-route';
import { useAuth } from '@/lib/auth-context';
import { AdminCard } from '@/components/admin/admin-card';
import { AdminShell } from '@/components/admin/admin-shell';
import { AdminError, AdminLoading } from '@/components/admin/admin-states';
import { GovernanceUserTable } from '@/components/admin-governance/user-table';
import { GovernanceAccessRequestQueue } from '@/components/admin-governance/access-request-queue';
import { GovernanceAuditExplorer } from '@/components/admin-governance/audit-explorer';
import {
  approveGovernanceAccessRequest,
  bulkAssignGovernanceRole,
  bulkSuspendGovernanceUsers,
  listGovernanceAccessRequests,
  listGovernanceAuditEvents,
  listGovernanceUsers,
  rejectGovernanceAccessRequest,
  updateGovernanceUserRole,
  updateGovernanceUserStatus,
  type GovernanceAccessRequest,
  type GovernanceAuditEvent,
  type GovernanceRole,
  type GovernanceStatus,
  type GovernanceUser,
} from '@/lib/api/admin-governance-api-client';
import { toast } from 'sonner';

function AdminGovernanceContent() {
  const { user } = useAuth();
  const isSuperAdmin = user?.roles.includes('SUPER_ADMIN') ?? false;
  const [users, setUsers] = React.useState<GovernanceUser[]>([]);
  const [requests, setRequests] = React.useState<GovernanceAccessRequest[]>([]);
  const [audit, setAudit] = React.useState<GovernanceAuditEvent[]>([]);
  const [selectedIds, setSelectedIds] = React.useState<string[]>([]);
  const [search, setSearch] = React.useState('');
  const [roleFilter, setRoleFilter] = React.useState('ALL');
  const [statusFilter, setStatusFilter] = React.useState('ALL');
  const [auditSearch, setAuditSearch] = React.useState('');
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState<string | null>(null);
  const [pendingRoleUserId, setPendingRoleUserId] = React.useState<string | null>(null);
  const [pendingStatusUserId, setPendingStatusUserId] = React.useState<string | null>(null);
  const [pendingRequestId, setPendingRequestId] = React.useState<string | null>(null);
  const [bulkPending, setBulkPending] = React.useState(false);

  const load = React.useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const [usersRes, requestsRes, auditRes] = await Promise.all([
        listGovernanceUsers({
          search: search || undefined,
          role: roleFilter !== 'ALL' ? roleFilter : undefined,
          status: statusFilter !== 'ALL' ? statusFilter : undefined,
        }),
        listGovernanceAccessRequests(),
        listGovernanceAuditEvents(),
      ]);
      setUsers(usersRes);
      setRequests(requestsRes);
      setAudit(auditRes);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load governance data.');
    } finally {
      setLoading(false);
    }
  }, [search, roleFilter, statusFilter]);

  React.useEffect(() => {
    void load();
  }, [load]);

  async function onUserRoleChange(userId: string, role: GovernanceRole) {
    setPendingRoleUserId(userId);
    try {
      const updated = await updateGovernanceUserRole(userId, role);
      setUsers((current) => current.map((item) => (item.id === userId ? updated : item)));
      toast.success(`Role updated to ${role}.`);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Failed to update role.');
    } finally {
      setPendingRoleUserId(null);
    }
  }

  async function onUserStatusChange(userId: string, status: GovernanceStatus) {
    setPendingStatusUserId(userId);
    try {
      const updated = await updateGovernanceUserStatus(userId, status);
      setUsers((current) => current.map((item) => (item.id === userId ? updated : item)));
      toast.success(`Status updated to ${status}.`);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Failed to update status.');
    } finally {
      setPendingStatusUserId(null);
    }
  }

  async function onBulkRoleAssign(role: GovernanceRole) {
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

  async function onBulkSuspend() {
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

  async function onApprove(requestId: string) {
    setPendingRequestId(requestId);
    try {
      const updated = await approveGovernanceAccessRequest(requestId);
      setRequests((current) => current.map((item) => (item.id === requestId ? updated : item)));
      toast.success('Access request approved.');
      await load();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Failed to approve request.');
    } finally {
      setPendingRequestId(null);
    }
  }

  async function onReject(requestId: string) {
    setPendingRequestId(requestId);
    try {
      const updated = await rejectGovernanceAccessRequest(requestId);
      setRequests((current) => current.map((item) => (item.id === requestId ? updated : item)));
      toast.success('Access request rejected.');
      await load();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Failed to reject request.');
    } finally {
      setPendingRequestId(null);
    }
  }

  const filteredAudit = audit.filter((item) => {
    const q = auditSearch.toLowerCase().trim();
    if (!q) return true;
    return [item.action, item.actor, item.targetType, item.targetId, item.severity].join(' ').toLowerCase().includes(q);
  });

  return (
    <AdminShell
      title="Governance Control Center"
      description="Search users, review access requests, inspect audit history, and run elevated governance actions."
    >
      {loading ? <AdminLoading cards={3} /> : null}
      {!loading && error ? <AdminError message={error} onRetry={() => void load()} /> : null}
      {!loading && !error ? (
        <div className="space-y-4">
          <div className="grid gap-4 md:grid-cols-3">
            <AdminCard title="Governance Users" description="Loaded users in current filter scope.">
              <p className="text-3xl font-semibold tracking-tight">{users.length}</p>
            </AdminCard>
            <AdminCard title="Access Requests" description="Approval items awaiting review.">
              <p className="text-3xl font-semibold tracking-tight">{requests.filter((item) => item.status === 'PENDING').length}</p>
            </AdminCard>
            <AdminCard title="Suspended Users" description="Current suspended accounts in filtered set.">
              <p className="text-3xl font-semibold tracking-tight">{users.filter((item) => item.status === 'SUSPENDED').length}</p>
            </AdminCard>
          </div>

          <AdminCard title="Searchable User Table" description="Filter users, assign roles, and run bulk governance actions.">
            <div className={bulkPending ? 'pointer-events-none opacity-60' : ''}>
              <GovernanceUserTable
                users={users}
                selectedIds={selectedIds}
                pendingRoleUserId={pendingRoleUserId}
                pendingStatusUserId={pendingStatusUserId}
                search={search}
                roleFilter={roleFilter}
                statusFilter={statusFilter}
                isSuperAdmin={isSuperAdmin}
                onSelectedIdsChange={setSelectedIds}
                onSearchChange={setSearch}
                onRoleFilterChange={setRoleFilter}
                onStatusFilterChange={setStatusFilter}
                onUserRoleChange={(userId, role) => void onUserRoleChange(userId, role)}
                onUserStatusChange={(userId, status) => void onUserStatusChange(userId, status)}
                onBulkRoleAssign={(role) => void onBulkRoleAssign(role)}
                onBulkSuspend={() => void onBulkSuspend()}
              />
            </div>
          </AdminCard>

          <AdminCard title="Access Request Approval Queue" description="Approve or reject incoming governance requests.">
            <GovernanceAccessRequestQueue
              items={requests}
              pendingRequestId={pendingRequestId}
              onApprove={(id) => void onApprove(id)}
              onReject={(id) => void onReject(id)}
            />
          </AdminCard>

          <AdminCard title="Audit Explorer" description="Search across recent governance events and changes.">
            <GovernanceAuditExplorer items={filteredAudit} search={auditSearch} onSearchChange={setAuditSearch} />
          </AdminCard>

          {isSuperAdmin ? (
            <AdminCard title="Super-Admin Only Controls" description="Restricted actions for SUPER_ADMIN.">
              <p className="text-sm text-slate-700">
                Bulk role reassignment, privileged role changes, and policy-level governance actions are enabled for your account.
              </p>
            </AdminCard>
          ) : null}
        </div>
      ) : null}
    </AdminShell>
  );
}

export default function AdminGovernancePage() {
  return (
    <ProtectedRoute allowedRoles={['ADMIN', 'SUPER_ADMIN']}>
      <AdminGovernanceContent />
    </ProtectedRoute>
  );
}
