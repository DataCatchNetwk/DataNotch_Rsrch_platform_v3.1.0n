"use client"

import Link from "next/link"
import { useCallback, useEffect, useMemo, useState } from "react"
import { useRouter } from "next/navigation"
import {
  AlertTriangle,
  BarChart3,
  BookCopy,
  CheckCircle2,
  Clock3,
  Download,
  Eye,
  FileDown,
  FileText,
  FileUp,
  FlaskConical,
  Loader2,
  MoreHorizontal,
  Plus,
  RefreshCw,
  RotateCcw,
  Search,
  Share2,
  SlidersHorizontal,
  Square,
  Trash2,
  Upload,
  Workflow,
  XCircle,
} from "lucide-react"

import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Checkbox } from "@/components/ui/checkbox"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Input } from "@/components/ui/input"
import { Progress } from "@/components/ui/progress"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Separator } from "@/components/ui/separator"
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetFooter,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet"
import { Skeleton } from "@/components/ui/skeleton"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import {
  ApiError,
  cancelAnalysisJob,
  cancelAnalysisJobsBulk,
  getAnalysisJob,
  getAnalysisJobDownloadUrl,
  getAnalysisJobLogsDownloadUrl,
  listAnalysisJobs,
  retryAnalysisJob,
  retryAnalysisJobsBulk,
  type AnalysisJobDetails,
  type AnalysisJobsListResponse,
  type AnalysisJobsPageItem,
  type AnalysisJobStatus,
  type AnalysisJobsSortOption,
} from "@/src/lib/api/analysis-jobs-api-client"
import { cn } from "@/lib/utils"

const STATUSES: Array<AnalysisJobStatus | "ALL"> = [
  "ALL",
  "QUEUED",
  "RUNNING",
  "SUCCEEDED",
  "FAILED",
  "CANCELLED",
]

type SortOption = AnalysisJobsSortOption

function getWorkspaceLabel(job: Pick<AnalysisJobsPageItem, "workspaceName">) {
  return job.workspaceName || "General Workspace"
}

function formatDate(value?: string | null) {
  if (!value) return "--"
  return new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit",
  }).format(new Date(value))
}

function getRuntimeSeconds(job: Pick<AnalysisJobsPageItem, "runtimeMinutes" | "startedAt" | "finishedAt">) {
  if (typeof job.runtimeMinutes === "number") {
    return Math.max(0, Math.round(job.runtimeMinutes * 60))
  }
  if (!job.startedAt) return 0
  const start = new Date(job.startedAt).getTime()
  const end = job.finishedAt ? new Date(job.finishedAt).getTime() : Date.now()
  return Math.max(0, Math.floor((end - start) / 1000))
}

function getErrorMessage(error: unknown) {
  if (error instanceof ApiError) return error.message
  if (error instanceof Error) return error.message
  return "Something went wrong while contacting the analysis jobs API."
}

function formatRuntime(seconds: number) {
  if (!seconds) return "--"
  const h = Math.floor(seconds / 3600)
  const m = Math.floor((seconds % 3600) / 60)
  const s = seconds % 60
  if (h > 0) return `${h}h ${m}m ${s}s`
  if (m > 0) return `${m}m ${s}s`
  return `${s}s`
}

function isActionEnabled(status: AnalysisJobStatus, action: "open-results" | "download-output" | "retry" | "cancel") {
  if (action === "cancel") return status === "QUEUED" || status === "RUNNING"
  if (action === "retry") return status === "FAILED" || status === "CANCELLED"
  if (action === "open-results") return status === "SUCCEEDED"
  if (action === "download-output") return status === "SUCCEEDED"
  return true
}

function statusMeta(status: AnalysisJobStatus) {
  switch (status) {
    case "QUEUED":
      return { icon: Clock3, label: "Queued", badgeClass: "bg-slate-100 text-slate-700 border-slate-200" }
    case "RUNNING":
      return { icon: Loader2, label: "Running", badgeClass: "bg-blue-50 text-blue-700 border-blue-200" }
    case "SUCCEEDED":
      return { icon: CheckCircle2, label: "Succeeded", badgeClass: "bg-emerald-50 text-emerald-700 border-emerald-200" }
    case "FAILED":
      return { icon: AlertTriangle, label: "Failed", badgeClass: "bg-red-50 text-red-700 border-red-200" }
    case "CANCELLED":
      return { icon: XCircle, label: "Cancelled", badgeClass: "bg-amber-50 text-amber-700 border-amber-200" }
  }
}

export default function AnalysisJobsPage() {
  const router = useRouter()

  const [search, setSearch] = useState("")
  const [status, setStatus] = useState<AnalysisJobStatus | "ALL">("ALL")
  const [workspace, setWorkspace] = useState<string>("ALL")
  const [dataset, setDataset] = useState<string>("ALL")
  const [sortBy, setSortBy] = useState<SortOption>("NEWEST")
  const [quickFilter, setQuickFilter] = useState<"ALL" | "QUEUED" | "RUNNING" | "SUCCEEDED" | "FAILED">("ALL")
  const [fromDate, setFromDate] = useState("")
  const [toDate, setToDate] = useState("")
  const [showAdvanced, setShowAdvanced] = useState(false)
  const [selectedIds, setSelectedIds] = useState<string[]>([])
  const [detailsJobId, setDetailsJobId] = useState<string | null>(null)
  const [jobsData, setJobsData] = useState<AnalysisJobsListResponse>({
    items: [],
    total: 0,
    page: 1,
    pageSize: 25,
  })
  const [isLoading, setIsLoading] = useState(true)
  const [errorMessage, setErrorMessage] = useState<string | null>(null)
  const [detailsJob, setDetailsJob] = useState<AnalysisJobDetails | null>(null)
  const [detailsLoading, setDetailsLoading] = useState(false)
  const [detailsError, setDetailsError] = useState<string | null>(null)
  const [isActing, setIsActing] = useState(false)

  const effectiveStatus = status === "ALL" ? quickFilter : status
  const baseItems = jobsData.items

  const loadJobs = useCallback(
    async (options?: { silent?: boolean }) => {
      if (!options?.silent) {
        setIsLoading(true)
      }

      setErrorMessage(null)

      try {
        const result = await listAnalysisJobs({
          search,
          status: effectiveStatus,
          sortBy,
          page: 1,
          pageSize: 100,
        })

        setJobsData(result)
        setSelectedIds((prev) => prev.filter((id) => result.items.some((job) => job.id === id)))
      } catch (error) {
        setErrorMessage(getErrorMessage(error))
      } finally {
        if (!options?.silent) {
          setIsLoading(false)
        }
      }
    },
    [search, effectiveStatus, sortBy]
  )

  const loadJobDetails = useCallback(async (jobId: string, options?: { silent?: boolean }) => {
    if (!options?.silent) {
      setDetailsLoading(true)
    }

    setDetailsError(null)

    try {
      const result = await getAnalysisJob(jobId)
      setDetailsJob(result)
    } catch (error) {
      setDetailsError(getErrorMessage(error))
    } finally {
      if (!options?.silent) {
        setDetailsLoading(false)
      }
    }
  }, [])

  useEffect(() => {
    void loadJobs()
  }, [loadJobs])

  useEffect(() => {
    if (!detailsJobId) {
      setDetailsJob(null)
      setDetailsError(null)
      setDetailsLoading(false)
      return
    }

    void loadJobDetails(detailsJobId)
  }, [detailsJobId, loadJobDetails])

  useEffect(() => {
    if (!detailsJobId || !detailsJob || !["QUEUED", "RUNNING"].includes(detailsJob.status)) {
      return
    }

    const intervalId = window.setInterval(() => {
      void loadJobDetails(detailsJobId, { silent: true })
      void loadJobs({ silent: true })
    }, 3000)

    return () => window.clearInterval(intervalId)
  }, [detailsJobId, detailsJob, loadJobDetails, loadJobs])

  const workspaceOptions = useMemo(() => {
    return Array.from(new Set(baseItems.map((job) => getWorkspaceLabel(job))))
  }, [baseItems])

  const datasetOptions = useMemo(() => {
    return Array.from(new Set(baseItems.map((job) => job.dataset?.name).filter(Boolean) as string[]))
  }, [baseItems])

  const visibleItems = useMemo(() => {
    const filtered = baseItems.filter((job) => {
      const workspaceMatch = workspace === "ALL" || getWorkspaceLabel(job) === workspace
      const datasetMatch = dataset === "ALL" || job.dataset?.name === dataset

      const created = new Date(job.createdAt)
      const fromOk = !fromDate || created >= new Date(fromDate)
      const toOk = !toDate || created <= new Date(`${toDate}T23:59:59`)

      return workspaceMatch && datasetMatch && fromOk && toOk
    })

    const sorted = [...filtered]
    sorted.sort((a, b) => {
      if (sortBy === "NEWEST") return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
      if (sortBy === "OLDEST") return new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()
      if (sortBy === "RUNTIME") return getRuntimeSeconds(b) - getRuntimeSeconds(a)
      if (sortBy === "STATUS") return a.status.localeCompare(b.status)

      const aUpdated = new Date(a.finishedAt ?? a.startedAt ?? a.createdAt).getTime()
      const bUpdated = new Date(b.finishedAt ?? b.startedAt ?? b.createdAt).getTime()
      return bUpdated - aUpdated
    })

    return sorted
  }, [baseItems, workspace, dataset, fromDate, toDate, sortBy])

  const selectedItems = useMemo(
    () => visibleItems.filter((job) => selectedIds.includes(job.id)),
    [visibleItems, selectedIds]
  )

  const allVisibleSelected = visibleItems.length > 0 && visibleItems.every((job) => selectedIds.includes(job.id))
  const hasActiveFilters = Boolean(
    search ||
    effectiveStatus !== "ALL" ||
    workspace !== "ALL" ||
    dataset !== "ALL" ||
    fromDate ||
    toDate ||
    sortBy !== "NEWEST"
  )

  const stats = useMemo(() => {
    const queued = baseItems.filter((job) => job.status === "QUEUED").length
    const running = baseItems.filter((job) => job.status === "RUNNING").length
    const succeeded = baseItems.filter((job) => job.status === "SUCCEEDED").length
    const failed = baseItems.filter((job) => job.status === "FAILED").length

    const runtimeSucceeded = baseItems
      .filter((job) => job.status === "SUCCEEDED")
      .map((job) => getRuntimeSeconds(job))
      .filter((seconds) => seconds > 0)
    const avgRuntime = runtimeSucceeded.length
      ? Math.round(runtimeSucceeded.reduce((sum, item) => sum + item, 0) / runtimeSucceeded.length)
      : 0

    return {
      total: baseItems.length,
      queued,
      running,
      succeeded,
      failed,
      avgRuntime,
    }
  }, [baseItems])

  function onToggleSelectAll(checked: boolean) {
    if (checked) {
      setSelectedIds((prev) => [...new Set([...prev, ...visibleItems.map((job) => job.id)])])
      return
    }
    setSelectedIds((prev) => prev.filter((id) => !visibleItems.some((job) => job.id === id)))
  }

  function onToggleSelectJob(jobId: string, checked: boolean) {
    setSelectedIds((prev) =>
      checked ? [...new Set([...prev, jobId])] : prev.filter((id) => id !== jobId)
    )
  }

  function clearFilters() {
    setSearch("")
    setStatus("ALL")
    setWorkspace("ALL")
    setDataset("ALL")
    setSortBy("NEWEST")
    setQuickFilter("ALL")
    setFromDate("")
    setToDate("")
  }

  function applyQuickFilter(next: "ALL" | "QUEUED" | "RUNNING" | "SUCCEEDED" | "FAILED") {
    setQuickFilter(next)
    setStatus("ALL")
  }

  function downloadFile(name: string, content: string) {
    const blob = new Blob([content], { type: "text/plain;charset=utf-8" })
    const url = URL.createObjectURL(blob)
    const a = document.createElement("a")
    a.href = url
    a.download = name
    a.click()
    URL.revokeObjectURL(url)
  }

  function exportMetadata() {
    const payload = visibleItems.map((job) => ({
      id: job.id,
      title: job.title,
      status: job.status,
      createdAt: job.createdAt,
      dataset: job.dataset?.name ?? "N/A",
      workspace: getWorkspaceLabel(job),
      owner: job.owner?.name ?? "Unknown",
    }))

    downloadFile(`analysis-jobs-${Date.now()}.json`, JSON.stringify(payload, null, 2))
  }

  async function handleRetryJob(jobId: string) {
    setIsActing(true)

    try {
      const result = await retryAnalysisJob(jobId)
      await loadJobs({ silent: true })
      if (detailsJobId === jobId) {
        await loadJobDetails(jobId, { silent: true })
      }
      window.alert(result.message ?? `Retry queued for ${jobId}.`)
    } catch (error) {
      window.alert(getErrorMessage(error))
    } finally {
      setIsActing(false)
    }
  }

  async function handleCancelJob(jobId: string) {
    setIsActing(true)

    try {
      const result = await cancelAnalysisJob(jobId)
      await loadJobs({ silent: true })
      if (detailsJobId === jobId) {
        await loadJobDetails(jobId, { silent: true })
      }
      window.alert(result.message ?? `Cancel requested for ${jobId}.`)
    } catch (error) {
      window.alert(getErrorMessage(error))
    } finally {
      setIsActing(false)
    }
  }

  function openDownload(url: string) {
    window.open(url, "_blank", "noopener,noreferrer")
  }

  async function runBulk(action: "retry" | "download" | "archive" | "delete" | "cancel") {
    if (selectedItems.length === 0) return

    if (action === "delete") {
      if (!window.confirm(`Delete ${selectedItems.length} selected job(s)?`)) return
    }

    if (action === "download") {
      selectedItems
        .filter((job) => isActionEnabled(job.status, "download-output"))
        .forEach((job) => openDownload(getAnalysisJobDownloadUrl(job.id)))
      return
    }

    if (action === "cancel") {
      setIsActing(true)
      try {
        const result = await cancelAnalysisJobsBulk(
          selectedItems.filter((job) => isActionEnabled(job.status, "cancel")).map((job) => job.id)
        )
        await loadJobs({ silent: true })
        if (detailsJobId) {
          await loadJobDetails(detailsJobId, { silent: true })
        }
        window.alert(result.message ?? `Cancel requested for ${result.processedIds.length} job(s).`)
      } catch (error) {
        window.alert(getErrorMessage(error))
      } finally {
        setIsActing(false)
      }
      return
    }

    if (action === "retry") {
      setIsActing(true)
      try {
        const result = await retryAnalysisJobsBulk(
          selectedItems.filter((job) => isActionEnabled(job.status, "retry")).map((job) => job.id)
        )
        await loadJobs({ silent: true })
        if (detailsJobId) {
          await loadJobDetails(detailsJobId, { silent: true })
        }
        window.alert(result.message ?? `Retry queued for ${result.processedIds.length} job(s).`)
      } catch (error) {
        window.alert(getErrorMessage(error))
      } finally {
        setIsActing(false)
      }
      return
    }

    window.alert(`${action.toUpperCase()} applied to ${selectedItems.length} selected job(s).`)
  }

  return (
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
              <Button onClick={() => window.alert("New Analysis flow will open here.")}><Plus className="mr-2 h-4 w-4" />New Analysis</Button>
              <Button variant="secondary" onClick={() => router.push("/dashboard/pipelines")}><Workflow className="mr-2 h-4 w-4" />Run Pipeline</Button>
              <Button variant="outline" onClick={() => router.push("/dashboard/datasets")}><Upload className="mr-2 h-4 w-4" />Upload Dataset</Button>
              <Button variant="ghost" size="icon" onClick={() => void loadJobs()} disabled={isLoading}>
                <RefreshCw className={cn("h-4 w-4", isLoading && "animate-spin")} />
              </Button>
              <Button variant="outline" onClick={() => window.alert("Import Config is ready for backend wiring.")}><FileUp className="mr-2 h-4 w-4" />Import Config</Button>
              <Button variant="outline" onClick={() => window.alert("Saved templates panel coming next.")}><BookCopy className="mr-2 h-4 w-4" />Saved Templates</Button>
            </div>
          </div>
        </div>
      </div>

      <main className="mx-auto max-w-[1400px] px-6 py-6">

      {isLoading ? (
        <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-6">
          {Array.from({ length: 6 }).map((_, index) => (
            <Card key={index} className="rounded-2xl">
              <CardHeader>
                <Skeleton className="h-4 w-24" />
              </CardHeader>
              <CardContent>
                <Skeleton className="h-8 w-16" />
              </CardContent>
            </Card>
          ))}
        </section>
      ) : (
        <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-6">
          {[
            { key: "ALL" as const, title: "Total Jobs", value: stats.total, helper: "All tracked jobs", icon: FlaskConical },
            { key: "QUEUED" as const, title: "Queued", value: stats.queued, helper: "Waiting in queue", icon: Clock3 },
            { key: "RUNNING" as const, title: "Running", value: stats.running, helper: "Active now", icon: Loader2 },
            { key: "SUCCEEDED" as const, title: "Succeeded", value: stats.succeeded, helper: "Ready for review", icon: CheckCircle2 },
            { key: "FAILED" as const, title: "Failed", value: stats.failed, helper: "Needs attention", icon: AlertTriangle },
            { key: "AVG" as const, title: "Avg Runtime", value: `${Math.round(stats.avgRuntime / 60)} min`, helper: "Across completed jobs", icon: BarChart3 },
          ].map((stat) => {
            const Icon = stat.icon
            const active = stat.key !== "AVG" && effectiveStatus === stat.key

            return (
              <button
                key={stat.title}
                type="button"
                onClick={() => stat.key !== "AVG" && applyQuickFilter(stat.key)}
                className={cn(
                  "rounded-2xl border bg-white p-4 text-left shadow-sm transition hover:shadow-md",
                  active && "border-violet-300 ring-2 ring-violet-100"
                )}
              >
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="text-sm font-medium text-slate-500">{stat.title}</p>
                    <p className="mt-3 text-3xl font-semibold text-slate-950">{stat.value}</p>
                    <p className="mt-2 text-xs text-slate-500">{stat.helper}</p>
                  </div>
                  <div className={cn("rounded-xl border p-2", active ? "border-violet-200 bg-violet-50 text-violet-700" : "border-slate-200 bg-slate-50 text-slate-600")}>
                    <Icon className={cn("h-4 w-4", stat.key === "RUNNING" && active && "animate-spin")} />
                  </div>
                </div>
              </button>
            )
          })}
        </section>
      )}

      <Card className="mt-6 rounded-2xl border-0 shadow-sm">
        <CardHeader className="pb-3">
          <CardTitle className="text-lg">Filters</CardTitle>
          <CardDescription>Search and narrow jobs by status, workspace, dataset, and submission date.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
        <div className="grid gap-3 lg:grid-cols-[1.4fr_220px_220px_220px_180px]">
          <div className="relative lg:col-span-2">
            <Search className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder="Search jobs"
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              className="pl-9"
            />
          </div>

          <Select value={status} onValueChange={(value) => setStatus(value as AnalysisJobStatus | "ALL")}>
            <SelectTrigger>
              <SelectValue placeholder="Status" />
            </SelectTrigger>
            <SelectContent>
              {STATUSES.map((item) => (
                <SelectItem key={item} value={item}>
                  {item}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Select value={workspace} onValueChange={setWorkspace}>
            <SelectTrigger>
              <SelectValue placeholder="Workspace" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="ALL">All Workspaces</SelectItem>
              {workspaceOptions.map((name) => (
                <SelectItem key={name} value={name}>
                  {name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Select value={dataset} onValueChange={setDataset}>
            <SelectTrigger>
              <SelectValue placeholder="Dataset" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="ALL">All Datasets</SelectItem>
              {datasetOptions.map((name) => (
                <SelectItem key={name} value={name}>
                  {name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Select value={sortBy} onValueChange={(value) => setSortBy(value as SortOption)}>
            <SelectTrigger>
              <SelectValue placeholder="Sort By" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="NEWEST">Newest</SelectItem>
              <SelectItem value="OLDEST">Oldest</SelectItem>
              <SelectItem value="RUNTIME">Runtime</SelectItem>
              <SelectItem value="STATUS">Status</SelectItem>
              <SelectItem value="LAST_UPDATED">Last Updated</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {showAdvanced ? (
          <div className="grid gap-3 md:grid-cols-3">
            <Input type="date" value={fromDate} onChange={(event) => setFromDate(event.target.value)} />
            <Input type="date" value={toDate} onChange={(event) => setToDate(event.target.value)} />
            <Button variant="outline" onClick={exportMetadata}>
              <Download />
              Export Metadata
            </Button>
          </div>
        ) : null}

        <div className="flex flex-wrap gap-2">
          <Button variant="ghost" onClick={clearFilters}>Clear Filters</Button>
          <Button variant="outline" onClick={() => setShowAdvanced((prev) => !prev)}>
            <SlidersHorizontal />
            {showAdvanced ? "Hide Advanced" : "Advanced Filters"}
          </Button>
          <Button variant="outline" onClick={exportMetadata}>
            <FileText />
            Export Metadata
          </Button>
        </div>

        {hasActiveFilters ? (
          <div className="flex flex-wrap items-center gap-2 rounded-2xl border border-slate-200 bg-slate-50 p-3">
            <span className="text-sm font-medium text-slate-700">Active filters:</span>
            {search ? <Badge variant="secondary" className="rounded-full">Search: {search}</Badge> : null}
            {effectiveStatus !== "ALL" ? <Badge variant="secondary" className="rounded-full">Status: {effectiveStatus}</Badge> : null}
            {workspace !== "ALL" ? <Badge variant="secondary" className="rounded-full">Workspace: {workspace}</Badge> : null}
            {dataset !== "ALL" ? <Badge variant="secondary" className="rounded-full">Dataset: {dataset}</Badge> : null}
            {fromDate ? <Badge variant="secondary" className="rounded-full">From: {fromDate}</Badge> : null}
            {toDate ? <Badge variant="secondary" className="rounded-full">To: {toDate}</Badge> : null}
            {sortBy !== "NEWEST" ? <Badge variant="secondary" className="rounded-full">Sort: {sortBy}</Badge> : null}
          </div>
        ) : null}
        </CardContent>
      </Card>

      {selectedItems.length > 0 ? (
        <Card className="mt-6 rounded-2xl border-violet-200 bg-violet-50/70 shadow-sm">
          <CardContent className="flex flex-col gap-3 p-4 md:flex-row md:items-center md:justify-between">
          <div>
            <p className="font-medium text-slate-900">{selectedItems.length} job{selectedItems.length > 1 ? "s" : ""} selected</p>
            <p className="text-sm text-slate-600">Run bulk actions for the currently selected items.</p>
          </div>
          <div className="flex flex-wrap gap-2">
          <Button
            size="sm"
            variant="outline"
            onClick={() => runBulk("retry")}
            disabled={isActing || !selectedItems.some((job) => isActionEnabled(job.status, "retry"))}
          >
            <RotateCcw />
            Retry Selected
          </Button>
          <Button
            size="sm"
            variant="outline"
            onClick={() => runBulk("download")}
            disabled={!selectedItems.some((job) => isActionEnabled(job.status, "download-output"))}
          >
            <Download />
            Download Selected
          </Button>
          <Button size="sm" variant="outline" onClick={exportMetadata}>
            <FileText />
            Export Metadata
          </Button>
          <Button size="sm" variant="outline" onClick={() => runBulk("archive")}>Archive Selected</Button>
          <Button size="sm" variant="destructive" onClick={() => runBulk("delete")}>Delete Selected</Button>
          <Button
            size="sm"
            variant="destructive"
            onClick={() => runBulk("cancel")}
            disabled={isActing || !selectedItems.some((job) => isActionEnabled(job.status, "cancel"))}
          >
            <Square />
            Cancel Selected
          </Button>
          <Button size="sm" variant="ghost" onClick={() => setSelectedIds([])}>Clear</Button>
          </div>
          </CardContent>
        </Card>
      ) : null}

      {errorMessage ? (
        <Card className="border-rose-200">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-rose-700">
              <AlertTriangle />
              Unable to load analysis jobs
            </CardTitle>
            <CardDescription>
              {errorMessage}
            </CardDescription>
          </CardHeader>
          <CardContent className="flex flex-wrap gap-2">
            <Button onClick={() => void loadJobs()}>Retry</Button>
            <Button variant="outline" onClick={() => window.location.reload()}>Refresh Page</Button>
            <Button variant="outline" asChild>
              <Link href="/dashboard/access">Contact Support</Link>
            </Button>
            <Button variant="ghost" asChild>
              <Link href="/dashboard/monitoring/pipelines">View System Status</Link>
            </Button>
          </CardContent>
        </Card>
      ) : null}

      {isLoading ? (
        <div className="space-y-2 rounded-xl border p-3">
          {Array.from({ length: 8 }).map((_, index) => (
            <Skeleton key={index} className="h-10 w-full" />
          ))}
        </div>
      ) : null}

      {!isLoading && !errorMessage && visibleItems.length === 0 ? (
        <Card>
          <CardHeader>
            <CardTitle>No analysis jobs yet</CardTitle>
            <CardDescription>
              Start your first analysis by uploading a dataset or launching a pipeline.
            </CardDescription>
          </CardHeader>
          <CardContent className="flex flex-wrap gap-2">
            <Button onClick={() => window.alert("Start first analysis flow will open here.")}>
              <Plus />
              Start First Analysis
            </Button>
            <Button variant="outline" onClick={() => router.push("/dashboard/datasets")}>
              <Upload />
              Upload Dataset
            </Button>
            <Button variant="outline" onClick={() => window.alert("Templates browser coming next.")}>
              <BookCopy />
              Browse Templates
            </Button>
          </CardContent>
        </Card>
      ) : null}

      {!isLoading && !errorMessage && visibleItems.length > 0 ? (
        <Card className="mt-6 rounded-2xl border-0 shadow-sm">
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between gap-4">
              <div>
                <CardTitle className="text-lg">Jobs</CardTitle>
                <CardDescription>
                  Review current activity, open results, and manage retries. Showing {visibleItems.length} of {baseItems.length} jobs.
                </CardDescription>
              </div>
              <Badge variant="secondary" className="rounded-full px-3 py-1">{visibleItems.length} visible</Badge>
            </div>
          </CardHeader>
          <CardContent>
        <div className="overflow-x-auto rounded-2xl border">
          <Table>
            <TableHeader>
              <TableRow className="bg-slate-50/80 hover:bg-slate-50/80">
                <TableHead>
                  <Checkbox
                    checked={allVisibleSelected}
                    onCheckedChange={(value) => onToggleSelectAll(Boolean(value))}
                  />
                </TableHead>
                <TableHead>Job Name</TableHead>
                <TableHead>Dataset</TableHead>
                <TableHead>Workspace</TableHead>
                <TableHead>Analysis Type</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Submitted At</TableHead>
                <TableHead>Last Updated</TableHead>
                <TableHead>Runtime</TableHead>
                <TableHead>Owner</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {visibleItems.map((job) => {
                const runtime = getRuntimeSeconds(job)
                const lastUpdated = job.finishedAt ?? job.startedAt ?? job.createdAt
                const selected = selectedIds.includes(job.id)
                const meta = statusMeta(job.status)
                const Icon = meta.icon

                return (
                  <TableRow key={job.id} data-state={selected ? "selected" : undefined}>
                    <TableCell>
                      <Checkbox
                        checked={selected}
                        onCheckedChange={(value) => onToggleSelectJob(job.id, Boolean(value))}
                      />
                    </TableCell>
                    <TableCell>
                      <div>
                        <p className="font-medium text-slate-900">{job.title}</p>
                        <p className="text-xs text-slate-500">{job.id}</p>
                      </div>
                    </TableCell>
                    <TableCell>{job.dataset?.name ?? "N/A"}</TableCell>
                    <TableCell>{getWorkspaceLabel(job)}</TableCell>
                    <TableCell>{job.templateName}</TableCell>
                    <TableCell>
                      <div className="space-y-1.5">
                        <Badge className={cn("gap-1 rounded-full border font-medium", meta.badgeClass)}>
                          <Icon className={cn("h-3.5 w-3.5", job.status === "RUNNING" && "animate-spin")} />
                          {meta.label}
                        </Badge>
                        <Progress value={job.progressPercent} className="h-1.5" />
                      </div>
                    </TableCell>
                    <TableCell>{formatDate(job.createdAt)}</TableCell>
                    <TableCell>{formatDate(lastUpdated)}</TableCell>
                    <TableCell>{formatRuntime(runtime)}</TableCell>
                    <TableCell>{job.owner?.name ?? "Unknown"}</TableCell>
                    <TableCell className="text-right">
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button size="icon-sm" variant="ghost" aria-label="Open actions menu">
                            <MoreHorizontal />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end" className="w-52">
                          <DropdownMenuItem onClick={() => setDetailsJobId(job.id)}>
                            <Eye className="mr-2 h-4 w-4" />
                            View Details
                          </DropdownMenuItem>
                          <DropdownMenuItem
                            disabled={!isActionEnabled(job.status, "open-results")}
                            onClick={() => router.push("/dashboard/results")}
                          >
                            <BarChart3 className="mr-2 h-4 w-4" />
                            Open Results
                          </DropdownMenuItem>
                          <DropdownMenuItem
                            disabled={!isActionEnabled(job.status, "download-output")}
                            onClick={() => openDownload(getAnalysisJobDownloadUrl(job.id))}
                          >
                            <Download className="mr-2 h-4 w-4" />
                            Download Output
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={() => openDownload(getAnalysisJobLogsDownloadUrl(job.id))}>
                            <FileDown className="mr-2 h-4 w-4" />
                            Download Logs
                          </DropdownMenuItem>
                          <DropdownMenuSeparator />
                          <DropdownMenuItem
                            disabled={!isActionEnabled(job.status, "retry")}
                            onClick={() => void handleRetryJob(job.id)}
                          >
                            <RotateCcw className="mr-2 h-4 w-4" />
                            Retry Job
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={() => window.alert(`Duplicate created from ${job.title}.`)}>
                            <Plus className="mr-2 h-4 w-4" />
                            Duplicate Job
                          </DropdownMenuItem>
                          <DropdownMenuItem
                            disabled={!isActionEnabled(job.status, "cancel") || isActing}
                            onClick={() => void handleCancelJob(job.id)}
                          >
                            {isActing ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Square className="mr-2 h-4 w-4" />}
                            Cancel Job
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={() => window.alert(`Share link copied for ${job.title}.`)}>
                            <Share2 className="mr-2 h-4 w-4" />
                            Share
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={() => window.alert(`Issue report drafted for ${job.title}.`)}>
                            <AlertTriangle className="mr-2 h-4 w-4" />
                            Report Issue
                          </DropdownMenuItem>
                          <DropdownMenuItem
                            className="text-red-600"
                            onClick={() => {
                              if (window.confirm(`Archive ${job.title}?`)) window.alert(`${job.title} archived.`)
                            }}
                          >
                            <Trash2 className="mr-2 h-4 w-4" />
                            Delete / Archive
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  </TableRow>
                )
              })}
            </TableBody>
          </Table>
        </div>
          </CardContent>
        </Card>
      ) : null}

      <Sheet open={Boolean(detailsJobId)} onOpenChange={(open) => (!open ? setDetailsJobId(null) : null)}>
        <SheetContent className="w-full overflow-y-auto sm:max-w-2xl">
          <SheetHeader>
            <SheetTitle>{detailsJob?.title ?? "Job Details"}</SheetTitle>
            <SheetDescription>
              {detailsJob?.id ?? "--"} | {detailsJob?.templateName ?? "--"} | {detailsJob ? getWorkspaceLabel(detailsJob) : "--"}
            </SheetDescription>
          </SheetHeader>

          {detailsLoading ? (
            <div className="mt-6 space-y-3">
              <Skeleton className="h-8 w-48" />
              <Skeleton className="h-56 w-full" />
              <Skeleton className="h-40 w-full" />
            </div>
          ) : detailsError ? (
            <Card className="mt-6 border-rose-200">
              <CardHeader>
                <CardTitle className="text-rose-700">Unable to load job details</CardTitle>
                <CardDescription>{detailsError}</CardDescription>
              </CardHeader>
              <CardContent>
                <Button onClick={() => detailsJobId && void loadJobDetails(detailsJobId)}>Retry</Button>
              </CardContent>
            </Card>
          ) : (
          <div className="mt-6">
            {detailsJob ? (
              <div className="flex flex-wrap items-center gap-2">
                <Badge className={cn("gap-1 rounded-full border", statusMeta(detailsJob.status).badgeClass)}>
                  {(() => {
                    const StatusIcon = statusMeta(detailsJob.status).icon
                    return <StatusIcon className={cn("h-3.5 w-3.5", detailsJob.status === "RUNNING" && "animate-spin")} />
                  })()}
                  {statusMeta(detailsJob.status).label}
                </Badge>
                <Badge variant="secondary" className="rounded-full">{detailsJob.dataset?.name ?? "No dataset"}</Badge>
                <Badge variant="secondary" className="rounded-full">{detailsJob.templateName}</Badge>
              </div>
            ) : null}

            <Tabs defaultValue="overview" className="mt-6">
              <TabsList className="grid w-full grid-cols-3 lg:grid-cols-7">
                <TabsTrigger value="overview">Overview</TabsTrigger>
                <TabsTrigger value="parameters">Parameters</TabsTrigger>
                <TabsTrigger value="inputs">Input Files</TabsTrigger>
                <TabsTrigger value="logs">Logs</TabsTrigger>
                <TabsTrigger value="results">Results</TabsTrigger>
                <TabsTrigger value="artifacts">Artifacts</TabsTrigger>
                <TabsTrigger value="timeline">Timeline</TabsTrigger>
              </TabsList>

              <TabsContent value="overview" className="mt-4">
                <DetailGrid
                  items={[
                    ["Submitted", formatDate(detailsJob?.createdAt)],
                    ["Last Updated", formatDate(detailsJob?.finishedAt ?? detailsJob?.startedAt ?? detailsJob?.createdAt)],
                    ["Runtime", formatRuntime(detailsJob ? getRuntimeSeconds(detailsJob) : 0)],
                    ["Owner", detailsJob?.owner?.name ?? "Unknown"],
                    ["Dataset", detailsJob?.dataset?.name ?? "N/A"],
                    ["Workspace", detailsJob ? getWorkspaceLabel(detailsJob) : "N/A"],
                  ]}
                />
              </TabsContent>

              <TabsContent value="parameters" className="mt-4">
                <Card>
                  <CardContent className="pt-6">
                    {detailsJob?.parameters ? (
                      <div className="space-y-3">
                        {Object.entries(detailsJob.parameters).map(([key, value]) => (
                          <div key={key} className="flex items-center justify-between rounded-xl border px-3 py-2">
                            <span className="text-sm font-medium text-slate-700">{key}</span>
                            <span className="text-sm text-slate-600">{String(value)}</span>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <p className="text-sm text-slate-500">No parameters recorded.</p>
                    )}
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="inputs" className="mt-4">
                <Card>
                  <CardContent className="pt-6">
                    <p className="text-sm text-slate-700">{detailsJob?.dataset?.name ?? "No input dataset linked."}</p>
                    <p className="mt-2 text-sm text-slate-500">Attached to workspace {detailsJob ? getWorkspaceLabel(detailsJob) : "--"}.</p>
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="logs" className="mt-4">
                <Card>
                  <CardContent className="pt-6">
                <div className="space-y-2">
                  {(detailsJob?.logs ?? []).slice(-40).map((log) => (
                    <div key={log.id} className="rounded-xl border bg-slate-50 px-3 py-2 font-mono text-xs text-slate-700">
                      [{new Date(log.timestamp).toLocaleTimeString()}] {log.level}: {log.message}
                    </div>
                  ))}
                  {(detailsJob?.logs ?? []).length === 0 ? <p className="text-sm text-slate-500">No logs available.</p> : null}
                </div>
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="results" className="mt-4">
                <Card>
                  <CardContent className="pt-6">
                    <p className="text-sm text-slate-700">
                      {detailsJob?.status === "SUCCEEDED"
                        ? "Results are ready. Open the results view or download the packaged output."
                        : "Results will appear once the job completes successfully."}
                    </p>
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="artifacts" className="mt-4">
                <Card>
                  <CardContent className="pt-6">
                    <p className="text-sm text-slate-700">
                      {(detailsJob?.artifactIds?.length ?? 0) > 0
                        ? "Artifacts have been packaged and are ready for download."
                        : "No packaged artifacts available yet."}
                    </p>
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="timeline" className="mt-4">
                <Card>
                  <CardContent className="pt-6">
                    <div className="space-y-4">
                      <TimelineItem label="Submitted" value={formatDate(detailsJob?.createdAt)} />
                      <TimelineItem label="Updated" value={formatDate(detailsJob?.finishedAt ?? detailsJob?.startedAt ?? detailsJob?.createdAt)} />
                      <TimelineItem label="Current Status" value={detailsJob ? statusMeta(detailsJob.status).label : "--"} />
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>
            </Tabs>
          </div>
          )}

          <Separator className="my-6" />

          <SheetFooter>
            <Button
              disabled={isActing || !(detailsJob?.status === "FAILED" || detailsJob?.status === "CANCELLED")}
              onClick={() => detailsJobId && void handleRetryJob(detailsJobId)}
            >
              <RotateCcw />
              Retry Job
            </Button>
            <Button
              variant="destructive"
              disabled={!detailsJobId || !detailsJob || isActing || !isActionEnabled(detailsJob.status, "cancel")}
              onClick={() => {
                if (detailsJobId) {
                  void handleCancelJob(detailsJobId)
                }
              }}
            >
              <Square />
              Cancel Job
            </Button>
            <Button variant="secondary" disabled={detailsJob?.status !== "SUCCEEDED"} onClick={() => router.push("/dashboard/results")}>
              <BarChart3 />
              Open Results
            </Button>
            <Button variant="outline" disabled={detailsJob?.status !== "SUCCEEDED"} onClick={() => detailsJobId && openDownload(getAnalysisJobDownloadUrl(detailsJobId))}> 
              <FileText />
              Download Report
            </Button>
            <Button variant="outline" disabled={!(detailsJob?.artifactIds?.length)} onClick={() => detailsJobId && openDownload(getAnalysisJobDownloadUrl(detailsJobId))}> 
              <Download />
              Download Full Package
            </Button>
            <Button variant="ghost" onClick={() => setDetailsJobId(null)}>Close</Button>
          </SheetFooter>
        </SheetContent>
      </Sheet>
      </main>
    </div>
  )
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
  )
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
  )
}
