"use client";
import * as React from "react";
import { ShieldAlert, UserCog, UserX } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { GovernanceShell } from "@/components/admin-governance/governance-shell";
import { GovernanceError, GovernanceLoading } from "@/components/admin-governance/governance-states";
import { GovernanceUserTable } from "@/components/admin-governance/user-table";
import { GovernanceAccessRequestQueue } from "@/components/admin-governance/access-request-queue";
import { GovernanceAuditExplorer } from "@/components/admin-governance/audit-explorer";
import {
  GovernanceAuditEvent, GovernanceRole, GovernanceStatus, GovernanceUser, GovernanceAccessRequest,
  approveGovernanceAccessRequest, bulkAssignGovernanceRole, bulkSuspendGovernanceUsers,
  listGovernanceAccessRequests, listGovernanceAuditEvents, listGovernanceUsers,
  rejectGovernanceAccessRequest, updateGovernanceUserRole, updateGovernanceUserStatus
} from "@/lib/api/admin-governance-api-client";

export default function AdminGovernancePage() {
  const currentRole: "ADMIN" | "SUPER_ADMIN" = "SUPER_ADMIN";
  const isSuperAdmin = currentRole === "SUPER_ADMIN";
  const [users, setUsers] = React.useState<GovernanceUser[]>([]);
  const [requests, setRequests] = React.useState<GovernanceAccessRequest[]>([]);
  const [audit, setAudit] = React.useState<GovernanceAuditEvent[]>([]);
  const [selectedIds, setSelectedIds] = React.useState<string[]>([]);
  const [search, setSearch] = React.useState("");
  const [roleFilter, setRoleFilter] = React.useState("ALL");
  const [statusFilter, setStatusFilter] = React.useState("ALL");
  const [auditSearch, setAuditSearch] = React.useState("");
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState<string | null>(null);

  const load = React.useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const [usersRes, requestsRes, auditRes] = await Promise.all([
        listGovernanceUsers({
          search: search || undefined,
          role: roleFilter !== "ALL" ? roleFilter : undefined,
          status: statusFilter !== "ALL" ? statusFilter : undefined,
        }),
        listGovernanceAccessRequests(),
        listGovernanceAuditEvents(),
      ]);
      setUsers(usersRes);
      setRequests(requestsRes);
      setAudit(auditRes);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load governance data.");
    } finally {
      setLoading(false);
    }
  }, [search, roleFilter, statusFilter]);

  React.useEffect(() => { void load(); }, [load]);

  const onUserRoleChange = async (userId: string, role: GovernanceRole) => {
    const updated = await updateGovernanceUserRole(userId, role);
    setUsers((current) => current.map((item) => (item.id === userId ? updated : item)));
  };

  const onUserStatusChange = async (userId: string, status: GovernanceStatus) => {
    const updated = await updateGovernanceUserStatus(userId, status);
    setUsers((current) => current.map((item) => (item.id === userId ? updated : item)));
  };

  const onBulkRoleAssign = async (role: GovernanceRole) => {
    if (!selectedIds.length) return;
    await bulkAssignGovernanceRole(selectedIds, role);
    await load();
    setSelectedIds([]);
  };

  const onBulkSuspend = async () => {
    if (!selectedIds.length) return;
    await bulkSuspendGovernanceUsers(selectedIds);
    await load();
    setSelectedIds([]);
  };

  const onApprove = async (id: string) => {
    const updated = await approveGovernanceAccessRequest(id);
    setRequests((current) => current.map((item) => (item.id === id ? updated : item)));
  };

  const onReject = async (id: string) => {
    const updated = await rejectGovernanceAccessRequest(id);
    setRequests((current) => current.map((item) => (item.id === id ? updated : item)));
  };

  return (
    <GovernanceShell
      title="Governance Control Center"
      description="Search users, review access requests, inspect audit events, and run elevated admin actions."
      role={currentRole}
    >
      {loading ? (
        <GovernanceLoading />
      ) : error ? (
        <GovernanceError message={error} onRetry={() => void load()} />
      ) : (
        <div className="space-y-6">
          <div className="grid gap-4 md:grid-cols-3">
            <Card className="rounded-2xl border-0 shadow-sm">
              <CardHeader><CardTitle className="flex items-center gap-2"><UserCog className="h-4 w-4 text-violet-600" />Governance Users</CardTitle><CardDescription>Total loaded users in current filter scope.</CardDescription></CardHeader>
              <CardContent><p className="text-3xl font-semibold">{users.length}</p></CardContent>
            </Card>
            <Card className="rounded-2xl border-0 shadow-sm">
              <CardHeader><CardTitle className="flex items-center gap-2"><ShieldAlert className="h-4 w-4 text-violet-600" />Access Requests</CardTitle><CardDescription>Approval items requiring administrative review.</CardDescription></CardHeader>
              <CardContent><p className="text-3xl font-semibold">{requests.filter((r) => r.status === "PENDING").length}</p></CardContent>
            </Card>
            <Card className="rounded-2xl border-0 shadow-sm">
              <CardHeader><CardTitle className="flex items-center gap-2"><UserX className="h-4 w-4 text-violet-600" />Suspended Users</CardTitle><CardDescription>Current suspended accounts in the filtered result set.</CardDescription></CardHeader>
              <CardContent><p className="text-3xl font-semibold">{users.filter((u) => u.status === "SUSPENDED").length}</p></CardContent>
            </Card>
          </div>

          <Card className="rounded-2xl border-0 shadow-sm">
            <CardHeader><CardTitle>User Governance</CardTitle><CardDescription>Search, filter, assign roles, suspend accounts, and run bulk governance actions.</CardDescription></CardHeader>
            <CardContent>
              <GovernanceUserTable
                users={users}
                selectedIds={selectedIds}
                onSelectedIdsChange={setSelectedIds}
                search={search}
                onSearchChange={setSearch}
                roleFilter={roleFilter}
                onRoleFilterChange={setRoleFilter}
                statusFilter={statusFilter}
                onStatusFilterChange={setStatusFilter}
                onUserRoleChange={(userId, role) => void onUserRoleChange(userId, role)}
                onUserStatusChange={(userId, status) => void onUserStatusChange(userId, status)}
                onBulkRoleAssign={(role) => void onBulkRoleAssign(role)}
                onBulkSuspend={() => void onBulkSuspend()}
                isSuperAdmin={isSuperAdmin}
              />
            </CardContent>
          </Card>

          <Card className="rounded-2xl border-0 shadow-sm">
            <CardHeader><CardTitle>Access Request Approval Queue</CardTitle><CardDescription>Approve or reject new access requests and role elevation requests.</CardDescription></CardHeader>
            <CardContent><GovernanceAccessRequestQueue items={requests} onApprove={(id) => void onApprove(id)} onReject={(id) => void onReject(id)} /></CardContent>
          </Card>

          <Card className="rounded-2xl border-0 shadow-sm">
            <CardHeader><CardTitle>Audit Explorer</CardTitle><CardDescription>Search across recent governance events, changes, and approvals.</CardDescription></CardHeader>
            <CardContent><GovernanceAuditExplorer items={audit} search={auditSearch} onSearchChange={setAuditSearch} /></CardContent>
          </Card>

          {isSuperAdmin ? (
            <Card className="rounded-2xl border border-violet-200 bg-violet-50/60 shadow-sm">
              <CardHeader><CardTitle>Super-Admin Controls</CardTitle><CardDescription>Restricted actions available only to SUPER_ADMIN.</CardDescription></CardHeader>
              <CardContent className="text-sm text-slate-700">Super-admin controls are enabled. Role reassignment to ADMIN and SUPER_ADMIN can be surfaced here, along with advanced policy enforcement actions.</CardContent>
            </Card>
          ) : null}
        </div>
      )}
    </GovernanceShell>
  );
}
