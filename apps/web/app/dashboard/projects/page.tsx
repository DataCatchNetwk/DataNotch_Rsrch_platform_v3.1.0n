"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { ArrowRight, CheckCircle2, Plus, RefreshCcw } from "lucide-react";

import {
  createAnalysisJob,
  createWorkspace,
  getMyWorkspaces,
  type Workspace,
} from "@/src/lib/api/workspaces";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";

function progressClass(value: number) {
  if (value <= 10) return "w-1/12";
  if (value <= 20) return "w-1/6";
  if (value <= 30) return "w-1/4";
  if (value <= 40) return "w-1/3";
  if (value <= 50) return "w-5/12";
  if (value <= 60) return "w-1/2";
  if (value <= 70) return "w-7/12";
  if (value <= 80) return "w-2/3";
  if (value <= 90) return "w-3/4";
  if (value < 100) return "w-5/6";
  return "w-full";
}

function projectProgress(workspace: Workspace) {
  const jobs = workspace._count?.analysisJobs ?? 0;
  const reports = workspace._count?.reports ?? 0;
  const datasets = workspace._count?.datasets ?? 0;
  const base = Math.min(100, jobs * 8 + reports * 6 + datasets * 5);
  return workspace.status === "ARCHIVED" ? 100 : Math.max(12, base);
}

export default function ProjectsPage() {
  const [items, setItems] = useState<Workspace[]>([]);
  const [selectedId, setSelectedId] = useState("");
  const [title, setTitle] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function load() {
    setError(null);
    try {
      const data = await getMyWorkspaces();
      setItems(data);
      if (!selectedId && data.length) {
        setSelectedId(data[0].id);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load projects");
    }
  }

  useEffect(() => {
    void load();
  }, []);

  const selected = useMemo(() => {
    if (!items.length) return null;
    return items.find((item) => item.id === selectedId) ?? items[0];
  }, [items, selectedId]);

  const selectedProgress = selected ? projectProgress(selected) : 0;

  async function createProject() {
    setBusy(true);
    setError(null);
    try {
      const created = await createWorkspace({
        name: title || "New Research Project",
        description: "Objective-driven research project container with milestones and deliverables.",
      });
      setItems((prev) => [created, ...prev]);
      setSelectedId(created.id);
      setTitle("");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to create project");
    } finally {
      setBusy(false);
    }
  }

  async function launchAnalysis() {
    if (!selected) return;
    setBusy(true);
    setError(null);
    try {
      await createAnalysisJob(selected.id, {
        name: `${selected.name} - Baseline Analysis`,
        description: "Operational launch from Projects page",
        jobType: "descriptive",
        autoPipeline: true,
      });
      await load();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to launch analysis");
    } finally {
      setBusy(false);
    }
  }

  return (
    <main className="min-h-screen bg-slate-50 p-8">
      <div className="mx-auto max-w-7xl space-y-6">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <p className="text-sm uppercase tracking-widest text-slate-500">Workspace Operations</p>
            <h1 className="text-4xl font-bold text-slate-900">Projects</h1>
            <p className="text-slate-600">Turn research goals into milestones, deliverables, linked datasets, and executable analysis.</p>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" onClick={() => void load()}>
              <RefreshCcw className="mr-2 h-4 w-4" />
              Refresh
            </Button>
            <Button onClick={() => void createProject()} disabled={busy}>
              <Plus className="mr-2 h-4 w-4" />
              Create Project
            </Button>
          </div>
        </div>

        {error ? <div className="rounded-xl border border-rose-200 bg-rose-50 p-3 text-sm text-rose-700">{error}</div> : null}

        <Card className="rounded-2xl border-slate-200 bg-white shadow-sm">
          <CardContent className="flex flex-wrap gap-3 p-4">
            <Input
              value={title}
              onChange={(event) => setTitle(event.target.value)}
              placeholder="New project title..."
              className="h-11 max-w-2xl"
            />
            <Button onClick={() => void createProject()} disabled={busy}>Create</Button>
          </CardContent>
        </Card>

        <div className="grid gap-6 lg:grid-cols-[1fr_24rem]">
          <section className="space-y-4">
            {items.map((item) => {
              const progress = projectProgress(item);
              return (
                <button
                  key={item.id}
                  onClick={() => setSelectedId(item.id)}
                  className={`w-full rounded-2xl border bg-white p-5 text-left shadow-sm ${selected?.id === item.id ? "ring-2 ring-indigo-400" : ""}`}
                >
                  <div className="flex items-center justify-between gap-3">
                    <h2 className="text-xl font-semibold text-slate-900">{item.name}</h2>
                    <span className="text-sm font-medium text-slate-700">{progress}%</span>
                  </div>
                  <p className="mt-2 text-sm text-slate-600">{item.description || "No objective provided."}</p>
                  <div className="mt-4 h-2 rounded-full bg-slate-100">
                    <div className={`h-2 rounded-full bg-indigo-600 ${progressClass(progress)}`} />
                  </div>
                  <div className="mt-3 flex flex-wrap gap-4 text-xs text-slate-500">
                    <span>Datasets: {item._count?.datasets ?? 0}</span>
                    <span>Analysis Jobs: {item._count?.analysisJobs ?? 0}</span>
                    <span>Reports: {item._count?.reports ?? 0}</span>
                    <span>Owner: {item.owner.name || item.owner.email}</span>
                  </div>
                </button>
              );
            })}
          </section>

          <aside className="space-y-4">
            <Card className="rounded-2xl border-slate-200 bg-white shadow-sm">
              <CardContent className="space-y-3 p-5">
                <h3 className="text-lg font-semibold text-slate-900">Milestones</h3>
                {selected ? (
                  <>
                    <MilestoneRow label="Protocol approved" done={Boolean(selected._count?.datasets)} />
                    <MilestoneRow label="Dataset selected" done={(selected._count?.datasets ?? 0) > 0} />
                    <MilestoneRow label="Analysis launched" done={(selected._count?.analysisJobs ?? 0) > 0} />
                    <MilestoneRow label="Report drafted" done={(selected._count?.reports ?? 0) > 0} />
                  </>
                ) : (
                  <p className="text-sm text-slate-500">Select a project to view milestones.</p>
                )}
              </CardContent>
            </Card>

            <Card className="rounded-2xl border-slate-200 bg-white shadow-sm">
              <CardContent className="space-y-2 p-5">
                <h3 className="text-lg font-semibold text-slate-900">Project Handoff</h3>
                <ActionLink href={`/dashboard/tasks${selected ? `?workspaceId=${encodeURIComponent(selected.id)}` : ""}`} label="Create Dataset Task" />
                <ActionLink href={`/dashboard/data-preparation/profiling${selected ? `?workspaceId=${encodeURIComponent(selected.id)}` : ""}`} label="Send to Data Preparation" />
                <Button className="w-full justify-between" variant="outline" onClick={() => void launchAnalysis()} disabled={!selected || busy}>
                  <span>Launch Analysis Job</span>
                  <ArrowRight className="h-4 w-4" />
                </Button>
                <ActionLink href={`/dashboard/reports${selected ? `?workspaceId=${encodeURIComponent(selected.id)}` : ""}`} label="Create Publication Draft" />
                {selected ? (
                  <Button asChild className="w-full justify-between">
                    <Link href={`/dashboard/workspaces/${selected.id}`}>
                      Open Workspace
                      <ArrowRight className="h-4 w-4" />
                    </Link>
                  </Button>
                ) : null}
              </CardContent>
            </Card>

            <Card className="rounded-2xl border-slate-200 bg-white shadow-sm">
              <CardContent className="p-5">
                <p className="text-sm text-slate-500">Selected Progress</p>
                <p className="text-3xl font-bold text-slate-900">{selectedProgress}%</p>
              </CardContent>
            </Card>
          </aside>
        </div>
      </div>
    </main>
  );
}

function MilestoneRow({ label, done }: { label: string; done: boolean }) {
  return (
    <div className="flex items-center gap-2 rounded-xl border border-slate-200 p-3 text-sm text-slate-700">
      <CheckCircle2 className={`h-4 w-4 ${done ? "text-emerald-600" : "text-slate-300"}`} />
      <span>{label}</span>
    </div>
  );
}

function ActionLink({ href, label }: { href: string; label: string }) {
  return (
    <Button asChild className="w-full justify-between" variant="outline">
      <Link href={href}>
        {label}
        <ArrowRight className="h-4 w-4" />
      </Link>
    </Button>
  );
}
