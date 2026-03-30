'use client';

import * as React from 'react';
import Link from 'next/link';
import { Activity, ClipboardList, Database, Lock, ScrollText, Shield, ShieldCheck, Users } from 'lucide-react';
import { ProtectedRoute } from '@/components/protected-route';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { AdminShell } from '@/components/admin/admin-shell';
import { AdminError, AdminLoading } from '@/components/admin/admin-states';
import { getAdminOverview, type AdminOverview } from '@/lib/api/admin-api-client';

function AdminContent() {
  const [overview, setOverview] = React.useState<AdminOverview | null>(null);
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState<string | null>(null);

  const metrics = overview
    ? [
        { label: 'Total Users', value: overview.totalUsers, icon: Users },
        { label: 'Active Sessions', value: overview.activeSessions, icon: Shield },
        { label: 'Total Datasets', value: overview.totalDatasets, icon: Database },
        { label: 'Running Jobs', value: overview.runningJobs, icon: Activity },
        { label: 'Pending Approvals', value: overview.pendingApprovals, icon: ClipboardList },
      ]
    : [];

  const navCards = [
    { href: '/admin', title: 'Admin Dashboard', description: 'Separate executive overview for platform-wide control.', icon: Shield },
    { href: '/admin/users', title: 'User Management', description: 'Manage user roles, statuses, and platform identities.', icon: Users },
    { href: '/admin/governance', title: 'Governance Center', description: 'Search users, apply bulk governance actions, and review admin audit history.', icon: ShieldCheck },
    { href: '/admin/access', title: 'Access Governance', description: 'Track access posture and permission distribution.', icon: Lock },
    { href: '/admin/registrations', title: 'Registration Queue', description: 'Approve or reject incoming researcher registrations.', icon: ClipboardList },
    { href: '/admin/audit', title: 'Audit Logs', description: 'Review high-value administrative and compliance events.', icon: ScrollText },
    { href: '/admin/monitoring', title: 'System Monitoring', description: 'Monitor queues, jobs, and runtime health signals.', icon: Activity },
  ];

  const load = React.useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      setOverview(await getAdminOverview());
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load admin overview.');
    } finally {
      setLoading(false);
    }
  }, []);

  React.useEffect(() => {
    void load();
  }, [load]);

  return (
    <AdminShell title="Admin Dashboard" description="System-wide platform control, approvals, governance, and monitoring.">
      {loading ? <AdminLoading cards={3} /> : null}
      {!loading && error ? <AdminError message={error} onRetry={() => void load()} /> : null}
      {!loading && !error && overview ? (
        <div className="space-y-6">
          <div className="flex flex-wrap gap-2">
            <Badge variant="secondary" className="rounded-full px-3 py-1">{overview.totalUsers} total users</Badge>
            <Badge variant="secondary" className="rounded-full px-3 py-1">{overview.activeSessions} active sessions</Badge>
            <Badge variant="secondary" className="rounded-full px-3 py-1">{overview.totalDatasets} datasets</Badge>
            <Badge variant="secondary" className="rounded-full px-3 py-1">{overview.runningJobs} running jobs</Badge>
            <Badge className={overview.systemHealth === 'Healthy' ? 'rounded-full border-emerald-200 bg-emerald-50 text-emerald-700' : overview.systemHealth === 'Warning' ? 'rounded-full border-amber-200 bg-amber-50 text-amber-700' : 'rounded-full border-red-200 bg-red-50 text-red-700'}>
              {overview.systemHealth}
            </Badge>
          </div>

          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
            {metrics.map(({ label, value, icon: MetricIcon }) => {
              return (
                <Card key={label} className="rounded-2xl border-0 shadow-sm">
                  <CardContent className="flex items-start justify-between p-5">
                    <div>
                      <p className="text-sm font-medium text-slate-500">{label}</p>
                      <p className="mt-3 text-3xl font-semibold tracking-tight text-slate-950">{value}</p>
                    </div>
                    <div className="rounded-2xl border bg-slate-50 p-3 text-cyan-700">
                      <MetricIcon className="h-5 w-5" />
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>

          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
            {navCards.map(({ href, title, description, icon: NavIcon }) => {
              return (
                <Link key={href} href={href}>
                  <Card className="h-full rounded-2xl border-0 shadow-sm transition hover:-translate-y-0.5 hover:shadow-md">
                    <CardContent className="p-6">
                      <div className="mb-4 inline-flex rounded-2xl border bg-slate-50 p-3 text-cyan-700">
                        <NavIcon className="h-5 w-5" />
                      </div>
                      <h3 className="text-xl font-semibold text-slate-950">{title}</h3>
                      <p className="mt-2 text-sm text-slate-600">{description}</p>
                    </CardContent>
                  </Card>
                </Link>
              );
            })}
          </div>
        </div>
      ) : null}
    </AdminShell>
  );
}

export default function AdminPage() {
  return (
    <ProtectedRoute allowedRoles={['ADMIN', 'SUPER_ADMIN']}>
      <AdminContent />
    </ProtectedRoute>
  );
}
