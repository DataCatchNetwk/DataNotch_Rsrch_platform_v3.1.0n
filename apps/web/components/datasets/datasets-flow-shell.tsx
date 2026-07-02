"use client"

import * as React from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import {
  ArrowLeft,
  ChevronDown,
  ChevronRight,
  FlaskConical,
  FolderArchive,
  FolderGit2,
  Globe2,
  Plus,
  ShieldCheck,
  SlidersHorizontal,
  Sparkles,
  Star,
  Trash2,
  Users,
} from "lucide-react"

import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { DatasetsPageView } from "@/components/datasets/datasets-page"
import { DataDepositClient } from "@/components/data-deposit/data-deposit-client"
import { getSavedDatasetWorkspaceId, saveDatasetWorkspaceId } from "@/lib/api/datasets"
import {
  createPipelineRun,
  getMyWorkspaces,
  listDatasets,
  listWorkspacePipelineRuns,
  type Dataset,
  type PipelineRun,
  type Workspace,
} from "@/src/lib/api/workspaces"
import {
  bulkDepositOperation,
  createDepositAccessRequest,
  createDepositSavedView,
  deleteDepositSavedView,
  getDepositDatasetLineage,
  listDepositSavedViews,
  listDepositDatasets,
  toggleFavoriteDataset,
  type DepositSavedView,
  type DepositDatasetSummary,
} from "@/src/lib/api/data-deposit"
import { buildCohort, createCohort, listCohorts, type CohortDefinition, type CohortDomain } from "@/src/lib/api/cohorts"
import { startDatasetAnalysis } from "@/lib/api/dataset-details"
import { listAnalysisJobs, type AnalysisJobsPageItem } from "@/src/lib/api/analysis-jobs-api-client"
import { toast } from "sonner"

type DatasetFlowKey =
  | "library"
  | "deposit"
  | "workspace"
  | "cohort"
  | "operations"
  | "analysis"
  | "lineage"
  | "governance"
  | "favorites"

function pickPreferredWorkspace(workspaces: Workspace[]) {
  const savedWorkspaceId = getSavedDatasetWorkspaceId()
  return (
    workspaces.find((workspace) => workspace.id === savedWorkspaceId) ??
    workspaces.find((workspace) => workspace.name.toLowerCase().includes("sdoh")) ??
    workspaces[0]
  )
}

const FLOW_ITEMS: Array<{
  key: DatasetFlowKey
  title: string
  subtitle: string
  icon: React.ComponentType<{ className?: string }>
}> = [
  {
    key: "library",
    title: "Dataset Library",
    subtitle: "Upload, browse, inspect",
    icon: FolderArchive,
  },
  {
    key: "deposit",
    title: "Data Deposit",
    subtitle: "Global governed catalog",
    icon: Globe2,
  },
  {
    key: "workspace",
    title: "Workspace Datasets",
    subtitle: "Workspace-scoped assets",
    icon: Users,
  },
  {
    key: "cohort",
    title: "Cohort Builder",
    subtitle: "Build cohorts from datasets",
    icon: Sparkles,
  },
  {
    key: "operations",
    title: "Data Operations",
    subtitle: "Ingest, transform, export",
    icon: SlidersHorizontal,
  },
  {
    key: "analysis",
    title: "Analysis Launcher",
    subtitle: "Run analysis workflows",
    icon: FlaskConical,
  },
  {
    key: "lineage",
    title: "Versions & Lineage",
    subtitle: "Track history and evolution",
    icon: FolderGit2,
  },
  {
    key: "governance",
    title: "Access & Governance",
    subtitle: "RBAC and policy controls",
    icon: ShieldCheck,
  },
  {
    key: "favorites",
    title: "Favorites",
    subtitle: "Saved catalog datasets",
    icon: Star,
  },
]

function BackToDatasetsButton({ onBack }: { onBack?: () => void }) {
  const router = useRouter()

  return (
    <Button
      size="sm"
      variant="outline"
      className="gap-2"
      onClick={() => {
        if (onBack) {
          onBack()
          return
        }

        router.push("/dashboard/datasets")
      }}
    >
      <ArrowLeft className="h-4 w-4" />
      Back to Datasets
    </Button>
  )
}

function WorkspaceDatasetsPanel({ onBack }: { onBack?: () => void } = {}) {
  const router = useRouter()
  const [workspaces, setWorkspaces] = React.useState<Workspace[]>([])
  const [loading, setLoading] = React.useState(true)
  const [expandedId, setExpandedId] = React.useState<string | null>(null)
  const [wsDatasets, setWsDatasets] = React.useState<Record<string, Dataset[]>>({})
  const [dsLoading, setDsLoading] = React.useState<Record<string, boolean>>({})

  React.useEffect(() => {
    let mounted = true
    void (async () => {
      try {
        const data = await getMyWorkspaces()
        if (mounted) setWorkspaces(data)
      } catch (error) {
        toast.error((error as Error).message || "Failed to load workspaces")
      } finally {
        if (mounted) setLoading(false)
      }
    })()
    return () => {
      mounted = false
    }
  }, [])

  const toggleExpand = React.useCallback(async (wsId: string) => {
    setExpandedId((current) => (current === wsId ? null : wsId))
    if (wsDatasets[wsId] !== undefined) return
    setDsLoading((prev) => ({ ...prev, [wsId]: true }))
    try {
      const data = await listDatasets(wsId)
      setWsDatasets((prev) => ({ ...prev, [wsId]: data }))
    } catch {
      setWsDatasets((prev) => ({ ...prev, [wsId]: [] }))
    } finally {
      setDsLoading((prev) => ({ ...prev, [wsId]: false }))
    }
  }, [wsDatasets])

  if (loading) {
    return <Card><CardContent className="p-6 text-sm text-muted-foreground">Loading workspace datasets...</CardContent></Card>
  }

  if (workspaces.length === 0) {
    return (
      <Card>
        <CardContent className="space-y-3 p-6">
          <p className="text-sm text-muted-foreground">No workspaces found for this account.</p>
          <Button onClick={() => router.push("/dashboard/workspaces")}>Open Workspaces</Button>
        </CardContent>
      </Card>
    )
  }

  return (
    <div className="space-y-3">
      <BackToDatasetsButton onBack={onBack} />
      <div className="grid gap-4 md:grid-cols-2">
        {workspaces.map((workspace) => {
          const isExpanded = expandedId === workspace.id
          const datasets = wsDatasets[workspace.id] ?? []
          const isDsLoading = dsLoading[workspace.id] ?? false
          return (
            <Card key={workspace.id}>
              <CardHeader className="pb-2">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-base">{workspace.name}</CardTitle>
                  <button
                    type="button"
                    onClick={() => void toggleExpand(workspace.id)}
                    className="flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground"
                  >
                    {isExpanded ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
                    {workspace._count.datasets} dataset{workspace._count.datasets !== 1 ? "s" : ""}
                  </button>
                </div>
              </CardHeader>
              <CardContent className="space-y-3">
                <p className="text-sm text-muted-foreground">{workspace.description || "No description"}</p>
                <div className="grid grid-cols-2 gap-2 text-sm">
                  <div className="rounded-lg border p-2">Analysis: {workspace._count.analysisJobs}</div>
                  <div className="rounded-lg border p-2">Members: {workspace._count.members}</div>
                </div>

                {isExpanded && (
                  <div className="space-y-1">
                    {isDsLoading ? (
                      <p className="text-xs text-muted-foreground">Loading datasets…</p>
                    ) : datasets.length === 0 ? (
                      <p className="text-xs text-muted-foreground">No datasets in this workspace yet.</p>
                    ) : (
                      <div className="overflow-hidden rounded-md border text-xs">
                        <table className="w-full">
                          <thead>
                            <tr className="border-b bg-muted/40">
                              <th className="px-2 py-1.5 text-left font-medium">Name</th>
                              <th className="px-2 py-1.5 text-left font-medium">Status</th>
                              <th className="px-2 py-1.5 text-left font-medium">Kind</th>
                              <th className="px-2 py-1.5"></th>
                            </tr>
                          </thead>
                          <tbody>
                            {datasets.map((ds) => (
                              <tr key={ds.id} className="border-b last:border-0 hover:bg-muted/20">
                                <td className="max-w-[140px] truncate px-2 py-1.5 font-medium">{ds.name}</td>
                                <td className="px-2 py-1.5 capitalize text-muted-foreground">{ds.visibility?.toLowerCase() ?? "—"}</td>
                                <td className="px-2 py-1.5 text-muted-foreground">{ds.mimeType ?? "—"}</td>
                                <td className="px-2 py-1.5">
                                  <button
                                    type="button"
                                    onClick={() => router.push(`/dashboard/datasets/${ds.id}`)}
                                    className="text-primary hover:underline"
                                  >
                                    View
                                  </button>
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    )}
                  </div>
                )}

                <div className="flex gap-2">
                  <Button size="sm" onClick={() => router.push(`/dashboard/workspaces/${workspace.id}`)}>
                    Open Workspace
                  </Button>
                  <Button size="sm" variant="outline" onClick={() => router.push("/dashboard/data-deposit")}>
                    Pull From Deposit
                  </Button>
                </div>
              </CardContent>
            </Card>
          )
        })}
      </div>
    </div>
  )
}

function FavoritesPanel({ onBack }: { onBack?: () => void } = {}) {
  const router = useRouter()
  const [items, setItems] = React.useState<DepositDatasetSummary[]>([])
  const [loading, setLoading] = React.useState(true)

  const load = React.useCallback(async () => {
    setLoading(true)
    try {
      const data = await listDepositDatasets({ page: 1, pageSize: 30, favoritesOnly: true })
      setItems(data.items)
    } catch (error) {
      toast.error((error as Error).message || "Failed to load favorites")
    } finally {
      setLoading(false)
    }
  }, [])

  React.useEffect(() => {
    void load()
  }, [load])

  if (loading) {
    return <Card><CardContent className="p-6 text-sm text-muted-foreground">Loading favorites...</CardContent></Card>
  }

  if (!items.length) {
    return (
      <Card>
        <CardContent className="space-y-3 p-6">
          <p className="text-sm text-muted-foreground">No favorite datasets yet.</p>
          <Button onClick={() => router.push("/dashboard/data-deposit")}>Browse Data Deposit</Button>
        </CardContent>
      </Card>
    )
  }

  return (
    <div className="space-y-3">
      <BackToDatasetsButton onBack={onBack} />
      {items.map((item) => (
        <Card key={item.id}>
          <CardContent className="flex flex-col gap-3 p-4 md:flex-row md:items-center md:justify-between">
            <div>
              <p className="font-medium">{item.name}</p>
              <p className="text-sm text-muted-foreground">{item.description || "No description"}</p>
            </div>
            <div className="flex gap-2">
              <Button size="sm" variant="outline" onClick={() => router.push("/dashboard/data-deposit")}>Open Catalog</Button>
              <Button
                size="sm"
                variant="outline"
                onClick={async () => {
                  try {
                    await toggleFavoriteDataset(item.id, false)
                    toast.success("Removed from favorites")
                    await load()
                  } catch (error) {
                    toast.error((error as Error).message || "Failed to update favorite")
                  }
                }}
              >
                Unfavorite
              </Button>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  )
}

function CohortBuilderPanel({ onBack }: { onBack?: () => void } = {}) {
  const [workspaces, setWorkspaces] = React.useState<Workspace[]>([])
  const [workspaceId, setWorkspaceId] = React.useState("")
  const [datasets, setDatasets] = React.useState<Dataset[]>([])
  const [cohorts, setCohorts] = React.useState<CohortDefinition[]>([])
  const [selectedCohortId, setSelectedCohortId] = React.useState("")
  const [selectedDatasetIds, setSelectedDatasetIds] = React.useState<string[]>([])
  const [buildDatasetId, setBuildDatasetId] = React.useState("")
  const [name, setName] = React.useState("")
  const [description, setDescription] = React.useState("")
  const [domain, setDomain] = React.useState<CohortDomain>("HEALTH")
  const [ruleLogic, setRuleLogic] = React.useState<"AND" | "OR">("AND")
  type CohortRule = { id: string; field: string; operator: string; value: string }
  const [rules, setRules] = React.useState<CohortRule[]>([])
  const [submitting, setSubmitting] = React.useState(false)

  const OPERATORS = ["=", "!=", ">", ">=", "<", "<=", "contains", "IN", "NOT NULL"]

  const addRule = () =>
    setRules((prev) => [...prev, { id: crypto.randomUUID(), field: "", operator: "=", value: "" }])

  const updateRule = (id: string, patch: Partial<CohortRule>) =>
    setRules((prev) => prev.map((r) => (r.id === id ? { ...r, ...patch } : r)))

  const removeRule = (id: string) =>
    setRules((prev) => prev.filter((r) => r.id !== id))

  const criteriaJson = React.useMemo(() => ({
    logic: ruleLogic,
    rules: rules.map(({ field, operator, value }) => ({ field, operator, value })),
  }), [ruleLogic, rules])

  const domains: CohortDomain[] = [
    "HEALTH", "SOCIAL", "CLIMATE", "ECONOMIC", "DEMOGRAPHIC",
    "EDUCATION", "ENVIRONMENT", "MOBILITY", "GENOMICS", "IMAGING",
    "WEARABLE", "SURVEY", "OTHER",
  ]

  const loadCohorts = React.useCallback(async () => {
    try {
      const data = await listCohorts({ limit: 50 })
      setCohorts(data)
      if (!selectedCohortId && data.length) {
        setSelectedCohortId(data[0].id)
      }
    } catch (error) {
      toast.error((error as Error).message || "Failed to load cohorts")
    }
  }, [selectedCohortId])

  React.useEffect(() => {
    let mounted = true
    void (async () => {
      try {
        const data = await getMyWorkspaces()
        if (!mounted) return
        setWorkspaces(data)
        const preferredWorkspace = pickPreferredWorkspace(data)
        if (preferredWorkspace) {
          setWorkspaceId(preferredWorkspace.id)
          saveDatasetWorkspaceId(preferredWorkspace.id)
        }
      } catch (error) {
        toast.error((error as Error).message || "Failed to load workspaces")
      }
    })()

    void loadCohorts()

    return () => {
      mounted = false
    }
  }, [loadCohorts])

  React.useEffect(() => {
    if (!workspaceId) {
      setDatasets([])
      setSelectedDatasetIds([])
      return
    }

    let mounted = true
    void (async () => {
      try {
        const data = await listDatasets(workspaceId)
        if (!mounted) return
        setDatasets(data)
      } catch (error) {
        toast.error((error as Error).message || "Failed to load workspace datasets")
      }
    })()

    return () => {
      mounted = false
    }
  }, [workspaceId])

  const toggleDatasetId = (id: string) =>
    setSelectedDatasetIds((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]
    )

  const selectedCohort = cohorts.find((item) => item.id === selectedCohortId)

  return (
    <div className="space-y-3">
      <BackToDatasetsButton onBack={onBack} />
      <div className="grid gap-4 xl:grid-cols-2">
      <Card>
        <CardHeader>
          <CardTitle>Create Cohort</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="space-y-1">
            <label className="text-xs font-medium">Workspace</label>
            <select
              aria-label="Select workspace for cohort creation"
              className="w-full rounded-md border bg-background px-3 py-2 text-sm"
              value={workspaceId}
              onChange={(event) => {
                setWorkspaceId(event.target.value)
                saveDatasetWorkspaceId(event.target.value)
              }}
            >
              {workspaces.map((workspace) => (
                <option key={workspace.id} value={workspace.id}>{workspace.name}</option>
              ))}
            </select>
          </div>
          <div className="space-y-1">
            <label className="text-xs font-medium">Name</label>
            <input
              className="w-full rounded-md border bg-background px-3 py-2 text-sm"
              value={name}
              onChange={(event) => setName(event.target.value)}
              placeholder="e.g. Metabolic Risk Cohort"
            />
          </div>
          <div className="space-y-1">
            <label className="text-xs font-medium">Description</label>
            <input
              className="w-full rounded-md border bg-background px-3 py-2 text-sm"
              value={description}
              onChange={(event) => setDescription(event.target.value)}
              placeholder="Cohort for high-risk metabolic indicators"
            />
          </div>
          <div className="space-y-1">
            <label className="text-xs font-medium">Domain</label>
            <select
              aria-label="Select cohort domain"
              className="w-full rounded-md border bg-background px-3 py-2 text-sm"
              value={domain}
              onChange={(event) => setDomain(event.target.value as CohortDomain)}
            >
              {domains.map((item) => (
                <option key={item} value={item}>{item}</option>
              ))}
            </select>
          </div>

          {/* Multi-select source datasets */}
          <div className="space-y-1">
            <label className="text-xs font-medium">Source Datasets</label>
            <div className="max-h-36 space-y-1 overflow-auto rounded-md border p-2">
              {datasets.length === 0 ? (
                <p className="text-xs text-muted-foreground">No datasets in selected workspace.</p>
              ) : (
                datasets.map((ds) => (
                  <label key={ds.id} className="flex items-center gap-2 text-sm">
                    <input
                      type="checkbox"
                      checked={selectedDatasetIds.includes(ds.id)}
                      onChange={() => toggleDatasetId(ds.id)}
                    />
                    <span className="truncate">{ds.name}</span>
                  </label>
                ))
              )}
            </div>
            {selectedDatasetIds.length > 0 && (
              <p className="text-xs text-muted-foreground">{selectedDatasetIds.length} selected</p>
            )}
          </div>

          {/* Visual rule builder */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <label className="text-xs font-medium">Criteria Rules</label>
              <div className="flex items-center gap-1 text-xs">
                <span className="text-muted-foreground">Combine with:</span>
                <button
                  type="button"
                  onClick={() => setRuleLogic("AND")}
                  className={`rounded px-2 py-0.5 font-medium ${ruleLogic === "AND" ? "bg-primary text-primary-foreground" : "border text-muted-foreground"}`}
                >
                  AND
                </button>
                <button
                  type="button"
                  onClick={() => setRuleLogic("OR")}
                  className={`rounded px-2 py-0.5 font-medium ${ruleLogic === "OR" ? "bg-primary text-primary-foreground" : "border text-muted-foreground"}`}
                >
                  OR
                </button>
              </div>
            </div>
            <div className="space-y-2">
              {rules.length === 0 && (
                <p className="text-xs text-muted-foreground">No rules yet. Add a rule below.</p>
              )}
              {rules.map((rule) => (
                <div key={rule.id} className="flex items-center gap-1.5">
                  <input
                    className="min-w-0 flex-1 rounded-md border bg-background px-2 py-1 text-xs"
                    placeholder="field"
                    value={rule.field}
                    onChange={(e) => updateRule(rule.id, { field: e.target.value })}
                  />
                  <select
                    aria-label="Rule operator"
                    className="rounded-md border bg-background px-1 py-1 text-xs"
                    value={rule.operator}
                    onChange={(e) => updateRule(rule.id, { operator: e.target.value })}
                  >
                    {OPERATORS.map((op) => (
                      <option key={op} value={op}>{op}</option>
                    ))}
                  </select>
                  {rule.operator !== "NOT NULL" && (
                    <input
                      className="min-w-0 flex-1 rounded-md border bg-background px-2 py-1 text-xs"
                      placeholder="value"
                      value={rule.value}
                      onChange={(e) => updateRule(rule.id, { value: e.target.value })}
                    />
                  )}
                  <button
                    type="button"
                    onClick={() => removeRule(rule.id)}
                    className="text-muted-foreground hover:text-destructive"
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </button>
                </div>
              ))}
            </div>
            <button
              type="button"
              onClick={addRule}
              className="flex items-center gap-1 text-xs text-primary hover:underline"
            >
              <Plus className="h-3.5 w-3.5" />
              Add rule
            </button>
            {rules.length > 0 && (
              <pre className="rounded-md bg-muted px-3 py-2 text-xs text-muted-foreground">
                {JSON.stringify(criteriaJson, null, 2)}
              </pre>
            )}
          </div>

          <div className="flex gap-2">
            <Button
              disabled={submitting || !workspaceId || selectedDatasetIds.length === 0 || !name.trim()}
              onClick={async () => {
                setSubmitting(true)
                try {
                  await createCohort({
                    name: name.trim(),
                    description: description.trim() || undefined,
                    domain,
                    criteriaJson,
                    sourceDatasetIds: selectedDatasetIds,
                  })
                  toast.success("Cohort created")
                  setName("")
                  setDescription("")
                  setRules([])
                  setSelectedDatasetIds([])
                  await loadCohorts()
                } catch (error) {
                  toast.error((error as Error).message || "Failed to create cohort")
                } finally {
                  setSubmitting(false)
                }
              }}
            >
              Create Cohort
            </Button>
            <Button variant="outline" onClick={() => void loadCohorts()}>
              Refresh Cohorts
            </Button>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Build Cohort Run</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="space-y-1">
            <label className="text-xs font-medium">Cohort</label>
            <select
              aria-label="Select existing cohort"
              className="w-full rounded-md border bg-background px-3 py-2 text-sm"
              value={selectedCohortId}
              onChange={(event) => setSelectedCohortId(event.target.value)}
            >
              <option value="">Select cohort</option>
              {cohorts.map((cohort) => (
                <option key={cohort.id} value={cohort.id}>{cohort.name}</option>
              ))}
            </select>
          </div>
          <div className="space-y-1">
            <label className="text-xs font-medium">Source Dataset For Build</label>
            <select
              aria-label="Select build dataset"
              className="w-full rounded-md border bg-background px-3 py-2 text-sm"
              value={buildDatasetId}
              onChange={(event) => setBuildDatasetId(event.target.value)}
            >
              <option value="">Select dataset</option>
              {datasets.map((dataset) => (
                <option key={dataset.id} value={dataset.id}>{dataset.name}</option>
              ))}
            </select>
          </div>
          {selectedCohort ? (
            <div className="rounded-lg border p-3 text-xs text-muted-foreground">
              Cohort domain: <span className="font-medium text-foreground">{selectedCohort.domain}</span>
              <br />
              Allowed source datasets: {selectedCohort.sourceDatasetIds.length}
            </div>
          ) : null}
          <div className="flex gap-2">
            <Button
              disabled={submitting || !selectedCohortId || !buildDatasetId}
              onClick={async () => {
                setSubmitting(true)
                try {
                  const result = await buildCohort(selectedCohortId, buildDatasetId)
                  toast.success(result.message || "Cohort build queued")
                  await loadCohorts()
                } catch (error) {
                  toast.error((error as Error).message || "Failed to queue cohort build")
                } finally {
                  setSubmitting(false)
                }
              }}
            >
              Queue Cohort Build
            </Button>
            <Button variant="outline" onClick={() => void loadCohorts()}>
              Refresh
            </Button>
          </div>
        </CardContent>
      </Card>
      </div>
    </div>
  )
}

function DataOperationsPanel({ onBack }: { onBack?: () => void } = {}) {
  const [workspaces, setWorkspaces] = React.useState<Workspace[]>([])
  const [workspaceId, setWorkspaceId] = React.useState("")
  const [datasets, setDatasets] = React.useState<Dataset[]>([])
  const [datasetId, setDatasetId] = React.useState("")
  const [operation, setOperation] = React.useState<"INGEST" | "CLEAN" | "EXPORT" | "FULL">("INGEST")
  const [runs, setRuns] = React.useState<PipelineRun[]>([])
  const [running, setRunning] = React.useState(false)

  const loadRuns = React.useCallback(async (targetWorkspaceId: string) => {
    if (!targetWorkspaceId) {
      setRuns([])
      return
    }

    try {
      const data = await listWorkspacePipelineRuns(targetWorkspaceId)
      setRuns(data.slice(0, 8))
    } catch (error) {
      toast.error((error as Error).message || "Failed to load pipeline runs")
    }
  }, [])

  React.useEffect(() => {
    let mounted = true
    void (async () => {
      try {
        const data = await getMyWorkspaces()
        if (!mounted) return
        setWorkspaces(data)
        const preferredWorkspace = pickPreferredWorkspace(data)
        if (preferredWorkspace) {
          setWorkspaceId(preferredWorkspace.id)
          saveDatasetWorkspaceId(preferredWorkspace.id)
          await loadRuns(preferredWorkspace.id)
        }
      } catch (error) {
        toast.error((error as Error).message || "Failed to load workspaces")
      }
    })()

    return () => {
      mounted = false
    }
  }, [loadRuns])

  React.useEffect(() => {
    if (!workspaceId) {
      setDatasets([])
      setDatasetId("")
      return
    }

    let mounted = true
    void (async () => {
      try {
        const data = await listDatasets(workspaceId)
        if (!mounted) return
        setDatasets(data)
        if (data.length) {
          setDatasetId((current) => current || data[0].id)
        }
      } catch (error) {
        toast.error((error as Error).message || "Failed to load workspace datasets")
      }
    })()

    return () => {
      mounted = false
    }
  }, [workspaceId])

  const manualStepsByOperation = React.useMemo(() => {
    return {
      INGEST: [{ order: 1, name: "Ingest Dataset", type: "INGEST", workerType: "INGEST_WORKER" }],
      CLEAN: [
        { order: 1, name: "Ingest Dataset", type: "INGEST", workerType: "INGEST_WORKER" },
        { order: 2, name: "Clean Dataset", type: "CLEAN", workerType: "CLEAN_WORKER" },
      ],
      EXPORT: [
        { order: 1, name: "Ingest Dataset", type: "INGEST", workerType: "INGEST_WORKER" },
        { order: 2, name: "Export Bundle", type: "EXPORT", workerType: "EXPORT_WORKER" },
      ],
      FULL: [
        { order: 1, name: "Ingest Dataset", type: "INGEST", workerType: "INGEST_WORKER" },
        { order: 2, name: "Profile Dataset", type: "PROFILE", workerType: "PROFILE_WORKER" },
        { order: 3, name: "Validate Dataset", type: "VALIDATE", workerType: "VALIDATE_WORKER" },
        { order: 4, name: "Clean Dataset", type: "CLEAN", workerType: "CLEAN_WORKER" },
        { order: 5, name: "Transform Dataset", type: "TRANSFORM", workerType: "TRANSFORM_WORKER" },
        { order: 6, name: "Export Bundle", type: "EXPORT", workerType: "EXPORT_WORKER" },
      ],
    } as const
  }, [])

  return (
    <div className="space-y-3">
      <BackToDatasetsButton onBack={onBack} />
      <div className="grid gap-4 xl:grid-cols-2">
      <Card>
        <CardHeader>
          <CardTitle>Run Data Operation</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="space-y-1">
            <label className="text-xs font-medium">Workspace</label>
            <select
              aria-label="Select workspace for data operations"
              className="w-full rounded-md border bg-background px-3 py-2 text-sm"
              value={workspaceId}
              onChange={async (event) => {
                const nextWorkspaceId = event.target.value
                setWorkspaceId(nextWorkspaceId)
                saveDatasetWorkspaceId(nextWorkspaceId)
                await loadRuns(nextWorkspaceId)
              }}
            >
              {workspaces.map((workspace) => (
                <option key={workspace.id} value={workspace.id}>{workspace.name}</option>
              ))}
            </select>
          </div>
          <div className="space-y-1">
            <label className="text-xs font-medium">Dataset</label>
            <select
              aria-label="Select dataset for data operations"
              className="w-full rounded-md border bg-background px-3 py-2 text-sm"
              value={datasetId}
              onChange={(event) => setDatasetId(event.target.value)}
            >
              <option value="">Select dataset</option>
              {datasets.map((dataset) => (
                <option key={dataset.id} value={dataset.id}>{dataset.name}</option>
              ))}
            </select>
          </div>
          <div className="space-y-1">
            <label className="text-xs font-medium">Operation</label>
            <select
              aria-label="Select operation type"
              className="w-full rounded-md border bg-background px-3 py-2 text-sm"
              value={operation}
              onChange={(event) => setOperation(event.target.value as "INGEST" | "CLEAN" | "EXPORT" | "FULL")}
            >
              <option value="INGEST">Ingest</option>
              <option value="CLEAN">Ingest + Clean</option>
              <option value="EXPORT">Ingest + Export</option>
              <option value="FULL">Full Operations</option>
            </select>
          </div>
          <div className="rounded-lg border p-3 text-xs text-muted-foreground">
            Planned steps: {manualStepsByOperation[operation].map((step) => step.type).join(" -> ")}
          </div>
          <div className="flex gap-2">
            <Button
              disabled={!workspaceId || !datasetId || running}
              onClick={async () => {
                setRunning(true)
                try {
                  const run = await createPipelineRun({
                    workspaceId,
                    datasetId,
                    name: `${operation} Operation - ${new Date().toLocaleTimeString()}`,
                    manualSteps: manualStepsByOperation[operation].map((step) => ({ ...step })),
                  })
                  toast.success(`Pipeline run queued: ${run.id}`)
                  await loadRuns(workspaceId)
                } catch (error) {
                  toast.error((error as Error).message || "Failed to trigger operation")
                } finally {
                  setRunning(false)
                }
              }}
            >
              Run Operation
            </Button>
            <Button variant="outline" onClick={() => void loadRuns(workspaceId)}>
              Refresh Runs
            </Button>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Recent Operation Runs</CardTitle>
        </CardHeader>
        <CardContent>
          {runs.length === 0 ? (
            <p className="text-sm text-muted-foreground">No runs yet for this workspace.</p>
          ) : (
            <div className="space-y-3">
              {runs.map((run) => {
                const statusColors: Record<string, string> = {
                  SUCCEEDED: "text-green-600",
                  FAILED: "text-red-500",
                  RUNNING: "text-blue-500",
                  CANCELED: "text-orange-500",
                  PARTIAL_SUCCESS: "text-yellow-600",
                }
                const stepColors: Record<string, string> = {
                  SUCCEEDED: "bg-green-500",
                  FAILED: "bg-red-500",
                  RUNNING: "bg-blue-400",
                  PENDING: "bg-gray-300",
                  QUEUED: "bg-yellow-400",
                  SKIPPED: "bg-gray-200",
                  CANCELED: "bg-orange-400",
                }
                return (
                  <div key={run.id} className="rounded-lg border p-3 text-sm space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="font-medium truncate">{run.name}</span>
                      <span className={`text-xs font-semibold ${statusColors[run.status] ?? "text-muted-foreground"}`}>
                        {run.status}
                      </span>
                    </div>
                    {/* Progress bar */}
                    <div className="h-1.5 w-full rounded-full bg-muted overflow-hidden">
                      <div
                        className="h-full rounded-full bg-primary transition-all"
                        style={{ width: `${run.progressPercent ?? 0}%` }}
                      />
                    </div>
                    {/* Step pills */}
                    {run.steps && run.steps.length > 0 && (
                      <div className="flex flex-wrap gap-1.5">
                        {run.steps
                          .slice()
                          .sort((a, b) => a.order - b.order)
                          .map((step) => (
                            <span
                              key={step.id}
                              title={`${step.type}: ${step.status}`}
                              className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium text-white ${stepColors[step.status] ?? "bg-gray-400"}`}
                            >
                              {step.type}
                            </span>
                          ))}
                      </div>
                    )}
                    <div className="text-xs text-muted-foreground">{run.progressPercent ?? 0}% complete</div>
                  </div>
                )
              })}
            </div>
          )}
        </CardContent>
      </Card>
      </div>
    </div>
  )
}

function AnalysisLauncherPanel({ onBack }: { onBack?: () => void } = {}) {
  const router = useRouter()
  const [workspaces, setWorkspaces] = React.useState<Workspace[]>([])
  const [workspaceId, setWorkspaceId] = React.useState("")
  const [depositDatasets, setDepositDatasets] = React.useState<DepositDatasetSummary[]>([])
  const [selectedDatasetId, setSelectedDatasetId] = React.useState("")
  const [template, setTemplate] = React.useState("DESCRIPTIVE_STATS")
  const [title, setTitle] = React.useState("")
  const [notes, setNotes] = React.useState("")
  const [submitting, setSubmitting] = React.useState(false)
  const [recentJobs, setRecentJobs] = React.useState<AnalysisJobsPageItem[]>([])

  const TEMPLATES = [
    { id: "DESCRIPTIVE_STATS", label: "Descriptive Statistics", desc: "Mean, median, std, distribution" },
    { id: "CORRELATION_MATRIX", label: "Correlation Matrix", desc: "Pairwise correlations across numeric columns" },
    { id: "MISSING_DATA_REPORT", label: "Missing Data Report", desc: "Null analysis and imputation suggestions" },
    { id: "OUTLIER_DETECTION", label: "Outlier Detection", desc: "IQR and Z-score based anomaly flagging" },
  ]

  const selectedDataset = depositDatasets.find((d) => d.id === selectedDatasetId)

  const loadRecentJobs = React.useCallback(async () => {
    try {
      const data = await listAnalysisJobs({ pageSize: 5, sortBy: "NEWEST" })
      setRecentJobs(data.items)
    } catch {
      // non-fatal
    }
  }, [])

  React.useEffect(() => {
    let mounted = true
    void (async () => {
      try {
        const [wsList, catalog] = await Promise.all([
          getMyWorkspaces(),
          listDepositDatasets({ page: 1, pageSize: 30 }),
        ])
        if (!mounted) return
        setWorkspaces(wsList)
        const preferredWorkspace = pickPreferredWorkspace(wsList)
        if (preferredWorkspace) {
          setWorkspaceId(preferredWorkspace.id)
          saveDatasetWorkspaceId(preferredWorkspace.id)
        }
        setDepositDatasets(catalog.items)
        if (catalog.items.length) setSelectedDatasetId(catalog.items[0].id)
      } catch (error) {
        toast.error((error as Error).message || "Failed to load data")
      }
    })()
    void loadRecentJobs()
    return () => { mounted = false }
  }, [loadRecentJobs])

  const statusColors: Record<string, string> = {
    SUCCEEDED: "text-green-600",
    FAILED: "text-red-500",
    RUNNING: "text-blue-500",
    QUEUED: "text-yellow-600",
    CANCELLED: "text-orange-500",
  }

  return (
    <div className="space-y-3">
      <BackToDatasetsButton onBack={onBack} />
      <div className="grid gap-4 xl:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Launch Analysis</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="space-y-1">
              <label className="text-xs font-medium">Workspace</label>
              <select
                aria-label="Select workspace for analysis"
                className="w-full rounded-md border bg-background px-3 py-2 text-sm"
                value={workspaceId}
                onChange={(e) => {
                  setWorkspaceId(e.target.value)
                  saveDatasetWorkspaceId(e.target.value)
                }}
              >
                {workspaces.map((ws) => (
                  <option key={ws.id} value={ws.id}>{ws.name}</option>
                ))}
              </select>
            </div>

            {/* Dataset picker from deposit catalog */}
            <div className="space-y-1">
              <label className="text-xs font-medium">Source Dataset (Deposit Catalog)</label>
              <select
                aria-label="Select source dataset"
                className="w-full rounded-md border bg-background px-3 py-2 text-sm"
                value={selectedDatasetId}
                onChange={(e) => setSelectedDatasetId(e.target.value)}
              >
                <option value="">Select dataset…</option>
                {depositDatasets.map((d) => (
                  <option key={d.id} value={d.id}>{d.name}</option>
                ))}
              </select>
              {selectedDataset && (
                <div className="rounded-md border bg-muted/40 px-3 py-2 text-xs text-muted-foreground">
                  <span className="font-medium text-foreground">{selectedDataset.name}</span>
                  {" · "}
                  <span className="capitalize">{selectedDataset.accessibility?.toLowerCase() ?? "unknown"}</span>
                  {selectedDataset.domain ? ` · ${selectedDataset.domain}` : ""}
                </div>
              )}
            </div>

            {/* Template selector */}
            <div className="space-y-1">
              <label className="text-xs font-medium">Analysis Template</label>
              <div className="grid gap-2 sm:grid-cols-2">
                {TEMPLATES.map((t) => (
                  <button
                    key={t.id}
                    type="button"
                    onClick={() => setTemplate(t.id)}
                    className={`rounded-lg border p-2.5 text-left text-xs transition ${template === t.id ? "border-primary bg-primary/5" : "hover:bg-muted/40"}`}
                  >
                    <div className="font-medium">{t.label}</div>
                    <div className="mt-0.5 text-muted-foreground">{t.desc}</div>
                  </button>
                ))}
              </div>
            </div>

            <div className="space-y-1">
              <label className="text-xs font-medium">Analysis Title</label>
              <input
                className="w-full rounded-md border bg-background px-3 py-2 text-sm"
                placeholder="e.g. Q3 Metabolic Risk Descriptive Stats"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
              />
            </div>

            <div className="space-y-1">
              <label className="text-xs font-medium">Notes (optional)</label>
              <textarea
                aria-label="Analysis notes"
                className="min-h-16 w-full rounded-md border bg-background px-3 py-2 text-sm resize-none"
                placeholder="Additional context for the analysis run…"
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
              />
            </div>

            <Button
              className="w-full"
              disabled={submitting || !workspaceId || !selectedDatasetId || !title.trim()}
              onClick={async () => {
                setSubmitting(true)
                try {
                  const result = await startDatasetAnalysis({
                    datasetId: selectedDatasetId,
                    templateId: template,
                    title: title.trim(),
                    notes: notes.trim() || undefined,
                    parameters: { workspaceId },
                  })
                  toast.success(`Analysis queued: ${result.jobId}`)
                  setTitle("")
                  setNotes("")
                  await loadRecentJobs()
                } catch (error) {
                  toast.error((error as Error).message || "Failed to launch analysis")
                } finally {
                  setSubmitting(false)
                }
              }}
            >
              {submitting ? "Launching…" : "Launch Analysis"}
            </Button>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle>Recent Analysis Jobs</CardTitle>
              <Button size="sm" variant="ghost" onClick={() => router.push("/dashboard/analysis/jobs")}>
                View All
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            {recentJobs.length === 0 ? (
              <p className="text-sm text-muted-foreground">No analysis jobs yet.</p>
            ) : (
              <div className="space-y-2">
                {recentJobs.map((job) => (
                  <div key={job.id} className="rounded-lg border p-3 text-sm">
                    <div className="flex items-center justify-between gap-2">
                      <span className="font-medium truncate">{job.title}</span>
                      <span className={`text-xs font-semibold shrink-0 ${statusColors[job.status] ?? "text-muted-foreground"}`}>
                        {job.status}
                      </span>
                    </div>
                    <div className="mt-0.5 text-xs text-muted-foreground">
                      {job.templateName}{job.dataset?.name ? ` · ${job.dataset.name}` : ""}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}

function QuickActionPanel({
  title,
  description,
  actions,
}: {
  title: string
  description: string
  actions: Array<{ label: string; href: string; variant?: "default" | "outline" }>
}) {
  const router = useRouter()

  return (
    <Card>
      <CardHeader>
        <CardTitle>{title}</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <p className="text-sm text-muted-foreground">{description}</p>
        <div className="flex flex-wrap gap-2">
          {actions.map((action) => (
            <Button
              key={action.href + action.label}
              variant={action.variant || "default"}
              onClick={() => router.push(action.href)}
            >
              {action.label}
            </Button>
          ))}
        </div>
      </CardContent>
    </Card>
  )
}

function GovernanceAndViewsPanel({ onBack }: { onBack?: () => void } = {}) {
  const [datasets, setDatasets] = React.useState<DepositDatasetSummary[]>([])
  const [savedViews, setSavedViews] = React.useState<DepositSavedView[]>([])
  const [selectedIds, setSelectedIds] = React.useState<string[]>([])
  const [operation, setOperation] = React.useState<"ARCHIVE" | "EXPORT" | "APPLY_GOVERNANCE_POLICY">("EXPORT")
  const [governancePolicy, setGovernancePolicy] = React.useState<"PUBLIC" | "RESTRICTED" | "CONTROLLED">("RESTRICTED")
  const [accessRequestDatasetId, setAccessRequestDatasetId] = React.useState("")
  const [accessRequestJustification, setAccessRequestJustification] = React.useState("Need governed access for analysis workflow")
  const [viewName, setViewName] = React.useState("My Pinned Governance Filter")
  const [pinnedFiltersText, setPinnedFiltersText] = React.useState("domain,accessibility,favoritesOnly")
  const [running, setRunning] = React.useState(false)

  const load = React.useCallback(async () => {
    const [catalog, views] = await Promise.all([
      listDepositDatasets({ page: 1, pageSize: 12 }),
      listDepositSavedViews(),
    ])
    setDatasets(catalog.items)
    setSavedViews(views.items)
    setAccessRequestDatasetId((current) => current || catalog.items[0]?.id || "")
  }, [])

  React.useEffect(() => {
    void load().catch((error) => {
      toast.error((error as Error).message || "Failed to load governance data")
    })
  }, [load])

  return (
    <div className="space-y-3">
      <BackToDatasetsButton onBack={onBack} />
      <div className="grid gap-4 xl:grid-cols-2">
      <Card>
        <CardHeader>
          <CardTitle>Bulk Operations</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="space-y-1">
            <label className="text-xs font-medium">Select Datasets</label>
            <div className="max-h-48 space-y-2 overflow-auto rounded-md border p-3">
              {datasets.map((dataset) => {
                const checked = selectedIds.includes(dataset.id)
                return (
                  <label key={dataset.id} className="flex items-center gap-2 text-sm">
                    <input
                      type="checkbox"
                      checked={checked}
                      onChange={(event) => {
                        setSelectedIds((current) =>
                          event.target.checked
                            ? Array.from(new Set([...current, dataset.id]))
                            : current.filter((id) => id !== dataset.id),
                        )
                      }}
                    />
                    <span>{dataset.name}</span>
                  </label>
                )
              })}
            </div>
          </div>
          <div className="space-y-1">
            <label className="text-xs font-medium">Operation</label>
            <select
              aria-label="Select bulk operation"
              className="w-full rounded-md border bg-background px-3 py-2 text-sm"
              value={operation}
              onChange={(event) => setOperation(event.target.value as "ARCHIVE" | "EXPORT" | "APPLY_GOVERNANCE_POLICY")}
            >
              <option value="EXPORT">Export</option>
              <option value="ARCHIVE">Archive</option>
              <option value="APPLY_GOVERNANCE_POLICY">Apply Governance Policy</option>
            </select>
          </div>
          {operation === "APPLY_GOVERNANCE_POLICY" ? (
            <div className="space-y-1">
              <label className="text-xs font-medium">Governance Policy</label>
              <select
                aria-label="Select governance policy"
                className="w-full rounded-md border bg-background px-3 py-2 text-sm"
                value={governancePolicy}
                onChange={(event) => setGovernancePolicy(event.target.value as "PUBLIC" | "RESTRICTED" | "CONTROLLED")}
              >
                <option value="PUBLIC">Public</option>
                <option value="RESTRICTED">Restricted</option>
                <option value="CONTROLLED">Controlled</option>
              </select>
            </div>
          ) : null}
          <Button
            disabled={running || selectedIds.length === 0}
            onClick={async () => {
              setRunning(true)
              try {
                const result = await bulkDepositOperation({
                  datasetIds: selectedIds,
                  operation,
                  governancePolicy: operation === "APPLY_GOVERNANCE_POLICY" ? governancePolicy : undefined,
                })
                toast.success(`${result.operation} completed for ${result.affectedDatasetIds.length} dataset(s)`)
                await load()
              } catch (error) {
                toast.error((error as Error).message || "Bulk operation failed")
              } finally {
                setRunning(false)
              }
            }}
          >
            Run Bulk Operation
          </Button>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Access Requests</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="space-y-1">
            <label className="text-xs font-medium">Dataset</label>
            <select
              aria-label="Select dataset for access request"
              className="w-full rounded-md border bg-background px-3 py-2 text-sm"
              value={accessRequestDatasetId}
              onChange={(event) => setAccessRequestDatasetId(event.target.value)}
            >
              {datasets.map((dataset) => (
                <option key={dataset.id} value={dataset.id}>{dataset.name}</option>
              ))}
            </select>
          </div>
          <div className="space-y-1">
            <label className="text-xs font-medium">Justification</label>
            <textarea
              aria-label="Access request justification"
              className="min-h-24 w-full rounded-md border bg-background px-3 py-2 text-sm"
              value={accessRequestJustification}
              onChange={(event) => setAccessRequestJustification(event.target.value)}
            />
          </div>
          <Button
            disabled={!accessRequestDatasetId || running}
            onClick={async () => {
              setRunning(true)
              try {
                const result = await createDepositAccessRequest(accessRequestDatasetId, {
                  justification: accessRequestJustification,
                })
                toast.success(`Access request created: ${result.accessRequestId}`)
              } catch (error) {
                toast.error((error as Error).message || "Failed to create access request")
              } finally {
                setRunning(false)
              }
            }}
          >
            Submit Access Request
          </Button>
        </CardContent>
      </Card>

      <Card className="xl:col-span-2">
        <CardHeader>
          <CardTitle>Saved Views & Pinned Filters</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-3 md:grid-cols-3">
            <input
              className="rounded-md border bg-background px-3 py-2 text-sm"
              value={viewName}
              onChange={(event) => setViewName(event.target.value)}
              placeholder="View name"
            />
            <input
              className="rounded-md border bg-background px-3 py-2 text-sm md:col-span-2"
              value={pinnedFiltersText}
              onChange={(event) => setPinnedFiltersText(event.target.value)}
              placeholder="Comma-separated pinned filters"
            />
          </div>
          <div className="flex gap-2">
            <Button
              disabled={!viewName.trim() || running}
              onClick={async () => {
                setRunning(true)
                try {
                  const pinnedFilters = pinnedFiltersText
                    .split(",")
                    .map((item) => item.trim())
                    .filter(Boolean)

                  await createDepositSavedView({
                    name: viewName.trim(),
                    filters: {
                      selectedDatasetIds: selectedIds,
                    },
                    pinnedFilters,
                  })
                  toast.success("Saved view created")
                  await load()
                } catch (error) {
                  toast.error((error as Error).message || "Failed to create saved view")
                } finally {
                  setRunning(false)
                }
              }}
            >
              Save Current View
            </Button>
          </div>

          {savedViews.length ? (
            <div className="space-y-2">
              {savedViews.map((view) => (
                <div key={view.id} className="flex flex-col gap-2 rounded-md border p-3 md:flex-row md:items-center md:justify-between">
                  <div>
                    <div className="font-medium">{view.name}</div>
                    <div className="text-xs text-muted-foreground">
                      Pinned filters: {view.pinnedFilters.join(", ") || "none"}
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => {
                        const ids = Array.isArray(view.filters?.selectedDatasetIds)
                          ? (view.filters.selectedDatasetIds as unknown[]).filter((item): item is string => typeof item === "string")
                          : []
                        setSelectedIds(ids)
                        setPinnedFiltersText(view.pinnedFilters.join(","))
                        toast.success(`Applied view ${view.name}`)
                      }}
                    >
                      Apply
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={async () => {
                        try {
                          await deleteDepositSavedView(view.id)
                          toast.success("Saved view deleted")
                          await load()
                        } catch (error) {
                          toast.error((error as Error).message || "Failed to delete saved view")
                        }
                      }}
                    >
                      Delete
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-sm text-muted-foreground">No saved views yet.</p>
          )}
        </CardContent>
      </Card>
      </div>
    </div>
  )
}

function LineageGraphPanel({ onBack }: { onBack?: () => void } = {}) {
  const [datasets, setDatasets] = React.useState<DepositDatasetSummary[]>([])
  const [datasetId, setDatasetId] = React.useState("")
  const [lineage, setLineage] = React.useState<{
    nodes: Array<{ id: string; label: string; active: boolean }>
    edges: Array<{ from?: string; to: string; relation: string }>
  } | null>(null)
  const svgRef = React.useRef<SVGSVGElement>(null)
  const [nodePositions, setNodePositions] = React.useState<Record<string, { x: number; y: number }>>({})

  React.useEffect(() => {
    let mounted = true
    void (async () => {
      try {
        const data = await listDepositDatasets({ page: 1, pageSize: 20 })
        if (!mounted) return
        setDatasets(data.items)
        setDatasetId((current) => current || data.items[0]?.id || "")
      } catch (error) {
        toast.error((error as Error).message || "Failed to load datasets for lineage")
      }
    })()
    return () => { mounted = false }
  }, [])

  React.useEffect(() => {
    if (!datasetId) {
      setLineage(null)
      return
    }
    void (async () => {
      try {
        const data = await getDepositDatasetLineage(datasetId)
        setLineage({
          nodes: data.nodes.map((node) => ({ id: node.id, label: node.label, active: node.active })),
          edges: data.edges,
        })
      } catch (error) {
        toast.error((error as Error).message || "Failed to load lineage")
      }
    })()
  }, [datasetId])

  // Compute node positions in columns based on topological depth
  React.useEffect(() => {
    if (!lineage || !lineage.nodes.length) {
      setNodePositions({})
      return
    }

    const { nodes, edges } = lineage
    // Build simple depth map: root nodes (no incoming edge) get depth 0
    const depthMap: Record<string, number> = {}
    const targets = new Set(edges.map((e) => e.to))
    nodes.forEach((n) => {
      if (!targets.has(n.id)) depthMap[n.id] = 0
    })

    // BFS to assign depths
    let changed = true
    while (changed) {
      changed = false
      edges.forEach((e) => {
        const fromDepth = e.from != null ? (depthMap[e.from] ?? 0) : 0
        const toDepth = fromDepth + 1
        if (depthMap[e.to] === undefined || depthMap[e.to] < toDepth) {
          depthMap[e.to] = toDepth
          changed = true
        }
      })
    }
    nodes.forEach((n) => { if (depthMap[n.id] === undefined) depthMap[n.id] = 0 })

    // Group nodes by depth
    const cols: Record<number, string[]> = {}
    nodes.forEach((n) => {
      const d = depthMap[n.id] ?? 0
      if (!cols[d]) cols[d] = []
      cols[d].push(n.id)
    })

    const NODE_W = 160
    const NODE_H = 44
    const COL_GAP = 220
    const ROW_GAP = 64
    const positions: Record<string, { x: number; y: number }> = {}

    Object.entries(cols).forEach(([depth, ids]) => {
      const colIndex = Number(depth)
      ids.forEach((id, rowIndex) => {
        positions[id] = {
          x: 24 + colIndex * COL_GAP,
          y: 24 + rowIndex * ROW_GAP,
        }
      })
    })

    setNodePositions(positions)
  }, [lineage])

  const maxX = Math.max(...Object.values(nodePositions).map((p) => p.x), 0) + 200
  const maxY = Math.max(...Object.values(nodePositions).map((p) => p.y), 0) + 80

  const NODE_W = 160
  const NODE_H = 44

  return (
    <div className="space-y-3">
      <BackToDatasetsButton onBack={onBack} />
      <Card>
        <CardHeader>
          <CardTitle>Lineage Graph</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-1">
            <label className="text-xs font-medium">Dataset</label>
            <select
              aria-label="Select dataset for lineage graph"
              className="w-full rounded-md border bg-background px-3 py-2 text-sm"
              value={datasetId}
              onChange={(event) => setDatasetId(event.target.value)}
            >
              {datasets.map((dataset) => (
                <option key={dataset.id} value={dataset.id}>{dataset.name}</option>
              ))}
            </select>
          </div>

          {lineage && lineage.nodes.length > 0 ? (
            <>
              {/* Legend */}
              <div className="flex items-center gap-4 text-xs text-muted-foreground">
                <span className="flex items-center gap-1.5">
                  <span className="inline-block h-px w-8 border-t-2 border-primary" />
                  DERIVED_FROM
                </span>
                <span className="flex items-center gap-1.5">
                  <span className="inline-block h-px w-8 border-t-2 border-dashed border-muted-foreground" />
                  DECLARED_PARENT
                </span>
              </div>

              {/* SVG DAG */}
              <div className="overflow-auto rounded-lg border bg-muted/20 p-2">
                <svg
                  ref={svgRef}
                  width={maxX}
                  height={maxY}
                  style={{ minWidth: maxX, minHeight: maxY }}
                >
                  {/* Arrow marker */}
                  <defs>
                    <marker id="arrow-primary" markerWidth="8" markerHeight="8" refX="7" refY="3" orient="auto">
                      <path d="M0,0 L0,6 L8,3 z" className="fill-primary" fill="currentColor" />
                    </marker>
                    <marker id="arrow-muted" markerWidth="8" markerHeight="8" refX="7" refY="3" orient="auto">
                      <path d="M0,0 L0,6 L8,3 z" fill="#9ca3af" />
                    </marker>
                  </defs>

                  {/* Edges */}
                  {lineage.edges.map((edge, i) => {
                    if (!edge.from) return null
                    const from = nodePositions[edge.from]
                    const to = nodePositions[edge.to]
                    if (!from || !to) return null
                    const isDerived = edge.relation === "DERIVED_FROM"
                    const x1 = from.x + NODE_W
                    const y1 = from.y + NODE_H / 2
                    const x2 = to.x
                    const y2 = to.y + NODE_H / 2
                    const mx = (x1 + x2) / 2
                    return (
                      <path
                        key={i}
                        d={`M ${x1} ${y1} C ${mx} ${y1}, ${mx} ${y2}, ${x2} ${y2}`}
                        fill="none"
                        stroke={isDerived ? "hsl(var(--primary))" : "#9ca3af"}
                        strokeWidth="1.5"
                        strokeDasharray={isDerived ? undefined : "5,3"}
                        markerEnd={isDerived ? "url(#arrow-primary)" : "url(#arrow-muted)"}
                      />
                    )
                  })}

                  {/* Nodes */}
                  {lineage.nodes.map((node) => {
                    const pos = nodePositions[node.id]
                    if (!pos) return null
                    return (
                      <g key={node.id} transform={`translate(${pos.x},${pos.y})`}>
                        <rect
                          width={NODE_W}
                          height={NODE_H}
                          rx="8"
                          ry="8"
                          fill={node.active ? "hsl(var(--primary)/0.12)" : "hsl(var(--muted))"}
                          stroke={node.active ? "hsl(var(--primary))" : "hsl(var(--border))"}
                          strokeWidth={node.active ? 2 : 1}
                        />
                        <text
                          x={NODE_W / 2}
                          y={NODE_H / 2 + 1}
                          textAnchor="middle"
                          dominantBaseline="middle"
                          fontSize="11"
                          fontWeight={node.active ? "600" : "400"}
                          fill={node.active ? "hsl(var(--primary))" : "hsl(var(--foreground))"}
                          className="select-none"
                        >
                          {node.label.length > 22 ? node.label.slice(0, 21) + "…" : node.label}
                        </text>
                      </g>
                    )
                  })}
                </svg>
              </div>

              <p className="text-xs text-muted-foreground">
                {lineage.nodes.length} node{lineage.nodes.length !== 1 ? "s" : ""} ·{" "}
                {lineage.edges.length} edge{lineage.edges.length !== 1 ? "s" : ""}
              </p>
            </>
          ) : (
            <p className="text-sm text-muted-foreground">No lineage loaded or no nodes available.</p>
          )}
        </CardContent>
      </Card>
    </div>
  )
}

export function DatasetsFlowShell() {
  const [active, setActive] = React.useState<DatasetFlowKey>("library")

  return (
    <div className="space-y-6 p-6">
      <div className="space-y-1">
        <h1 className="text-3xl font-semibold tracking-tight">Datasets</h1>
        <p className="text-sm text-muted-foreground">
          Unified datasets flow covering library, catalog, workspace assets, cohort workflows, operations, analysis, lineage, governance, and favorites.
        </p>
      </div>

      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-base">Data Management Unique Views</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <p className="text-sm text-muted-foreground">
            Lifecycle-focused dataset ownership views from registry through lineage and catalog.
          </p>
          <div className="grid gap-2 sm:grid-cols-2 xl:grid-cols-4">
            {[
              { label: "Dataset Registry", href: "/dashboard/datasets?view=registry" },
              { label: "Raw Datasets", href: "/dashboard/datasets?view=raw" },
              { label: "Clean Datasets", href: "/dashboard/datasets?view=clean" },
              { label: "Harmonized Datasets", href: "/dashboard/datasets?view=harmonized" },
              { label: "Feature Sets", href: "/dashboard/datasets?view=features" },
              { label: "Dataset Lineage", href: "/dashboard/datasets?view=lineage" },
              { label: "Data Catalog", href: "/dashboard/datasets?view=catalog" },
            ].map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className="rounded-lg border px-3 py-2 text-sm text-foreground transition hover:bg-muted/40"
              >
                {item.label}
              </Link>
            ))}
          </div>
        </CardContent>
      </Card>

      <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
        {FLOW_ITEMS.map((item) => {
          const Icon = item.icon
          const selected = active === item.key
          return (
            <button
              key={item.key}
              type="button"
              onClick={() => setActive(item.key)}
              className={`rounded-xl border p-4 text-left transition ${selected ? "border-primary bg-primary/5" : "hover:bg-muted/40"}`}
            >
              <div className="flex items-center gap-2">
                <Icon className="h-4 w-4" />
                <span className="font-medium">{item.title}</span>
              </div>
              <p className="mt-2 text-sm text-muted-foreground">{item.subtitle}</p>
            </button>
          )
        })}
      </div>

      <Tabs value={active} onValueChange={(value) => setActive(value as DatasetFlowKey)}>
        <TabsList className="h-auto w-full flex-wrap justify-start gap-2 rounded-xl bg-transparent p-0">
          {FLOW_ITEMS.map((item) => (
            <TabsTrigger key={item.key} value={item.key} className="rounded-lg border data-[state=active]:border-primary data-[state=active]:bg-primary/10">
              {item.title}
            </TabsTrigger>
          ))}
        </TabsList>
      </Tabs>

      {active === "library" ? <DatasetsPageView embedded /> : null}
      {active === "deposit" ? <DataDepositClient onBackToDatasets={() => setActive("library")} /> : null}
      {active === "workspace" ? <WorkspaceDatasetsPanel onBack={() => setActive("library")} /> : null}
      {active === "cohort" ? <CohortBuilderPanel onBack={() => setActive("library")} /> : null}
      {active === "operations" ? <DataOperationsPanel onBack={() => setActive("library")} /> : null}
      {active === "analysis" ? (
        <AnalysisLauncherPanel onBack={() => setActive("library")} />
      ) : null}
      {active === "lineage" ? (
        <LineageGraphPanel onBack={() => setActive("library")} />
      ) : null}
      {active === "governance" ? (
        <div className="space-y-4">
          <div className="flex items-center gap-2">
            <Badge variant="secondary">RBAC Active</Badge>
            <span className="text-sm text-muted-foreground">Deposit view, preview, pull, and favorite actions are permission-guarded.</span>
          </div>
          <QuickActionPanel
            title="Access & Governance"
            description="Use governance control center for role, access request, and audit controls; dataset deposit actions enforce permission checks server-side."
            actions={[
              { label: "Open Governance Center", href: "/admin/governance" },
              { label: "Open Data Deposit", href: "/dashboard/data-deposit", variant: "outline" },
            ]}
          />
          <GovernanceAndViewsPanel onBack={() => setActive("library")} />
        </div>
      ) : null}
      {active === "favorites" ? <FavoritesPanel onBack={() => setActive("library")} /> : null}
    </div>
  )
}
