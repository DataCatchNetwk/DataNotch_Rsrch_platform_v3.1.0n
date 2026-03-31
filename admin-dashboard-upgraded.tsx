"use client";

import * as React from "react";
import Link from "next/link";
import {
  Activity,
  ArrowRight,
  BellRing,
  CheckCircle2,
  ClipboardList,
  Database,
  Download,
  Radio,
  RefreshCw,
  ServerCog,
  Shield,
  ShieldAlert,
  Users,
  Wrench,
} from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { cn } from "@/lib/utils";

type Health = "Healthy" | "Warning" | "Critical";

type Overview = {
  totalUsers: number;
  activeSessions: number;
  totalDatasets: number;
  runningJobs: number;
  pendingApprovals: number;
  systemHealth: Health;
};

type AuditItem = {
  id: string;
  action: string;
  actor: string;
  target: string;
  time: string;
  severity: "LOW" | "MEDIUM" | "HIGH";
};

const overview: Overview = {
  totalUsers: 5,
  activeSessions: 41,
  totalDatasets: 2,
  runningJobs: 0,
  pendingApprovals: 0,
  systemHealth: "Healthy",
};

const alerts = [
  {
    title: "Approvals Queue",
    text: "No pending registration approvals right now.",
    tone: "healthy",
    cta: "/admin/registrations",
  },
  {
    title: "Security Watch",
    text: "2 recent high-value login events need review.",
    tone: "warning",
    cta: "/admin/audit",
  },
  {
    title: "Worker Queue",
    text: "Job queue is stable and below threshold.",
    tone: "healthy",
    cta: "/admin/monitoring",
  },
];

const recentAudit: AuditItem[] = [
  {
    id: "1",
    action: "ROLE_UPDATED",
    actor: "Admin Console",
    target: "jgodwin@datanotchplatform.org",
    time: "10 min ago",
    severity: "MEDIUM",
  },
  {
    id: "2",
    action: "LOGIN_VERIFIED",
    actor: "System",
    target: "donneyong1@osu.edu",
    time: "22 min ago",
    severity: "LOW",
  },
  {
    id: "3",
    action: "ACCESS_REQUEST_APPROVED",
    actor: "Admin Console",
    target: "new.user@example.edu",
    time: "1 hr ago",
    severity: "HIGH",
  },
];

const quickCards = [
  {
    href: "/admin",
    title: "Admin Dashboard",
    desc: "Separate executive overview for platform-wide control.",
    badge: "overview",
    icon: Shield,
  },
  {
    href: "/admin/users",
    title: "User Management",
    desc: "Manage user roles, statuses, and platform identities.",
    badge: "users",
    icon: Users,
  },
  {
    href: "/admin/governance",
    title: "Governance Center",
    desc: "Search users, apply bulk governance actions, and review audit history.",
    badge: "governance",
    icon: ShieldAlert,
  },
  {
    href: "/admin/policy",
    title: "Policy & Bulk Ops",
    desc: "Permission matrix, reasoned bulk actions, and audit export controls.",
    badge: "super-admin",
    icon: Wrench,
  },
  {
    href: "/admin/access",
    title: "Access Governance",
    desc: "Track access posture and permission distribution.",
    badge: "access",
    icon: Shield,
  },
  {
    href: "/admin/registrations",
    title: "Registration Queue",
    desc: "Approve or reject incoming researcher registrations.",
    badge: "0 pending",
    icon: ClipboardList,
  },
  {
    href: "/admin/audit",
    title: "Audit Logs",
    desc: "Review high-value administrative and compliance events.",
    badge: "18 today",
    icon: BellRing,
  },
  {
    href: "/admin/monitoring",
    title: "System Monitoring",
    desc: "Monitor queues, jobs, and runtime health signals.",
    badge: "healthy",
    icon: Activity,
  },
];

function healthBadge(health: Health) {
  if (health === "Healthy") {
    return <Badge className="border-emerald-200 bg-emerald-50 text-emerald-700">Healthy</Badge>;
  }
  if (health === "Warning") {
    return <Badge className="border-amber-200 bg-amber-50 text-amber-700">Warning</Badge>;
  }
  return <Badge className="border-red-200 bg-red-50 text-red-700">Critical</Badge>;
}

function severityBadge(severity: AuditItem["severity"]) {
  if (severity === "LOW") return <Badge variant="secondary">LOW</Badge>;
  if (severity === "MEDIUM") {
    return <Badge className="border-amber-200 bg-amber-50 text-amber-700">MEDIUM</Badge>;
  }
  return <Badge className="border-red-200 bg-red-50 text-red-700">HIGH</Badge>;
}

function statusChip({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div className="inline-flex items-center gap-2 rounded-full border bg-white px-3 py-1.5 text-sm shadow-sm">
      <span className="text-slate-500">{label}</span>
      <span className="font-semibold text-slate-900">{value}</span>
    </div>
  );
}

function alertToneClass(tone: string) {
  switch (tone) {
    case "healthy":
      return "border-emerald-200 bg-emerald-50";
    case "warning":
      return "border-amber-200 bg-amber-50";
    case "critical":
      return "border-red-200 bg-red-50";
    default:
      return "border-slate-200 bg-slate-50";
  }
}

function metricAccent(title: string) {
  if (title.includes("Users")) return "bg-sky-50 text-sky-700 border-sky-200";
  if (title.includes("Sessions")) return "bg-violet-50 text-violet-700 border-violet-200";
  if (title.includes("Datasets")) return "bg-cyan-50 text-cyan-700 border-cyan-200";
  if (title.includes("Jobs")) return "bg-amber-50 text-amber-700 border-amber-200";
  return "bg-emerald-50 text-emerald-700 border-emerald-200";
}

export default function UpgradedAdminDashboardPage() {
  return (
    <div className="min-h-screen bg-slate-50/60">
      <div className="border-b bg-white">
        <div className="mx-auto max-w-[1550px] px-6 py-8">
          <div className="rounded-3xl border bg-gradient-to-r from-white via-slate-50 to-violet-50 p-6 shadow-sm">
            <div className="flex flex-col gap-6 xl:flex-row xl:items-start xl:justify-between">
              <div>
                <p className="text-sm font-medium text-slate-500">Admin Console</p>
                <h1 className="mt-2 text-4xl font-semibold tracking-tight text-slate-950">
                  Admin Dashboard
                </h1>
                <p className="mt-3 max-w-3xl text-base text-slate-600">
                  System-wide platform control, approvals, governance, and monitoring.
                </p>

                <div className="mt-4 flex flex-wrap gap-2">
                  {statusChip({ label: "Role", value: "ADMIN" })}
                  {statusChip({ label: "Environment", value: "Production" })}
                  {statusChip({ label: "Last Sync", value: "7:54 PM" })}
                  {statusChip({ label: "Policy Mode", value: "Enforced" })}
                </div>
              </div>

              <div className="flex flex-wrap gap-2">
                <Button variant="outline">
                  <RefreshCw className="mr-2 h-4 w-4" />
                  Refresh Metrics
                </Button>
                <Button variant="outline">
                  <Download className="mr-2 h-4 w-4" />
                  Export Audit
                </Button>
                <Button variant="outline">
                  <Radio className="mr-2 h-4 w-4" />
                  Broadcast Notice
                </Button>
                <Button>
                  <Users className="mr-2 h-4 w-4" />
                  Create Admin
                </Button>
              </div>
            </div>
          </div>
        </div>
      </div>

      <main className="mx-auto max-w-[1550px] space-y-6 px-6 py-6">
        <section className="grid gap-4 xl:grid-cols-3">
          {alerts.map((item) => (
            <div
              key={item.title}
              className={cn(
                "flex items-start justify-between gap-4 rounded-2xl border p-4 shadow-sm",
                alertToneClass(item.tone)
              )}
            >
              <div>
                <p className="font-semibold text-slate-950">{item.title}</p>
                <p className="mt-1 text-sm text-slate-600">{item.text}</p>
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
        </section>

        <section className="flex flex-wrap gap-2">
          {statusChip({ label: "Total Users", value: overview.totalUsers })}
          {statusChip({ label: "Active Sessions", value: overview.activeSessions })}
          {statusChip({ label: "Datasets", value: overview.totalDatasets })}
          {statusChip({ label: "Running Jobs", value: overview.runningJobs })}
          {statusChip({ label: "Pending Approvals", value: overview.pendingApprovals })}
          {statusChip({ label: "System Health", value: healthBadge(overview.systemHealth) })}
        </section>

        <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-5">
          {[
            { title: "Total Users", value: overview.totalUsers, helper: "+2 this week", icon: Users },
            { title: "Active Sessions", value: overview.activeSessions, helper: "Stable last 24h", icon: Shield },
            { title: "Total Datasets", value: overview.totalDatasets, helper: "No new uploads today", icon: Database },
            { title: "Running Jobs", value: overview.runningJobs, helper: "18% below last hour", icon: Activity },
            { title: "Pending Approvals", value: overview.pendingApprovals, helper: "All caught up", icon: ClipboardList },
          ].map((item) => {
            const Icon = item.icon;
            return (
              <Card key={item.title} className="rounded-2xl border-0 shadow-sm transition hover:-translate-y-0.5 hover:shadow-md">
                <CardContent className="p-5">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <p className="text-sm font-medium text-slate-500">{item.title}</p>
                      <p className="mt-3 text-4xl font-semibold tracking-tight text-slate-950">{item.value}</p>
                      <p className="mt-2 text-sm text-slate-600">{item.helper}</p>
                    </div>
                    <div className={cn("rounded-2xl border p-3", metricAccent(item.title))}>
                      <Icon className="h-5 w-5" />
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </section>

        <section className="grid gap-6 xl:grid-cols-[1.35fr_0.65fr]">
          <div className="space-y-6">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.22em] text-slate-400">Governance</p>
              <div className="mt-3 grid gap-4 md:grid-cols-2 xl:grid-cols-3">
                {quickCards.slice(0, 6).map((item) => {
                  const Icon = item.icon;
                  return (
                    <Link key={item.title} href={item.href}>
                      <Card className="h-full rounded-2xl border-0 shadow-sm transition hover:-translate-y-0.5 hover:shadow-md">
                        <CardContent className="flex h-full flex-col p-6">
                          <div className="flex items-start justify-between gap-3">
                            <div className="rounded-2xl border bg-slate-50 p-3 text-violet-700">
                              <Icon className="h-5 w-5" />
                            </div>
                            <Badge variant="secondary" className="rounded-full">{item.badge}</Badge>
                          </div>
                          <h3 className="mt-5 text-2xl font-semibold tracking-tight text-slate-950">{item.title}</h3>
                          <p className="mt-3 flex-1 text-sm leading-7 text-slate-600">{item.desc}</p>
                          <div className="mt-5 inline-flex items-center gap-2 text-sm font-medium text-violet-700">
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
              <p className="text-xs font-semibold uppercase tracking-[0.22em] text-slate-400">Compliance & Operations</p>
              <div className="mt-3 grid gap-4 md:grid-cols-2">
                {quickCards.slice(6).map((item) => {
                  const Icon = item.icon;
                  return (
                    <Link key={item.title} href={item.href}>
                      <Card className="h-full rounded-2xl border-0 shadow-sm transition hover:-translate-y-0.5 hover:shadow-md">
                        <CardContent className="flex h-full flex-col p-6">
                          <div className="flex items-start justify-between gap-3">
                            <div className="rounded-2xl border bg-slate-50 p-3 text-violet-700">
                              <Icon className="h-5 w-5" />
                            </div>
                            <Badge variant="secondary" className="rounded-full">{item.badge}</Badge>
                          </div>
                          <h3 className="mt-5 text-2xl font-semibold tracking-tight text-slate-950">{item.title}</h3>
                          <p className="mt-3 flex-1 text-sm leading-7 text-slate-600">{item.desc}</p>
                          <div className="mt-5 inline-flex items-center gap-2 text-sm font-medium text-violet-700">
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

          <div className="space-y-6">
            <Card className="rounded-2xl border-0 shadow-sm">
              <CardHeader>
                <CardTitle>Recent Audit Activity</CardTitle>
                <CardDescription>
                  High-value administrative and compliance events from the last 24 hours.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {recentAudit.map((item) => (
                  <div key={item.id} className="rounded-2xl border bg-slate-50 p-4">
                    <div className="flex items-center justify-between gap-3">
                      <p className="font-medium text-slate-950">{item.action}</p>
                      {severityBadge(item.severity)}
                    </div>
                    <p className="mt-2 text-sm text-slate-600">Actor: {item.actor}</p>
                    <p className="text-sm text-slate-600">Target: {item.target}</p>
                    <p className="mt-2 text-xs text-slate-500">{item.time}</p>
                  </div>
                ))}
              </CardContent>
            </Card>

            <Card className="rounded-2xl border-0 shadow-sm">
              <CardHeader>
                <CardTitle>Operational Snapshot</CardTitle>
                <CardDescription>
                  Current platform posture for admins on duty.
                </CardDescription>
              </CardHeader>
              <CardContent className="grid gap-3">
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
      </main>
    </div>
  );
}
