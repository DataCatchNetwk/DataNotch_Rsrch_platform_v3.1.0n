"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import {
  FolderKanban,
  Plus,
  RefreshCcw,
  Search,
  Users,
  Database,
  BarChart3,
  FileText,
  ArrowRight,
} from "lucide-react";

import { createWorkspace, getMyWorkspaces, type Workspace } from "@/src/lib/api/workspaces";
import { WorkspaceRoleBadge } from "@/components/workspaces/workspace-badges";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { CreateWorkspaceDialog } from "@/components/workspaces/create-workspace-dialog";

export default function WorkspacesPage() {
  const [items, setItems] = useState<Workspace[]>([]);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [query, setQuery] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [openCreate, setOpenCreate] = useState(false);

  async function load() {
    setLoading(true);
    setError(null);
    try {
      const data = await getMyWorkspaces();
      setItems(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load workspaces");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    void load();
  }, []);

  async function handleCreateWorkspace(payload: { name: string; description?: string }) {
    setBusy(true);
    setError(null);
    try {
      const created = await createWorkspace(payload);
      setItems((prev) => [created, ...prev]);
      setOpenCreate(false);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to create workspace");
      throw err;
    } finally {
      setBusy(false);
    }
  }

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return items;

    return items.filter((workspace) => {
      return (
        workspace.name.toLowerCase().includes(q) ||
        (workspace.description ?? "").toLowerCase().includes(q) ||
        workspace.owner.email.toLowerCase().includes(q) ||
        (workspace.owner.name ?? "").toLowerCase().includes(q) ||
        workspace.currentUserRole.toLowerCase().includes(q)
      );
    });
  }, [items, query]);

  const totals = useMemo(() => {
    return items.reduce(
      (acc, workspace) => {
        acc.workspaces += 1;
        acc.members += workspace._count?.members ?? 0;
        acc.datasets += workspace._count?.datasets ?? 0;
        acc.analysis += workspace._count?.analysisJobs ?? 0;
        acc.reports += workspace._count?.reports ?? 0;
        return acc;
      },
      {
        workspaces: 0,
        members: 0,
        datasets: 0,
        analysis: 0,
        reports: 0,
      },
    );
  }, [items]);

  return (
    <div className="min-h-screen bg-slate-50">
      <div className="mx-auto max-w-7xl px-6 py-8">
        <div className="space-y-8">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
            <div>
              <h1 className="text-3xl font-bold tracking-tight text-slate-900">Workspaces</h1>
              <p className="mt-1 text-sm text-slate-600">
                Manage collaborative research environments, datasets, analysis, and reports.
              </p>
            </div>

            <div className="flex flex-wrap gap-2">
              <Button
                variant="outline"
                onClick={() => void load()}
                className="rounded-xl border-slate-200 bg-white text-slate-700"
              >
                <RefreshCcw className="mr-2 h-4 w-4" />
                Refresh
              </Button>

              <Button
                onClick={() => setOpenCreate(true)}
                className="rounded-xl bg-linear-to-r from-indigo-500 to-violet-600 text-white"
              >
                <Plus className="mr-2 h-4 w-4" />
                Create Workspace
              </Button>
            </div>
          </div>

          {error ? (
            <Card className="rounded-2xl border-rose-200 bg-rose-50 shadow-sm">
              <CardContent className="p-4 text-sm text-rose-700">{error}</CardContent>
            </Card>
          ) : null}

          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-5">
            <StatCard
              label="Workspaces"
              value={String(totals.workspaces)}
              icon={<FolderKanban className="h-5 w-5" />}
            />
            <StatCard
              label="Members"
              value={String(totals.members)}
              icon={<Users className="h-5 w-5" />}
            />
            <StatCard
              label="Datasets"
              value={String(totals.datasets)}
              icon={<Database className="h-5 w-5" />}
            />
            <StatCard
              label="Analysis Jobs"
              value={String(totals.analysis)}
              icon={<BarChart3 className="h-5 w-5" />}
            />
            <StatCard
              label="Reports"
              value={String(totals.reports)}
              icon={<FileText className="h-5 w-5" />}
            />
          </div>

          <Card className="rounded-2xl border-slate-200 bg-white shadow-sm">
            <CardContent className="p-5">
              <div className="relative w-full max-w-xl">
                <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                <Input
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  placeholder="Search workspaces by name, description, owner, or role..."
                  className="h-11 rounded-xl border-slate-200 bg-slate-50 pl-10"
                />
              </div>
            </CardContent>
          </Card>

          <div className="grid gap-5">
            {loading ? (
              <EmptyCard label="Loading workspaces..." />
            ) : filtered.length === 0 ? (
              <EmptyCard label="No workspaces found." />
            ) : (
              filtered.map((workspace) => (
                <Card
                  key={workspace.id}
                  className="rounded-2xl border-slate-200 bg-white shadow-sm transition hover:-translate-y-0.5 hover:shadow-md"
                >
                  <CardContent className="p-6">
                    <div className="flex flex-col gap-5 xl:flex-row xl:items-start xl:justify-between">
                      <div className="space-y-3">
                        <div className="flex flex-wrap items-center gap-2">
                          <h2 className="text-lg font-semibold text-slate-900">{workspace.name}</h2>
                          <WorkspaceRoleBadge role={workspace.currentUserRole} />
                          <StatusBadge status={workspace.status} />
                          <BadgePill label={workspace.status === "ACTIVE" ? "Live" : "Archived"} />
                        </div>

                        <p className="max-w-4xl text-sm leading-6 text-slate-600">
                          {workspace.description || "No workspace description provided."}
                        </p>

                        <div className="flex flex-wrap gap-4 text-xs text-slate-500">
                          <span>Owner: {workspace.owner.name || workspace.owner.email}</span>
                          <span>Members: {workspace._count?.members ?? 0}</span>
                          <span>Datasets: {workspace._count?.datasets ?? 0}</span>
                          <span>Analysis Jobs: {workspace._count?.analysisJobs ?? 0}</span>
                          <span>Reports: {workspace._count?.reports ?? 0}</span>
                          <span>Updated: {new Date(workspace.updatedAt).toLocaleString()}</span>
                        </div>
                      </div>

                      <div className="flex flex-wrap gap-2">
                        <QuickCounter
                          icon={<Users className="h-4 w-4" />}
                          label={String(workspace._count?.members ?? 0)}
                        />
                        <QuickCounter
                          icon={<Database className="h-4 w-4" />}
                          label={String(workspace._count?.datasets ?? 0)}
                        />
                        <QuickCounter
                          icon={<BarChart3 className="h-4 w-4" />}
                          label={String(workspace._count?.analysisJobs ?? 0)}
                        />
                        <QuickCounter
                          icon={<FileText className="h-4 w-4" />}
                          label={String(workspace._count?.reports ?? 0)}
                        />

                        <Button asChild className="rounded-xl bg-linear-to-r from-indigo-500 to-violet-600 text-white">
                          <Link href={`/dashboard/workspaces/${workspace.id}`}>
                            Open Workspace
                            <ArrowRight className="ml-2 h-4 w-4" />
                          </Link>
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))
            )}
          </div>
        </div>
      </div>

      <CreateWorkspaceDialog
        open={openCreate}
        onOpenChange={setOpenCreate}
        onSubmit={handleCreateWorkspace}
        busy={busy}
      />
    </div>
  );
}

function StatCard({
  label,
  value,
  icon,
}: {
  label: string;
  value: string;
  icon: React.ReactNode;
}) {
  return (
    <Card className="rounded-2xl border-slate-200 bg-white shadow-sm">
      <CardContent className="flex items-start justify-between p-5">
        <div>
          <p className="text-sm text-slate-500">{label}</p>
          <p className="mt-2 text-2xl font-bold text-slate-900">{value}</p>
        </div>
        <div className="rounded-xl bg-violet-100 p-3 text-violet-700">{icon}</div>
      </CardContent>
    </Card>
  );
}

function EmptyCard({ label }: { label: string }) {
  return (
    <Card className="rounded-2xl border-slate-200 bg-white shadow-sm">
      <CardContent className="p-6 text-sm text-slate-500">{label}</CardContent>
    </Card>
  );
}

function StatusBadge({ status }: { status: string }) {
  const className =
    status === "ACTIVE"
      ? "rounded-full border-emerald-200 bg-emerald-50 text-emerald-700"
      : "rounded-full border-amber-200 bg-amber-50 text-amber-700";

  return (
    <span className={`inline-flex items-center rounded-full border px-2.5 py-1 text-xs font-medium ${className}`}>
      {status}
    </span>
  );
}

function BadgePill({ label }: { label: string }) {
  return (
    <span className="inline-flex items-center rounded-full border border-slate-200 bg-slate-50 px-2.5 py-1 text-xs font-medium text-slate-600">
      {label}
    </span>
  );
}

function QuickCounter({
  icon,
  label,
}: {
  icon: React.ReactNode;
  label: string;
}) {
  return (
    <div className="flex h-10 items-center gap-2 rounded-xl border border-slate-200 bg-slate-50 px-3 text-sm text-slate-700">
      {icon}
      {label}
    </div>
  );
}