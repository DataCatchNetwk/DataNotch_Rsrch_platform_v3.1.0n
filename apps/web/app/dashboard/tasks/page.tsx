"use client";

import { useEffect, useMemo, useState } from "react";
import { useSearchParams } from "next/navigation";
import { Plus, RefreshCcw } from "lucide-react";

import {
  createAnalysisJob,
  getMyWorkspaces,
  type Workspace,
} from "@/src/lib/api/workspaces";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";

const fallbackWorkspace: Workspace = {
  id: "workspace-fallback",
  name: "Research Operations Workspace",
  description: "Fallback workspace for task board continuity.",
  status: "ACTIVE",
  owner: { id: "local-owner", email: "local@workspace", name: "Operations Owner" },
  members: [],
  datasets: [],
  analysisJobs: [],
  reports: [],
  _count: { datasets: 2, analysisJobs: 2, reports: 1, members: 3 },
  currentUserRole: "OWNER",
  createdAt: new Date().toISOString(),
  updatedAt: new Date().toISOString(),
};

type TaskStatus = "TO_DO" | "IN_PROGRESS" | "REVIEW" | "COMPLETED";

type TaskItem = {
  id: string;
  title: string;
  status: TaskStatus;
  owner: string;
  stage: string;
  priority: "Low" | "Medium" | "High";
  source: "analysis" | "report" | "manual";
};

const statusColumns: Array<{ id: TaskStatus; label: string }> = [
  { id: "TO_DO", label: "To Do" },
  { id: "IN_PROGRESS", label: "In Progress" },
  { id: "REVIEW", label: "Review" },
  { id: "COMPLETED", label: "Completed" },
];

function ownerFromWorkspace(workspace: Workspace) {
  return workspace.owner.name || workspace.owner.email;
}

export default function TasksPage() {
  const searchParams = useSearchParams();
  const [workspaces, setWorkspaces] = useState<Workspace[]>([]);
  const [selectedId, setSelectedId] = useState("");
  const [manualTasks, setManualTasks] = useState<TaskItem[]>([]);
  const [title, setTitle] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [statusOverride, setStatusOverride] = useState<Record<string, TaskStatus>>({});

  async function load() {
    setError(null);
    try {
      const list = await getMyWorkspaces();
      const safeList = list.length ? list : [fallbackWorkspace];
      setWorkspaces(safeList);
      const fromQuery = searchParams.get("workspaceId");
      const preferred = fromQuery && safeList.some((item) => item.id === fromQuery) ? fromQuery : safeList[0]?.id;
      if (preferred) {
        setSelectedId(preferred);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load tasks");
      setWorkspaces([fallbackWorkspace]);
      setSelectedId(fallbackWorkspace.id);
    }
  }

  useEffect(() => {
    void load();
  }, []);

  async function switchWorkspace(workspaceId: string) {
    setError(null);
    setSelectedId(workspaceId);
  }

  const selected = useMemo(() => {
    if (!workspaces.length) return null;
    return workspaces.find((item) => item.id === selectedId) ?? workspaces[0];
  }, [workspaces, selectedId]);

  const derivedTasks = useMemo<TaskItem[]>(() => {
    if (!selected) return [];

    const analysisCount = selected._count?.analysisJobs ?? 0;
    const reportCount = selected._count?.reports ?? 0;
    const datasetCount = selected._count?.datasets ?? 0;

    const analysisTasks = Array.from({ length: Math.min(analysisCount, 4) }).map((_, index) => ({
      id: `analysis-${selected.id}-${index}`,
      title: `Analysis work item ${index + 1}`,
      status: (index === 0 ? "IN_PROGRESS" : "TO_DO") as TaskStatus,
      owner: ownerFromWorkspace(selected),
      stage: "Analytics",
      priority: (index === 0 ? "High" : "Medium") as TaskItem["priority"],
      source: "analysis" as const,
    }));

    const reportTasks = Array.from({ length: Math.min(reportCount, 3) }).map((_, index) => ({
      id: `report-${selected.id}-${index}`,
      title: `Report deliverable ${index + 1}`,
      status: (index === 0 ? "REVIEW" : "TO_DO") as TaskStatus,
      owner: ownerFromWorkspace(selected),
      stage: "Outputs",
      priority: "Medium" as TaskItem["priority"],
      source: "report" as const,
    }));

    const dataTasks = Array.from({ length: Math.min(datasetCount, 2) }).map((_, index) => ({
      id: `dataset-${selected.id}-${index}`,
      title: `Dataset quality check ${index + 1}`,
      status: "TO_DO" as TaskStatus,
      owner: ownerFromWorkspace(selected),
      stage: "Data Preparation",
      priority: "High" as TaskItem["priority"],
      source: "manual" as const,
    }));

    return [...analysisTasks, ...reportTasks, ...dataTasks];
  }, [selected]);

  const tasks = useMemo(() => {
    const base = [...manualTasks, ...derivedTasks];
    return base.map((task) => ({
      ...task,
      status: statusOverride[task.id] ?? task.status,
    }));
  }, [derivedTasks, manualTasks, statusOverride]);

  async function createTask() {
    if (!selected) return;

    setBusy(true);
    setError(null);
    try {
      const taskTitle = title || "New operational task";
      await createAnalysisJob(selected.id, {
        name: taskTitle,
        description: "Task created from Operations Tasks board",
        jobType: "operations-task",
        autoPipeline: false,
      });
      setTitle("");
      await switchWorkspace(selected.id);
    } catch {
      const fallbackTask: TaskItem = {
        id: `manual-${Date.now()}`,
        title: title || "New operational task",
        status: "TO_DO",
        owner: selected.owner.name || selected.owner.email,
        stage: "Workspace",
        priority: "Medium",
        source: "manual",
      };
      setManualTasks((prev) => [fallbackTask, ...prev]);
      setTitle("");
    } finally {
      setBusy(false);
    }
  }

  function move(taskId: string, status: TaskStatus) {
    setStatusOverride((prev) => ({ ...prev, [taskId]: status }));
  }

  return (
    <main className="min-h-screen bg-slate-50 p-8">
      <div className="mx-auto max-w-7xl space-y-6">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <p className="text-sm uppercase tracking-widest text-slate-500">Workspace Operations</p>
            <h1 className="text-4xl font-bold text-slate-900">Tasks</h1>
            <p className="text-slate-600">Kanban execution tracking for data, research, analytics, outputs, governance, and system work.</p>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" onClick={() => void load()}>
              <RefreshCcw className="mr-2 h-4 w-4" />
              Refresh
            </Button>
            <Button onClick={() => void createTask()} disabled={!selected || busy}>
              <Plus className="mr-2 h-4 w-4" />
              Create Task
            </Button>
          </div>
        </div>

        {error ? <div className="rounded-xl border border-rose-200 bg-rose-50 p-3 text-sm text-rose-700">{error}</div> : null}

        <Card className="rounded-2xl border-slate-200 bg-white shadow-sm">
          <CardContent className="flex flex-wrap gap-3 p-4">
            <select
              title="Select workspace"
              value={selected?.id ?? ""}
              onChange={(event) => void switchWorkspace(event.target.value)}
              className="h-11 rounded-xl border border-slate-200 bg-white px-3 text-sm"
            >
              {workspaces.map((workspace) => (
                <option key={workspace.id} value={workspace.id}>
                  {workspace.name}
                </option>
              ))}
            </select>
            <Input
              value={title}
              onChange={(event) => setTitle(event.target.value)}
              placeholder="New task title..."
              className="h-11 max-w-2xl"
            />
            <Button onClick={() => void createTask()} disabled={!selected || busy}>Add</Button>
          </CardContent>
        </Card>

        <section className="grid gap-4 xl:grid-cols-4">
          {statusColumns.map((column) => (
            <Card key={column.id} className="rounded-2xl border-slate-200 bg-white shadow-sm">
              <CardContent className="min-h-128 p-4">
                <h2 className="mb-3 text-lg font-semibold text-slate-900">{column.label}</h2>
                <div className="space-y-3">
                  {tasks
                    .filter((task) => task.status === column.id)
                    .map((task) => (
                      <div key={task.id} className="rounded-xl border border-slate-200 bg-slate-50 p-3">
                        <p className="text-sm font-medium text-slate-900">{task.title}</p>
                        <p className="mt-1 text-xs text-slate-500">{task.stage} · {task.owner}</p>
                        <div className="mt-2 flex items-center justify-between">
                          <span className="rounded-full bg-indigo-100 px-2 py-1 text-xs font-medium text-indigo-700">{task.priority}</span>
                          <select
                            title="Move task status"
                            value={task.status}
                            onChange={(event) => move(task.id, event.target.value as TaskStatus)}
                            className="rounded-lg border border-slate-200 bg-white px-2 py-1 text-xs"
                          >
                            {statusColumns.map((statusItem) => (
                              <option key={statusItem.id} value={statusItem.id}>
                                {statusItem.label}
                              </option>
                            ))}
                          </select>
                        </div>
                      </div>
                    ))}
                  {!tasks.some((task) => task.status === column.id) ? (
                    <p className="text-xs text-slate-400">No tasks in this column.</p>
                  ) : null}
                </div>
              </CardContent>
            </Card>
          ))}
        </section>
      </div>
    </main>
  );
}
