"use client";

import * as React from "react";
import {
  AlertTriangle,
  BarChart3,
  CheckCircle2,
  ChevronDown,
  Clock3,
  Download,
  Eye,
  FileDown,
  FlaskConical,
  Loader2,
  MoreHorizontal,
  Plus,
  RefreshCw,
  RotateCcw,
  Search,
  SlidersHorizontal,
  Square,
  Upload,
  Workflow,
  XCircle,
} from "lucide-react";

import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Input } from "@/components/ui/input";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { cn } from "@/lib/utils";

type JobStatus = "QUEUED" | "RUNNING" | "SUCCEEDED" | "FAILED" | "CANCELLED";

type AnalysisJob = {
  id: string;
  name: string;
  dataset: string;
  workspace: string;
  analysisType: string;
  status: JobStatus;
  submittedAt: string;
  updatedAt: string;
  runtimeMinutes: number | null;
  owner: string;
  hasArtifacts: boolean;
  pipeline?: string;
  params?: Record<string, string | number | boolean>;
  logs?: string[];
};

const MOCK_JOBS: AnalysisJob[] = [
  {
    id: "job_1001",
    name: "Glucose Trend Forecast v2",
    dataset: "t2dm_wearables_q1.csv",
    workspace: "Diabetes Study",
    analysisType: "Time Series",
    status: "RUNNING",
    submittedAt: "2026-03-30T08:30:00Z",
    updatedAt: "2026-03-30T09:05:00Z",
    runtimeMinutes: 35,
    owner: "You",
    hasArtifacts: false,
    pipeline: "forecast_pipeline_v2",
    params: { horizon_days: 14, normalize: true },
    logs: [
      "Container scheduled on worker-2",
      "Dataset validation passed",
      "Training fold 3/5 running",
    ],
  },
  {
    id: "job_1002",
    name: "A1C Risk Clustering",
    dataset: "clinical_panel_march.xlsx",
    workspace: "Metabolic Risk",
    analysisType: "Clustering",
    status: "SUCCEEDED",
    submittedAt: "2026-03-29T13:10:00Z",
    updatedAt: "2026-03-29T13:44:00Z",
    runtimeMinutes: 34,
    owner: "You",
    hasArtifacts: true,
    pipeline: "cluster_default",
    params: { clusters: 5, scaling: "standard", outlier_trim: false },
    logs: [
      "Validation passed",
      "Feature scaling complete",
      "Artifacts packaged successfully",
    ],
  },
  {
    id: "job_1003",
    name: "CGM Event Detection",
    dataset: "cgm_events_april.csv",
    workspace: "Continuous Monitoring",
    analysisType: "Classification",
    status: "FAILED",
    submittedAt: "2026-03-28T17:00:00Z",
    updatedAt: "2026-03-28T17:18:00Z",
    runtimeMinutes: 18,
    owner: "You",
    hasArtifacts: false,
    pipeline: "event_classifier_v1",
    params: { threshold: 0.68, calibration: true },
    logs: [
      "Validation passed",
      "GPU worker timeout during epoch 4",
      "Job exited with code 137",
    ],
  },
  {
    id: "job_1004",
    name: "Baseline Descriptive Summary",
    dataset: "baseline_demographics.csv",
    workspace: "Pilot Cohort",
    analysisType: "Summary Report",
    status: "QUEUED",
    submittedAt: "2026-03-30T09:10:00Z",
    updatedAt: "2026-03-30T09:10:00Z",
    runtimeMinutes: null,
    owner: "You",
    hasArtifacts: false,
    pipeline: "summary_pipeline",
    params: { include_missingness: true, charts: true },
    logs: ["Job received and queued"],
  },
  {
    id: "job_1005",
    name: "Medication Adherence Segmentation",
    dataset: "med_adherence_clean.parquet",
    workspace: "Adherence Lab",
    analysisType: "Segmentation",
    status: "CANCELLED",
    submittedAt: "2026-03-27T11:15:00Z",
    updatedAt: "2026-03-27T11:32:00Z",
    runtimeMinutes: 17,
    owner: "You",
    hasArtifacts: false,
    pipeline: "segmentation_v3",
    params: { min_cluster_size: 20, reduce_dims: true },
    logs: [
      "Queue assigned",
      "Preprocessing started",
      "Job cancelled by user",
    ],
  },
];

const STATUS_OPTIONS: Array<"ALL" | JobStatus> = ["ALL", "QUEUED", "RUNNING", "SUCCEEDED", "FAILED", "CANCELLED"];
const SORT_OPTIONS = ["Newest", "Oldest", "Runtime", "Status", "Last Updated"] as const;
type SortOption = (typeof SORT_OPTIONS)[number];

function formatDate(value: string) {
  return new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit",
  }).format(new Date(value));
}

function formatRuntime(value: number | null) {
  if (value == null) return "—";
  if (value < 60) return `${value} min`;
  const hours = Math.floor(value / 60);
  const mins = value % 60;
  return `${hours}h ${mins}m`;
}

function statusMeta(status: JobStatus) {
  switch (status) {
    case "QUEUED":
      return { icon: Clock3, label: "Queued", badgeClass: "bg-slate-100 text-slate-700 border-slate-200" };
    case "RUNNING":
      return { icon: Loader2, label: "Running", badgeClass: "bg-blue-50 text-blue-700 border-blue-200" };
    case "SUCCEEDED":
      return { icon: CheckCircle2, label: "Succeeded", badgeClass: "bg-emerald-50 text-emerald-700 border-emerald-200" };
    case "FAILED":
      return { icon: AlertTriangle, label: "Failed", badgeClass: "bg-red-50 text-red-700 border-red-200" };
    case "CANCELLED":
      return { icon: XCircle, label: "Cancelled", badgeClass: "bg-amber-50 text-amber-700 border-amber-200" };
  }
}

function computeStats(items: AnalysisJob[]) {
  const total = items.length;
  const queued = items.filter((i) => i.status === "QUEUED").length;
  const running = items.filter((i) => i.status === "RUNNING").length;
  const succeeded = items.filter((i) => i.status === "SUCCEEDED").length;
  const failed = items.filter((i) => i.status === "FAILED").length;
  const runtimes = items.map((i) => i.runtimeMinutes).filter((v): v is number => typeof v === "number");
  const avgRuntime = runtimes.length ? Math.round(runtimes.reduce((a, b) => a + b, 0) / runtimes.length) : 0;
  return { total, queued, running, succeeded, failed, avgRuntime };
}

function getUniqueValues(items: AnalysisJob[], key: "workspace" | "dataset") {
  return Array.from(new Set(items.map((item) => item[key]))).sort((a, b) => a.localeCompare(b));
}

function matchSearch(job: AnalysisJob, query: string) {
  if (!query.trim()) return true;
  const normalized = query.toLowerCase();
  return [job.id, job.name, job.dataset, job.workspace, job.analysisType, job.pipeline ?? ""].some((field) =>
    field.toLowerCase().includes(normalized)
  );
}

export default function AnalysisJobsPage() {
  const [jobs, setJobs] = React.useState<AnalysisJob[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState<string | null>(null);

  const [search, setSearch] = React.useState("");
  const [status, setStatus] = React.useState<"ALL" | JobStatus>("ALL");
  const [workspace, setWorkspace] = React.useState("ALL");
  const [dataset, setDataset] = React.useState("ALL");
  const [sortBy, setSortBy] = React.useState<SortOption>("Newest");
  const [date, setDate] = React.useState<Date | undefined>(undefined);

  const [selectedIds, setSelectedIds] = React.useState<string[]>([]);
  const [detailsJob, setDetailsJob] = React.useState<AnalysisJob | null>(null);

  const loadJobs = React.useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      await new Promise((resolve) => setTimeout(resolve, 700));
      setJobs(MOCK_JOBS);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load jobs.");
    } finally {
      setLoading(false);
    }
  }, []);

  React.useEffect(() => {
    void loadJobs();
  }, [loadJobs]);

  const stats = React.useMemo(() => computeStats(jobs), [jobs]);
  const workspaces = React.useMemo(() => getUniqueValues(jobs, "workspace"), [jobs]);
  const datasets = React.useMemo(() => getUniqueValues(jobs, "dataset"), [jobs]);

  const filteredJobs = React.useMemo(() => {
    let next = jobs.filter((job) => matchSearch(job, search));
    if (status !== "ALL") next = next.filter((job) => job.status === status);
    if (workspace !== "ALL") next = next.filter((job) => job.workspace === workspace);
    if (dataset !== "ALL") next = next.filter((job) => job.dataset === dataset);
    if (date) {
      next = next.filter((job) => {
        const d = new Date(job.submittedAt);
        return d.getFullYear() === date.getFullYear() && d.getMonth() === date.getMonth() && d.getDate() === date.getDate();
      });
    }

    next.sort((a, b) => {
      switch (sortBy) {
        case "Newest":
          return +new Date(b.submittedAt) - +new Date(a.submittedAt);
        case "Oldest":
          return +new Date(a.submittedAt) - +new Date(b.submittedAt);
        case "Runtime":
          return (b.runtimeMinutes ?? -1) - (a.runtimeMinutes ?? -1);
        case "Status":
          return a.status.localeCompare(b.status);
        case "Last Updated":
          return +new Date(b.updatedAt) - +new Date(a.updatedAt);
      }
    });

    return next;
  }, [jobs, search, status, workspace, dataset, sortBy, date]);

  const selectedJobs = jobs.filter((job) => selectedIds.includes(job.id));
  const allVisibleSelected = filteredJobs.length > 0 && filteredJobs.every((job) => selectedIds.includes(job.id));
  const anyCancelable = selectedJobs.some((job) => job.status === "QUEUED" || job.status === "RUNNING");
  const anyRetryable = selectedJobs.some((job) => job.status === "FAILED" || job.status === "CANCELLED");

  const statCards = [
    { key: "ALL" as const, title: "Total Jobs", value: stats.total, helper: "All tracked jobs", icon: FlaskConical },
    { key: "QUEUED" as const, title: "Queued", value: stats.queued, helper: "Waiting in queue", icon: Clock3 },
    { key: "RUNNING" as const, title: "Running", value: stats.running, helper: "Active now", icon: Loader2 },
    { key: "SUCCEEDED" as const, title: "Succeeded", value: stats.succeeded, helper: "Ready for review", icon: CheckCircle2 },
    { key: "FAILED" as const, title: "Failed", value: stats.failed, helper: "Needs attention", icon: AlertTriangle },
    { key: "AVG" as const, title: "Avg Runtime", value: `${stats.avgRuntime} min`, helper: "Across completed jobs", icon: BarChart3 },
  ];

  const clearFilters = () => {
    setSearch("");
    setStatus("ALL");
    setWorkspace("ALL");
    setDataset("ALL");
    setSortBy("Newest");
    setDate(undefined);
  };

  const toggleSelectAllVisible = (checked: boolean) => {
    if (checked) {
      setSelectedIds(Array.from(new Set([...selectedIds, ...filteredJobs.map((j) => j.id)])));
    } else {
      setSelectedIds(selectedIds.filter((id) => !filteredJobs.some((j) => j.id === id)));
    }
  };

  const toggleRow = (id: string, checked: boolean) => {
    setSelectedIds((prev) => (checked ? Array.from(new Set([...prev, id])) : prev.filter((item) => item !== id)));
  };

  return (
    <TooltipProvider>
      <div className="min-h-screen bg-slate-50/60">
        <div className="border-b bg-white">
          <div className="mx-auto max-w-[1400px] px-6 py-8">
            <div className="flex flex-col gap-6 lg:flex-row lg:items-start lg:justify-between">
              <div>
                <p className="text-sm font-medium text-slate-500">Research Platform</p>
                <h1 className="mt-2 text-3xl font-semibold tracking-tight text-slate-950">Analysis Jobs</h1>
                <p className="mt-2 text-sm text-slate-600">Track queued, running, and completed analysis tasks.</p>
              </div>
              <div className="flex flex-wrap gap-2">
                <Button><Plus className="mr-2 h-4 w-4" />New Analysis</Button>
                <Button variant="secondary"><Workflow className="mr-2 h-4 w-4" />Run Pipeline</Button>
                <Button variant="outline"><Upload className="mr-2 h-4 w-4" />Upload Dataset</Button>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button variant="ghost" size="icon" onClick={() => void loadJobs()}>
                      <RefreshCw className={cn("h-4 w-4", loading && "animate-spin")} />
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent>Refresh jobs</TooltipContent>
                </Tooltip>
              </div>
            </div>
          </div>
        </div>

        <main className="mx-auto max-w-[1400px] px-6 py-6">
          <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-6">
            {statCards.map((item) => {
              const Icon = item.icon;
              const active = item.key !== "AVG" && status === item.key;
              return (
                <button
                  key={item.title}
                  type="button"
                  onClick={() => item.key !== "AVG" && setStatus(item.key)}
                  className={cn("rounded-2xl border bg-white p-4 text-left shadow-sm transition hover:shadow-md", active && "border-violet-300 ring-2 ring-violet-100")}
                >
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <p className="text-sm font-medium text-slate-500">{item.title}</p>
                      <p className="mt-3 text-3xl font-semibold text-slate-950">{item.value}</p>
                      <p className="mt-2 text-xs text-slate-500">{item.helper}</p>
                    </div>
                    <div className={cn("rounded-xl border p-2", active ? "border-violet-200 bg-violet-50 text-violet-700" : "border-slate-200 bg-slate-50 text-slate-600")}>
                      <Icon className={cn("h-4 w-4", item.key === "RUNNING" && active && "animate-spin")} />
                    </div>
                  </div>
                </button>
              );
            })}
          </section>

          <Card className="mt-6 rounded-2xl border-0 shadow-sm">
            <CardHeader className="pb-3">
              <CardTitle className="text-lg">Filters</CardTitle>
              <CardDescription>Search and narrow jobs by status, workspace, dataset, and submission date.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid gap-3 lg:grid-cols-[1.4fr_220px_220px_240px_220px_180px]">
                <div className="relative">
                  <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                  <Input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search jobs" className="pl-9" />
                </div>

                <Select value={status} onValueChange={(value) => setStatus(value as "ALL" | JobStatus)}>
                  <SelectTrigger><SelectValue placeholder="Status" /></SelectTrigger>
                  <SelectContent>{STATUS_OPTIONS.map((option) => <SelectItem key={option} value={option}>{option}</SelectItem>)}</SelectContent>
                </Select>

                <Select value={workspace} onValueChange={setWorkspace}>
                  <SelectTrigger><SelectValue placeholder="Workspace" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="ALL">All Workspaces</SelectItem>
                    {workspaces.map((item) => <SelectItem key={item} value={item}>{item}</SelectItem>)}
                  </SelectContent>
                </Select>

                <Select value={dataset} onValueChange={setDataset}>
                  <SelectTrigger><SelectValue placeholder="Dataset" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="ALL">All Datasets</SelectItem>
                    {datasets.map((item) => <SelectItem key={item} value={item}>{item}</SelectItem>)}
                  </SelectContent>
                </Select>

                <Popover>
                  <PopoverTrigger asChild>
                    <Button variant="outline" className="justify-between">{date ? date.toLocaleDateString() : "Pick date"}<ChevronDown className="ml-2 h-4 w-4 text-slate-400" /></Button>
                  </PopoverTrigger>
                  <PopoverContent align="start" className="w-auto p-0">
                    <Calendar mode="single" selected={date} onSelect={setDate} initialFocus />
                  </PopoverContent>
                </Popover>

                <Select value={sortBy} onValueChange={(value) => setSortBy(value as SortOption)}>
                  <SelectTrigger><SelectValue placeholder="Sort By" /></SelectTrigger>
                  <SelectContent>{SORT_OPTIONS.map((option) => <SelectItem key={option} value={option}>{option}</SelectItem>)}</SelectContent>
                </Select>
              </div>

              <div className="flex flex-wrap gap-2">
                <Button variant="ghost" onClick={clearFilters}>Clear Filters</Button>
                <Button variant="outline"><SlidersHorizontal className="mr-2 h-4 w-4" />Advanced Filters</Button>
                <Button variant="outline"><FileDown className="mr-2 h-4 w-4" />Export Metadata</Button>
              </div>
            </CardContent>
          </Card>

          {selectedIds.length > 0 && (
            <Card className="mt-6 rounded-2xl border-violet-200 bg-violet-50/70 shadow-sm">
              <CardContent className="flex flex-col gap-3 p-4 md:flex-row md:items-center md:justify-between">
                <div>
                  <p className="font-medium text-slate-900">{selectedIds.length} job{selectedIds.length > 1 ? "s" : ""} selected</p>
                  <p className="text-sm text-slate-600">Run bulk actions for the currently selected items.</p>
                </div>
                <div className="flex flex-wrap gap-2">
                  <Button variant="outline" disabled={!anyRetryable}><RotateCcw className="mr-2 h-4 w-4" />Retry Selected</Button>
                  <Button variant="outline"><Download className="mr-2 h-4 w-4" />Download Selected</Button>
                  <Button variant="outline">Archive Selected</Button>
                  <Button variant="destructive" disabled={!anyCancelable}><Square className="mr-2 h-4 w-4" />Cancel Selected</Button>
                  <Button variant="ghost" onClick={() => setSelectedIds([])}>Clear Selection</Button>
                </div>
              </CardContent>
            </Card>
          )}

          <Card className="mt-6 rounded-2xl border-0 shadow-sm">
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between gap-4">
                <div>
                  <CardTitle className="text-lg">Jobs</CardTitle>
                  <CardDescription>Review current activity, open results, and manage retries.</CardDescription>
                </div>
                <Badge variant="secondary" className="rounded-full px-3 py-1">{filteredJobs.length} visible</Badge>
              </div>
            </CardHeader>
            <CardContent>
              {loading ? (
                <div className="space-y-3">
                  {Array.from({ length: 6 }).map((_, idx) => (
                    <div key={idx} className="grid grid-cols-10 gap-3">
                      {Array.from({ length: 10 }).map((__, inner) => <Skeleton key={inner} className="h-10 rounded-xl" />)}
                    </div>
                  ))}
                </div>
              ) : error ? (
                <Alert className="rounded-2xl border-red-200 bg-red-50">
                  <AlertTriangle className="h-4 w-4" />
                  <AlertTitle>Unable to load analysis jobs</AlertTitle>
                  <AlertDescription className="mt-2 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                    <span>We couldn't retrieve your jobs right now. Please refresh or try again in a moment.</span>
                    <div className="flex gap-2">
                      <Button size="sm" variant="outline" onClick={() => void loadJobs()}>Retry</Button>
                      <Button size="sm" variant="ghost" onClick={() => window.location.reload()}>Refresh Page</Button>
                    </div>
                  </AlertDescription>
                </Alert>
              ) : filteredJobs.length === 0 ? (
                <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-slate-200 bg-slate-50/80 px-6 py-14 text-center">
                  <div className="rounded-2xl bg-violet-50 p-4 text-violet-600"><FlaskConical className="h-8 w-8" /></div>
                  <h3 className="mt-4 text-xl font-semibold text-slate-950">No analysis jobs yet</h3>
                  <p className="mt-2 max-w-xl text-sm text-slate-600">Start your first analysis by uploading a dataset or launching a pipeline.</p>
                  <div className="mt-6 flex flex-wrap justify-center gap-2">
                    <Button><Plus className="mr-2 h-4 w-4" />Start First Analysis</Button>
                    <Button variant="outline"><Upload className="mr-2 h-4 w-4" />Upload Dataset</Button>
                    <Button variant="ghost">Browse Templates</Button>
                  </div>
                </div>
              ) : (
                <div className="overflow-x-auto rounded-2xl border">
                  <Table>
                    <TableHeader>
                      <TableRow className="bg-slate-50/80 hover:bg-slate-50/80">
                        <TableHead className="w-12">
                          <Checkbox checked={allVisibleSelected} onCheckedChange={(checked) => toggleSelectAllVisible(Boolean(checked))} aria-label="Select all visible jobs" />
                        </TableHead>
                        <TableHead>Job Name</TableHead>
                        <TableHead>Dataset</TableHead>
                        <TableHead>Workspace</TableHead>
                        <TableHead>Type</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead>Submitted</TableHead>
                        <TableHead>Runtime</TableHead>
                        <TableHead>Owner</TableHead>
                        <TableHead className="w-16 text-right">Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {filteredJobs.map((job) => {
                        const meta = statusMeta(job.status);
                        const Icon = meta.icon;
                        const isSelected = selectedIds.includes(job.id);
                        const canCancel = job.status === "QUEUED" || job.status === "RUNNING";
                        const canRetry = job.status === "FAILED" || job.status === "CANCELLED";
                        const canOpenResults = job.status === "SUCCEEDED";
                        const canDownloadOutput = job.hasArtifacts;

                        return (
                          <TableRow key={job.id} className={cn(isSelected && "bg-violet-50/40")}>
                            <TableCell><Checkbox checked={isSelected} onCheckedChange={(checked) => toggleRow(job.id, Boolean(checked))} aria-label={`Select ${job.name}`} /></TableCell>
                            <TableCell><div><p className="font-medium text-slate-900">{job.name}</p><p className="text-xs text-slate-500">{job.id}</p></div></TableCell>
                            <TableCell>{job.dataset}</TableCell>
                            <TableCell>{job.workspace}</TableCell>
                            <TableCell>{job.analysisType}</TableCell>
                            <TableCell>
                              <Badge className={cn("gap-1 rounded-full border font-medium", meta.badgeClass)}>
                                <Icon className={cn("h-3.5 w-3.5", job.status === "RUNNING" && "animate-spin")} />
                                {meta.label}
                              </Badge>
                            </TableCell>
                            <TableCell>{formatDate(job.submittedAt)}</TableCell>
                            <TableCell>{formatRuntime(job.runtimeMinutes)}</TableCell>
                            <TableCell>{job.owner}</TableCell>
                            <TableCell className="text-right">
                              <DropdownMenu>
                                <DropdownMenuTrigger asChild><Button variant="ghost" size="icon"><MoreHorizontal className="h-4 w-4" /></Button></DropdownMenuTrigger>
                                <DropdownMenuContent align="end" className="w-52">
                                  <DropdownMenuItem onClick={() => setDetailsJob(job)}><Eye className="mr-2 h-4 w-4" />View Details</DropdownMenuItem>
                                  <DropdownMenuItem disabled={!canOpenResults}><BarChart3 className="mr-2 h-4 w-4" />Open Results</DropdownMenuItem>
                                  <DropdownMenuItem disabled={!canDownloadOutput}><Download className="mr-2 h-4 w-4" />Download Output</DropdownMenuItem>
                                  <DropdownMenuItem disabled={job.status === "QUEUED"}><FileDown className="mr-2 h-4 w-4" />Download Logs</DropdownMenuItem>
                                  <DropdownMenuSeparator />
                                  <DropdownMenuItem disabled={!canRetry}><RotateCcw className="mr-2 h-4 w-4" />Retry Job</DropdownMenuItem>
                                  <DropdownMenuItem><Plus className="mr-2 h-4 w-4" />Duplicate Job</DropdownMenuItem>
                                  <DropdownMenuItem disabled={!canCancel}><Square className="mr-2 h-4 w-4" />Cancel Job</DropdownMenuItem>
                                </DropdownMenuContent>
                              </DropdownMenu>
                            </TableCell>
                          </TableRow>
                        );
                      })}
                    </TableBody>
                  </Table>
                </div>
              )}
            </CardContent>
          </Card>
        </main>

        <Sheet open={Boolean(detailsJob)} onOpenChange={(open) => !open && setDetailsJob(null)}>
          <SheetContent className="w-full overflow-y-auto sm:max-w-2xl">
            {detailsJob && (
              <>
                <SheetHeader>
                  <SheetTitle>{detailsJob.name}</SheetTitle>
                  <SheetDescription>{detailsJob.id} | {detailsJob.analysisType} | {detailsJob.workspace}</SheetDescription>
                </SheetHeader>

                <div className="mt-6">
                  <div className="flex flex-wrap items-center gap-2">
                    <Badge className={cn("gap-1 rounded-full border", statusMeta(detailsJob.status).badgeClass)}>
                      {React.createElement(statusMeta(detailsJob.status).icon, { className: cn("h-3.5 w-3.5", detailsJob.status === "RUNNING" && "animate-spin") })}
                      {statusMeta(detailsJob.status).label}
                    </Badge>
                    <Badge variant="secondary" className="rounded-full">{detailsJob.dataset}</Badge>
                    <Badge variant="secondary" className="rounded-full">{detailsJob.pipeline ?? "No pipeline"}</Badge>
                  </div>

                  <Tabs defaultValue="overview" className="mt-6">
                    <TabsList className="grid w-full grid-cols-4 lg:grid-cols-7">
                      <TabsTrigger value="overview">Overview</TabsTrigger>
                      <TabsTrigger value="parameters">Parameters</TabsTrigger>
                      <TabsTrigger value="inputs">Input Files</TabsTrigger>
                      <TabsTrigger value="logs">Logs</TabsTrigger>
                      <TabsTrigger value="results">Results</TabsTrigger>
                      <TabsTrigger value="artifacts">Artifacts</TabsTrigger>
                      <TabsTrigger value="timeline">Timeline</TabsTrigger>
                    </TabsList>

                    <TabsContent value="overview" className="mt-4">
                      <DetailGrid items={[
                        ["Submitted", formatDate(detailsJob.submittedAt)],
                        ["Last Updated", formatDate(detailsJob.updatedAt)],
                        ["Runtime", formatRuntime(detailsJob.runtimeMinutes)],
                        ["Owner", detailsJob.owner],
                        ["Dataset", detailsJob.dataset],
                        ["Workspace", detailsJob.workspace],
                      ]} />
                    </TabsContent>

                    <TabsContent value="parameters" className="mt-4">
                      <Card><CardContent className="pt-6">{detailsJob.params ? (
                        <div className="space-y-3">
                          {Object.entries(detailsJob.params).map(([key, value]) => (
                            <div key={key} className="flex items-center justify-between rounded-xl border px-3 py-2">
                              <span className="text-sm font-medium text-slate-700">{key}</span>
                              <span className="text-sm text-slate-600">{String(value)}</span>
                            </div>
                          ))}
                        </div>
                      ) : <p className="text-sm text-slate-500">No parameters recorded.</p>}</CardContent></Card>
                    </TabsContent>

                    <TabsContent value="inputs" className="mt-4">
                      <Card><CardContent className="pt-6"><p className="text-sm text-slate-700">{detailsJob.dataset}</p><p className="mt-2 text-sm text-slate-500">Attached to workspace {detailsJob.workspace}.</p></CardContent></Card>
                    </TabsContent>

                    <TabsContent value="logs" className="mt-4">
                      <Card><CardContent className="pt-6"><div className="space-y-2">{(detailsJob.logs ?? ["No logs available"]).map((line, idx) => (
                        <div key={`${detailsJob.id}-log-${idx}`} className="rounded-xl border bg-slate-50 px-3 py-2 font-mono text-xs text-slate-700">{line}</div>
                      ))}</div></CardContent></Card>
                    </TabsContent>

                    <TabsContent value="results" className="mt-4">
                      <Card><CardContent className="pt-6"><p className="text-sm text-slate-700">{detailsJob.status === "SUCCEEDED" ? "Results are ready. Open the results view or download the packaged output." : "Results will appear once the job completes successfully."}</p></CardContent></Card>
                    </TabsContent>

                    <TabsContent value="artifacts" className="mt-4">
                      <Card><CardContent className="pt-6"><p className="text-sm text-slate-700">{detailsJob.hasArtifacts ? "Artifacts have been packaged and are ready for download." : "No packaged artifacts available yet."}</p></CardContent></Card>
                    </TabsContent>

                    <TabsContent value="timeline" className="mt-4">
                      <Card><CardContent className="pt-6"><div className="space-y-4">
                        <TimelineItem label="Submitted" value={formatDate(detailsJob.submittedAt)} />
                        <TimelineItem label="Updated" value={formatDate(detailsJob.updatedAt)} />
                        <TimelineItem label="Current Status" value={statusMeta(detailsJob.status).label} />
                      </div></CardContent></Card>
                    </TabsContent>
                  </Tabs>

                  <Separator className="my-6" />

                  <div className="flex flex-wrap gap-2">
                    <Button disabled={!(detailsJob.status === "FAILED" || detailsJob.status === "CANCELLED")}><RotateCcw className="mr-2 h-4 w-4" />Retry Job</Button>
                    <Button variant="destructive" disabled={!(detailsJob.status === "QUEUED" || detailsJob.status === "RUNNING")}><Square className="mr-2 h-4 w-4" />Cancel Job</Button>
                    <Button variant="outline" disabled={detailsJob.status !== "SUCCEEDED"}><BarChart3 className="mr-2 h-4 w-4" />Open Results</Button>
                    <Button variant="outline" disabled={!detailsJob.hasArtifacts}><Download className="mr-2 h-4 w-4" />Download Report</Button>
                    <Button variant="ghost" onClick={() => setDetailsJob(null)}>Close</Button>
                  </div>
                </div>
              </>
            )}
          </SheetContent>
        </Sheet>
      </div>
    </TooltipProvider>
  );
}

function DetailGrid({ items }: { items: Array<[string, string]> }) {
  return (
    <div className="grid gap-3 sm:grid-cols-2">
      {items.map(([label, value]) => (
        <div key={label} className="rounded-2xl border bg-white p-4">
          <p className="text-xs font-medium uppercase tracking-wide text-slate-500">{label}</p>
          <p className="mt-2 text-sm font-medium text-slate-900">{value}</p>
        </div>
      ))}
    </div>
  );
}

function TimelineItem({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex gap-3">
      <div className="mt-1 h-2.5 w-2.5 rounded-full bg-violet-500" />
      <div>
        <p className="text-sm font-medium text-slate-900">{label}</p>
        <p className="text-sm text-slate-600">{value}</p>
      </div>
    </div>
  );
}
