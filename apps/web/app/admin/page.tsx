'use client';

import * as React from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  Activity,
  ArrowRight,
  BellRing,
  CheckCircle2,
  ClipboardList,
  Database,
  Download,
  LogOut,
  Radio,
  RefreshCw,
  ServerCog,
  Shield,
  ShieldAlert,
  Users,
  Wrench,
} from 'lucide-react';
import { ProtectedRoute } from '@/components/protected-route';
import { AdminError, AdminLoading } from '@/components/admin/admin-states';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { useAuth } from '@/lib/auth-context';
import { cn } from '@/lib/utils';
import { getAdminOverview, type AdminOverview } from '@/lib/api/admin-api-client';
import { exportAdminAuditEventsCsv } from '@/lib/api/admin-policy-api-client';
import { toast } from 'sonner';

type Health = 'Healthy' | 'Warning' | 'Critical';

type AuditItem = {
  id: string;
  action: string;
  actor: string;
  target: string;
  time: string;
  severity: 'LOW' | 'MEDIUM' | 'HIGH';
};

const recentAudit: AuditItem[] = [
  {
    id: '1',
    action: 'ROLE_UPDATED',
    actor: 'Admin Console',
    target: 'jgodwin@datanotchplatform.org',
    time: '10 min ago',
    severity: 'MEDIUM',
  },
  {
    id: '2',
    action: 'LOGIN_VERIFIED',
    actor: 'System',
    target: 'donneyong.1@osu.edu',
    time: '22 min ago',
    severity: 'LOW',
  },
  {
    id: '3',
    action: 'ACCESS_REQUEST_APPROVED',
    actor: 'Admin Console',
    target: 'new.user@example.edu',
    time: '1 hr ago',
    severity: 'HIGH',
  },
];

const quickCards = [
  {
    href: '/admin',
    title: 'Admin Dashboard',
    desc: 'Separate executive overview for platform-wide control.',
    badge: 'overview',
    icon: Shield,
  },
  {
    href: '/admin/users',
    title: 'User Management',
    desc: 'Manage user roles, statuses, and platform identities.',
    badge: 'users',
    icon: Users,
  },
  {
    href: '/admin/governance',
    title: 'Governance Center',
    desc: 'Search users, apply bulk governance actions, and review audit history.',
    badge: 'governance',
    icon: ShieldAlert,
  },
  {
    href: '/admin/policy',
    title: 'Policy & Bulk Ops',
    desc: 'Permission matrix, reasoned bulk actions, and audit export controls.',
    badge: 'super-admin',
    icon: Wrench,
  },
  {
    href: '/admin/access',
    title: 'Access Governance',
    desc: 'Track access posture and permission distribution.',
    badge: 'access',
    icon: Shield,
  },
  {
    href: '/admin/registrations',
    title: 'Registration Queue',
    desc: 'Approve or reject incoming researcher registrations.',
    badge: '0 pending',
    icon: ClipboardList,
  },
  {
    href: '/admin/audit',
    title: 'Audit Logs',
    desc: 'Review high-value administrative and compliance events.',
    badge: '18 today',
    icon: BellRing,
  },
  {
    href: '/admin/monitoring',
    title: 'System Monitoring',
    desc: 'Monitor queues, jobs, and runtime health signals.',
    badge: 'healthy',
    icon: Activity,
  },
  {
    href: '/admin/operations',
    title: 'Operations Center',
    desc: 'Production readiness, worker controls, health checks, and deployment guardrails.',
    badge: 'ops',
    icon: ServerCog,
  },
];

function healthBadge(health: Health) {
  if (health === 'Healthy') {
    return <Badge className="border-emerald-200 bg-emerald-50 text-emerald-700">Healthy</Badge>;
  }

  if (health === 'Warning') {
    return <Badge className="border-amber-200 bg-amber-50 text-amber-700">Warning</Badge>;
  }

  return <Badge className="border-red-200 bg-red-50 text-red-700">Critical</Badge>;
}

function severityBadge(severity: AuditItem['severity']) {
  if (severity === 'LOW') return <Badge variant="secondary">LOW</Badge>;
  if (severity === 'MEDIUM') {
    return <Badge className="border-amber-200 bg-amber-50 text-amber-700">MEDIUM</Badge>;
  }
  return <Badge className="border-red-200 bg-red-50 text-red-700">HIGH</Badge>;
}

function statusChip({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div className="inline-flex items-center gap-1.5 rounded-full border bg-white px-2.5 py-1 text-xs shadow-sm">
      <span className="text-slate-500">{label}</span>
      <span className="font-semibold text-slate-900">{value}</span>
    </div>
  );
}

function alertToneClass(tone: string) {
  switch (tone) {
    case 'healthy':
      return 'border-emerald-200 bg-emerald-50';
    case 'warning':
      return 'border-amber-200 bg-amber-50';
    case 'critical':
      return 'border-red-200 bg-red-50';
    default:
      return 'border-slate-200 bg-slate-50';
  }
}

function metricAccent(title: string) {
  if (title.includes('Users')) return 'bg-sky-50 text-sky-700 border-sky-200';
  if (title.includes('Sessions')) return 'bg-violet-50 text-violet-700 border-violet-200';
  if (title.includes('Datasets')) return 'bg-cyan-50 text-cyan-700 border-cyan-200';
  if (title.includes('Jobs')) return 'bg-amber-50 text-amber-700 border-amber-200';
  return 'bg-emerald-50 text-emerald-700 border-emerald-200';
}

function AdminContent() {
  const router = useRouter();
  const { logout } = useAuth();
  const ADMIN_SIGNOUT_FALLBACK_URL = 'http://localhost:3000/admin';
  const [overview, setOverview] = React.useState<AdminOverview | null>(null);
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState<string | null>(null);
  const [exporting, setExporting] = React.useState(false);

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

  const overviewData = {
    totalUsers: overview?.totalUsers ?? 0,
    activeSessions: overview?.activeSessions ?? 0,
    totalDatasets: overview?.totalDatasets ?? 0,
    runningJobs: overview?.runningJobs ?? 0,
    pendingApprovals: overview?.pendingApprovals ?? 0,
    systemHealth: (overview?.systemHealth ?? 'Healthy') as Health,
  };

  const alerts = [
    {
      title: 'Approvals Queue',
      text:
        overviewData.pendingApprovals === 0
          ? 'No pending registration approvals right now.'
          : `${overviewData.pendingApprovals} registration approvals need review.`,
      tone: overviewData.pendingApprovals > 0 ? 'warning' : 'healthy',
      cta: '/admin/registrations',
    },
    {
      title: 'Suspicious Sign-ins',
      text: 'Recent high-value login events are available for review in audit logs.',
      tone: 'warning',
      cta: '/admin/audit',
    },
    {
      title: 'Queue Latency',
      text: overviewData.runningJobs > 0 ? `${overviewData.runningJobs} running jobs are currently active.` : 'Job queue is stable and below threshold.',
      tone: overviewData.runningJobs > 5 ? 'critical' : 'healthy',
      cta: '/admin/monitoring',
    },
    {
      title: 'Storage Warnings',
      text: 'No storage anomalies detected in recent telemetry windows.',
      tone: 'healthy',
      cta: '/admin/monitoring',
    },
    {
      title: 'Failed Job Spikes',
      text: overviewData.runningJobs > 8 ? 'Failure spike trend detected. Open operations panel now.' : 'No failed job spike pattern detected.',
      tone: overviewData.runningJobs > 8 ? 'critical' : 'healthy',
      cta: '/admin/monitoring',
    },
  ];

  async function exportAudit() {
    setExporting(true);
    try {
      const csv = await exportAdminAuditEventsCsv();
      const blob = new Blob([csv], { type: 'text/csv;charset=utf-8' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = 'admin-audit-events.csv';
      document.body.appendChild(link);
      link.click();
      link.remove();
      URL.revokeObjectURL(url);
      toast.success('Audit export downloaded.');
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Failed to export audit events.');
    } finally {
      setExporting(false);
    }
  }

  function handleSignOut() {
    logout();
    router.replace('/admin');

    // Hard fallback in case client-side navigation is interrupted.
    if (typeof window !== 'undefined') {
      window.setTimeout(() => {
        if (window.location.pathname !== '/admin') {
          window.location.assign(ADMIN_SIGNOUT_FALLBACK_URL);
        }
      }, 150);
    }
  }

  function handleServiceAction(service: 'audio' | 'video' | 'messaging') {
    if (service === 'audio') {
      toast.success('Launching R-MEET audio call tools.');
      router.push('/admin/communication?mode=audio');
      return;
    }

    if (service === 'video') {
      toast.success('Launching R-ZOOMA video call tools.');
      router.push('/admin/communication?mode=video');
      return;
    }

    toast.success('Opening messaging and text/email service.');
    router.push('/admin/communication?mode=messaging');
  }

  return (
    <div className="min-h-screen bg-slate-50/60">
      <div className="border-b bg-white">
        <div className="mx-auto max-w-7xl px-4 py-5 md:px-6">
          <div className="rounded-2xl border bg-linear-to-r from-white via-slate-50 to-violet-50 p-4 shadow-sm md:p-5">
            <div className="flex flex-col gap-6 xl:flex-row xl:items-start xl:justify-between">
              <div>
                <p className="text-sm font-medium text-slate-500">Admin Console</p>
                <h1 className="mt-1.5 text-3xl font-semibold tracking-tight text-slate-950">Admin Dashboard</h1>
                <p className="mt-2 max-w-3xl text-sm text-slate-600 md:text-base">
                  System-wide platform control, approvals, governance, and monitoring.
                </p>

                <div className="mt-4 flex flex-wrap gap-2">
                  {statusChip({ label: 'Role', value: 'ADMIN' })}
                  {statusChip({ label: 'Environment', value: 'Production' })}
                  {statusChip({ label: 'Last Sync', value: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) })}
                  {statusChip({ label: 'Policy Mode', value: 'Enforced' })}
                </div>
              </div>

              <div className="flex flex-wrap gap-2">
                <Button variant="outline" onClick={() => void load()}>
                  <RefreshCw className="mr-2 h-4 w-4" />
                  Refresh Metrics
                </Button>
                <Button variant="outline" onClick={() => void exportAudit()} disabled={exporting}>
                  <Download className="mr-2 h-4 w-4" />
                  {exporting ? 'Exporting...' : 'Export Audit'}
                </Button>
                <Button
                  variant="outline"
                  onClick={() => {
                    toast.info('Opening audit notice queue.');
                    router.push('/admin/audit');
                  }}
                >
                  <Radio className="mr-2 h-4 w-4" />
                  Broadcast Notice
                </Button>
                <div className="flex flex-col items-end gap-1.5">
                  <Button
                    onClick={() => {
                      toast.info('Opening user management to create an admin.');
                      router.push('/admin/users');
                    }}
                  >
                    <Users className="mr-2 h-4 w-4" />
                    Create Admin
                  </Button>
                  <Button variant="ghost" size="sm" className="w-full justify-end" onClick={handleSignOut}>
                    <LogOut className="mr-2 h-4 w-4" />
                    Sign Out
                  </Button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <main className="mx-auto max-w-7xl space-y-5 px-4 py-5 md:px-6">
        {loading ? <AdminLoading cards={3} /> : null}
        {!loading && error ? <AdminError message={error} onRetry={() => void load()} /> : null}
        {!loading && !error ? (
          <>
            <section className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
              {alerts.map((item) => (
                <div
                  key={item.title}
                  className={cn(
                    'flex items-start justify-between gap-3 rounded-xl border p-3 shadow-sm',
                    alertToneClass(item.tone),
                  )}
                >
                  <div>
                    <p className="text-sm font-semibold text-slate-950">{item.title}</p>
                    <p className="mt-1 text-xs text-slate-600 md:text-sm">{item.text}</p>
                  </div>
                  <Link
                    href={item.cta}
                    className="inline-flex shrink-0 items-center gap-1 text-sm font-medium text-slate-700 hover:text-slate-950"
                  >
                    Open
                    <ArrowRight className="h-4 w-4" />
                  </Link>
                </div>
              ))}

              <div className="rounded-xl border-4 border-sky-500 bg-white p-1.5 shadow-sm">
                <div className="grid grid-cols-3 gap-1">
                  <div className="text-center">
                    <button
                      type="button"
                      className="w-full whitespace-nowrap rounded-2xl border-4 border-amber-700 bg-white px-1 py-1 text-[1.2rem] font-extrabold leading-none tracking-tight text-indigo-700 shadow-[0_0_0.6rem_rgba(180,83,9,0.35)] transition-all duration-200 hover:scale-[1.02] hover:shadow-[0_0_1rem_rgba(79,70,229,0.55)] focus-visible:outline-hidden focus-visible:ring-2 focus-visible:ring-indigo-400 active:scale-[0.99]"
                      onClick={() => handleServiceAction('audio')}
                    >
                      R-MEET
                    </button>
                    <p className="mt-0.5 text-center text-[9px] font-bold leading-tight text-slate-800">AUDIO CALL</p>
                  </div>

                  <div className="text-center">
                    <button
                      type="button"
                      className="w-full whitespace-nowrap rounded-2xl border-4 border-black bg-white px-1 py-1 text-[1.2rem] font-extrabold leading-none tracking-tight text-rose-600 shadow-[0_0_0.6rem_rgba(0,0,0,0.28)] transition-all duration-200 hover:scale-[1.02] hover:shadow-[0_0_1rem_rgba(244,63,94,0.55)] focus-visible:outline-hidden focus-visible:ring-2 focus-visible:ring-rose-400 active:scale-[0.99]"
                      onClick={() => handleServiceAction('video')}
                    >
                      R-ZOOMA
                    </button>
                    <p className="mt-0.5 text-center text-[9px] font-bold leading-tight text-emerald-600">VIDEO CALL</p>
                  </div>

                  <div className="text-center">
                    <button
                      type="button"
                      className="w-full whitespace-nowrap rounded-2xl border-4 border-rose-500 bg-white px-1 py-1 text-[0.95rem] font-extrabold leading-none tracking-tight text-fuchsia-700 shadow-[0_0_0.6rem_rgba(236,72,153,0.35)] transition-all duration-200 hover:scale-[1.02] hover:shadow-[0_0_1rem_rgba(162,28,175,0.55)] focus-visible:outline-hidden focus-visible:ring-2 focus-visible:ring-fuchsia-400 active:scale-[0.99]"
                      onClick={() => handleServiceAction('messaging')}
                    >
                      MESSAGING
                    </button>
                    <p className="mt-0.5 text-center text-[8px] font-bold leading-tight text-slate-800">TEXT/EMAIL SERVICE</p>
                  </div>
                </div>
              </div>
            </section>

            <section className="flex flex-wrap gap-2">
              {statusChip({ label: 'Total Users', value: overviewData.totalUsers })}
              {statusChip({ label: 'Active Sessions', value: overviewData.activeSessions })}
              {statusChip({ label: 'Datasets', value: overviewData.totalDatasets })}
              {statusChip({ label: 'Running Jobs', value: overviewData.runningJobs })}
              {statusChip({ label: 'Pending Approvals', value: overviewData.pendingApprovals })}
              {statusChip({ label: 'System Health', value: healthBadge(overviewData.systemHealth) })}
            </section>

            <section className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
              {[
                { title: 'Total Users', value: overviewData.totalUsers, helper: '+2 this week', icon: Users, href: '/admin/users' },
                { title: 'Active Sessions', value: overviewData.activeSessions, helper: 'Stable last 24h', icon: Shield, href: '/admin/access' },
                { title: 'Total Datasets', value: overviewData.totalDatasets, helper: 'No new uploads today', icon: Database, href: '/admin/access' },
                { title: 'Running Jobs', value: overviewData.runningJobs, helper: 'Within expected range', icon: Activity, href: '/admin/monitoring' },
                { title: 'Pending Approvals', value: overviewData.pendingApprovals, helper: 'Queue visibility enabled', icon: ClipboardList, href: '/admin/registrations' },
                { title: 'System Health', value: overviewData.systemHealth, helper: 'Policy and services enforced', icon: ServerCog, href: '/admin/monitoring' },
              ].map((item) => {
                const Icon = item.icon;
                return (
                  <Link key={item.title} href={item.href}>
                    <Card className="rounded-xl border-0 shadow-sm transition hover:-translate-y-0.5 hover:shadow-md">
                      <CardContent className="p-4">
                        <div className="flex items-start justify-between gap-3">
                          <div>
                            <p className="text-sm font-medium text-slate-500">{item.title}</p>
                            <p className="mt-2 text-3xl font-semibold tracking-tight text-slate-950">{item.value}</p>
                            <p className="mt-1.5 text-xs text-slate-600 md:text-sm">{item.helper}</p>
                          </div>
                          <div className={cn('rounded-xl border p-2.5', metricAccent(item.title))}>
                            <Icon className="h-4.5 w-4.5" />
                          </div>
                        </div>
                        <div className="mt-4 inline-flex items-center gap-2 text-xs font-medium text-violet-700">
                          View details
                          <ArrowRight className="h-3.5 w-3.5" />
                        </div>
                      </CardContent>
                    </Card>
                  </Link>
                );
              })}
            </section>

            <section className="grid gap-5 xl:grid-cols-[1.3fr_0.7fr]">
              <div className="space-y-5">
                <div>
                  <p className="text-xs font-semibold uppercase tracking-[0.22em] text-slate-400">Governance</p>
                  <div className="mt-2.5 grid gap-3 md:grid-cols-2 xl:grid-cols-2">
                    {quickCards.slice(0, 4).map((item) => {
                      const Icon = item.icon;
                      return (
                        <Link key={item.title} href={item.href}>
                          <Card className="h-full rounded-xl border-0 shadow-sm transition hover:-translate-y-0.5 hover:shadow-md">
                            <CardContent className="flex h-full flex-col p-4">
                              <div className="flex items-start justify-between gap-3">
                                <div className="rounded-xl border bg-slate-50 p-2.5 text-violet-700">
                                  <Icon className="h-5 w-5" />
                                </div>
                                <Badge variant="secondary" className="rounded-full">
                                  {item.badge}
                                </Badge>
                              </div>
                              <h3 className="mt-4 text-xl font-semibold tracking-tight text-slate-950">{item.title}</h3>
                              <p className="mt-2 flex-1 text-sm leading-6 text-slate-600">{item.desc}</p>
                              <div className="mt-4 inline-flex items-center gap-2 text-sm font-medium text-violet-700">
                                Open module
                                <ArrowRight className="h-4 w-4" />
                              </div>
                            </CardContent>
                          </Card>
                        </Link>
                      );
                    })}
                  </div>
                </div>

                <div>
                  <p className="text-xs font-semibold uppercase tracking-[0.22em] text-slate-400">Compliance</p>
                  <div className="mt-2.5 grid gap-3 md:grid-cols-2">
                    {quickCards.slice(4, 6).map((item) => {
                      const Icon = item.icon;
                      return (
                        <Link key={item.title} href={item.href}>
                          <Card className="h-full rounded-xl border-0 shadow-sm transition hover:-translate-y-0.5 hover:shadow-md">
                            <CardContent className="flex h-full flex-col p-4">
                              <div className="flex items-start justify-between gap-3">
                                <div className="rounded-xl border bg-slate-50 p-2.5 text-violet-700">
                                  <Icon className="h-5 w-5" />
                                </div>
                                <Badge variant="secondary" className="rounded-full">
                                  {item.badge}
                                </Badge>
                              </div>
                              <h3 className="mt-4 text-xl font-semibold tracking-tight text-slate-950">{item.title}</h3>
                              <p className="mt-2 flex-1 text-sm leading-6 text-slate-600">{item.desc}</p>
                              <div className="mt-4 inline-flex items-center gap-2 text-sm font-medium text-violet-700">
                                Open module
                                <ArrowRight className="h-4 w-4" />
                              </div>
                            </CardContent>
                          </Card>
                        </Link>
                      );
                    })}
                  </div>
                </div>

                <div>
                  <p className="text-xs font-semibold uppercase tracking-[0.22em] text-slate-400">Operations</p>
                  <div className="mt-2.5 grid gap-3 md:grid-cols-2">
                    {quickCards.slice(6, 9).map((item) => {
                      const Icon = item.icon;
                      return (
                        <Link key={item.title} href={item.href}>
                          <Card className="h-full rounded-xl border-0 shadow-sm transition hover:-translate-y-0.5 hover:shadow-md">
                            <CardContent className="flex h-full flex-col p-4">
                              <div className="flex items-start justify-between gap-3">
                                <div className="rounded-xl border bg-slate-50 p-2.5 text-violet-700">
                                  <Icon className="h-5 w-5" />
                                </div>
                                <Badge variant="secondary" className="rounded-full">
                                  {item.badge}
                                </Badge>
                              </div>
                              <h3 className="mt-4 text-xl font-semibold tracking-tight text-slate-950">{item.title}</h3>
                              <p className="mt-2 flex-1 text-sm leading-6 text-slate-600">{item.desc}</p>
                              <div className="mt-4 inline-flex items-center gap-2 text-sm font-medium text-violet-700">
                                Open module
                                <ArrowRight className="h-4 w-4" />
                              </div>
                            </CardContent>
                          </Card>
                        </Link>
                      );
                    })}
                  </div>
                </div>
              </div>

              <div className="space-y-5">
                <Card className="rounded-xl border-0 shadow-sm">
                  <CardContent className="space-y-3 p-4">
                    <div>
                      <p className="text-lg font-semibold text-slate-950">Recent Audit Activity</p>
                      <p className="text-sm text-slate-600">
                        High-value administrative and compliance events from the last 24 hours.
                      </p>
                    </div>
                    {recentAudit.map((item) => (
                      <Link key={item.id} href="/admin/audit" className="block rounded-xl border bg-slate-50 p-3 transition hover:-translate-y-0.5 hover:shadow-sm">
                        <div className="flex items-center justify-between gap-3">
                          <p className="font-medium text-slate-950">{item.action}</p>
                          {severityBadge(item.severity)}
                        </div>
                        <p className="mt-2 text-sm text-slate-600">Actor: {item.actor}</p>
                        <p className="text-sm text-slate-600">Target: {item.target}</p>
                        <p className="mt-2 text-xs text-slate-500">{item.time}</p>
                      </Link>
                    ))}
                  </CardContent>
                </Card>

                <Card className="rounded-xl border-0 shadow-sm">
                  <CardContent className="grid gap-3 p-4">
                    <div>
                      <p className="text-lg font-semibold text-slate-950">Operational Snapshot</p>
                      <p className="text-sm text-slate-600">Current platform posture for admins on duty.</p>
                    </div>

                    <div className="rounded-2xl border bg-slate-50 p-4">
                      <div className="flex items-center gap-2 text-slate-950">
                        <CheckCircle2 className="h-4 w-4 text-emerald-600" />
                        <span className="font-medium">Health Stable</span>
                      </div>
                      <p className="mt-2 text-sm text-slate-500">
                        Core services are healthy and queue depth is within normal range.
                      </p>
                    </div>

                    <div className="rounded-2xl border bg-slate-50 p-4">
                      <div className="flex items-center gap-2 text-slate-950">
                        <Shield className="h-4 w-4 text-violet-600" />
                        <span className="font-medium">Policy Enforcement Active</span>
                      </div>
                      <p className="mt-2 text-sm text-slate-500">
                        Admin RBAC, approval gating, and governance audit trails are active.
                      </p>
                    </div>

                    <div className="rounded-2xl border bg-slate-50 p-4">
                      <div className="flex items-center gap-2 text-slate-950">
                        <ServerCog className="h-4 w-4 text-sky-600" />
                        <span className="font-medium">Monitoring Online</span>
                      </div>
                      <p className="mt-2 text-sm text-slate-500">
                        API latency, runtime health, and system operations are being tracked.
                      </p>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </section>
          </>
        ) : null}
      </main>
    </div>
  );
}

export default function AdminPage() {
  return (
    <ProtectedRoute allowedRoles={['ADMIN', 'SUPER_ADMIN']}>
      <AdminContent />
    </ProtectedRoute>
  );
}
