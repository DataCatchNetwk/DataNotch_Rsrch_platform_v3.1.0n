"use client"

import { AlertCircle, ArrowRight, BarChart3, BookOpen, CheckCircle2, Database, FileText, GitBranch, Loader2, ShieldCheck, Sparkles } from "lucide-react"

import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { useDatasetResearchLifecycle } from "@/hooks/use-dataset-research-lifecycle"
import { cn } from "@/lib/utils"

function statusTone(status: string) {
  return status === "ready" ? "border-emerald-200 bg-emerald-50 text-emerald-800" : "border-amber-200 bg-amber-50 text-amber-800"
}

function stageTone(state: string) {
  if (state === "completed") {
    return "border-emerald-200 bg-emerald-50 text-emerald-800"
  }

  if (state === "current") {
    return "border-primary bg-primary text-primary-foreground shadow-sm"
  }

  return "border-border bg-muted/40 text-muted-foreground"
}

export function DatasetLifecycleWorkspace({ datasetId }: { datasetId: string }) {
  const { data, isLoading, isError, refetch } = useDatasetResearchLifecycle(datasetId)

  if (isLoading) {
    return (
      <Card>
        <CardContent className="flex items-center gap-3 py-8 text-sm text-muted-foreground">
          <Loader2 className="h-4 w-4 animate-spin" />
          Loading enterprise research lifecycle...
        </CardContent>
      </Card>
    )
  }

  if (isError || !data) {
    return (
      <Card className="border-amber-200 bg-amber-50/60">
        <CardContent className="flex flex-col gap-3 py-6 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-start gap-3">
            <AlertCircle className="mt-0.5 h-4 w-4 text-amber-700" />
            <div>
              <p className="font-medium text-amber-950">Lifecycle workspace unavailable</p>
              <p className="text-sm text-amber-800">Dataset details still work, but the enterprise orchestration contract did not load.</p>
            </div>
          </div>
          <Button variant="outline" size="sm" onClick={() => refetch()}>
            Retry
          </Button>
        </CardContent>
      </Card>
    )
  }

  const resultMetrics = data.resultObject?.metrics ?? {}
  const metricEntries = Object.entries(resultMetrics).slice(0, 4)

  return (
    <div className="space-y-4">
      <Card className="overflow-hidden">
        <CardHeader className="border-b bg-muted/20">
          <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
            <div>
              <CardTitle className="flex items-center gap-2 text-xl">
                <Database className="h-5 w-5 text-primary" />
                Dataset Research Lifecycle
              </CardTitle>
              <p className="mt-1 text-sm text-muted-foreground">
                Data acquisition, profiling, validation, cohort readiness, analysis, publication, export, and archive in one governed flow.
              </p>
            </div>
            <Badge variant="outline" className="w-fit border-primary/30 bg-primary/5 px-3 py-1 text-primary">
              {data.lifecycle.status.replaceAll("_", " ")}
            </Badge>
          </div>
        </CardHeader>
        <CardContent className="space-y-5 p-5">
          <div className="grid gap-3 md:grid-cols-4">
            <div className="rounded-xl border bg-background p-4">
              <p className="text-xs uppercase text-muted-foreground">Active Study Dataset</p>
              <p className="mt-1 font-semibold">{data.dataset.name}</p>
              <p className="text-xs text-muted-foreground">Version {data.dataset.version}</p>
            </div>
            <div className="rounded-xl border bg-background p-4">
              <p className="text-xs uppercase text-muted-foreground">Records</p>
              <p className="mt-1 text-2xl font-semibold">{data.dataset.records.toLocaleString()}</p>
              <p className="text-xs text-muted-foreground">{data.dataset.variables.toLocaleString()} variables</p>
            </div>
            <div className="rounded-xl border bg-background p-4">
              <p className="text-xs uppercase text-muted-foreground">Workspace</p>
              <p className="mt-1 font-semibold">{data.dataset.workspace ?? "Unassigned"}</p>
              <p className="text-xs text-muted-foreground">{data.dataset.owner || "Owner pending"}</p>
            </div>
            <div className="rounded-xl border bg-background p-4">
              <p className="text-xs uppercase text-muted-foreground">Missingness</p>
              <p className="mt-1 text-2xl font-semibold">{Math.round(data.dataset.missingness * 1000) / 10}%</p>
              <p className="text-xs text-muted-foreground">{data.dataset.domain ?? "General"} domain</p>
            </div>
          </div>

          <div className="grid gap-2 lg:grid-cols-8">
            {data.lifecycle.stages.map((stage) => (
              <div key={stage.status} className={cn("rounded-xl border px-3 py-3 text-center text-xs font-semibold", stageTone(stage.state))}>
                {stage.label}
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      <div className="grid gap-4 xl:grid-cols-[1.1fr_0.9fr]">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <GitBranch className="h-4 w-4 text-primary" />
              Data Hub
            </CardTitle>
          </CardHeader>
          <CardContent className="grid gap-3 sm:grid-cols-2">
            {data.dataHub.map((item) => (
              <div key={item.key} className="rounded-xl border p-4">
                <div className="flex items-center justify-between gap-2">
                  <p className="font-medium">{item.title}</p>
                  <span className={cn("rounded-full border px-2 py-0.5 text-xs font-medium", statusTone(item.status))}>
                    {item.status}
                  </span>
                </div>
                <p className="mt-2 text-sm text-muted-foreground">{item.detail}</p>
              </div>
            ))}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <BarChart3 className="h-4 w-4 text-primary" />
              Analytics Builder
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-3">
              {data.analyticsBuilder.steps.map((step) => (
                <div key={step.step} className="flex gap-3 rounded-xl border p-3">
                  <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-primary text-xs font-semibold text-primary-foreground">
                    {step.step}
                  </span>
                  <div>
                    <p className="font-medium">{step.title}</p>
                    <p className="text-sm text-muted-foreground">{step.value}</p>
                  </div>
                </div>
              ))}
            </div>
            <div>
              <p className="mb-2 text-sm font-medium">Analysis routing library</p>
              <div className="flex flex-wrap gap-2">
                {data.analyticsBuilder.availableAnalyses.slice(0, 10).map((analysis) => (
                  <Badge key={analysis} variant="outline" className="bg-muted/40">
                    {analysis}
                  </Badge>
                ))}
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-4 xl:grid-cols-3">
        <Card className="xl:col-span-2">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <Sparkles className="h-4 w-4 text-primary" />
              Results Workspace
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {data.resultObject ? (
              <>
                <div className="flex flex-col gap-3 rounded-xl border bg-muted/20 p-4 sm:flex-row sm:items-center sm:justify-between">
                  <div>
                    <p className="font-semibold">{data.resultObject.title}</p>
                    <p className="text-sm text-muted-foreground">{data.resultObject.analysisType} | {data.resultObject.status}</p>
                  </div>
                  <Button variant="outline" size="sm">
                    View Result Object
                    <ArrowRight className="ml-2 h-3.5 w-3.5" />
                  </Button>
                </div>
                <div className="grid gap-3 sm:grid-cols-2">
                  {metricEntries.length ? (
                    metricEntries.map(([key, value]) => (
                      <div key={key} className="rounded-xl border p-3">
                        <p className="text-xs uppercase text-muted-foreground">{key}</p>
                        <p className="mt-1 font-semibold">{typeof value === "object" ? "Available" : String(value)}</p>
                      </div>
                    ))
                  ) : (
                    <div className="rounded-xl border p-3 text-sm text-muted-foreground">
                      Result metrics are stored, but no scalar summary fields were detected.
                    </div>
                  )}
                </div>
              </>
            ) : (
              <div className="rounded-xl border border-dashed p-6 text-sm text-muted-foreground">
                No result object yet. Launch an analysis to generate metrics, visualizations, interpretation, publication outputs, and exports from one governed record.
              </div>
            )}
            <div className="rounded-xl border bg-primary/5 p-4">
              <p className="font-medium">AI Interpretation Layer</p>
              <p className="mt-1 text-sm text-muted-foreground">{data.interpretation}</p>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <ShieldCheck className="h-4 w-4 text-primary" />
              Auto Visualization Routing
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <p className="text-sm text-muted-foreground">
              Source: <span className="font-medium text-foreground">{data.visualizationRouting.source}</span>
            </p>
            {data.visualizationRouting.recommended.map((chart) => (
              <div key={chart} className="flex items-center gap-2 rounded-xl border p-3 text-sm">
                <CheckCircle2 className="h-4 w-4 text-emerald-600" />
                {chart}
              </div>
            ))}
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-4 xl:grid-cols-[0.9fr_1.1fr]">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <BookOpen className="h-4 w-4 text-primary" />
              Publication Engine
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex flex-wrap gap-2">
              {data.publicationFlow.templates.map((template) => (
                <Badge key={template} variant="outline" className="bg-background">
                  {template}
                </Badge>
              ))}
            </div>
            <div className="space-y-2">
              {data.publicationFlow.reports.length ? (
                data.publicationFlow.reports.map((report) => (
                  <div key={report.id} className="rounded-xl border p-3">
                    <p className="font-medium">{report.title}</p>
                    <p className="text-xs text-muted-foreground">{report.type} | {report.status}</p>
                  </div>
                ))
              ) : (
                <p className="rounded-xl border border-dashed p-4 text-sm text-muted-foreground">
                  Publication reports will appear here after result objects are approved.
                </p>
              )}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <FileText className="h-4 w-4 text-primary" />
              Workspace Lifecycle Orchestration
            </CardTitle>
          </CardHeader>
          <CardContent className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
            {data.workspaceLifecycle.map((group) => (
              <div key={group.area} className="rounded-xl border p-4">
                <p className="font-medium">{group.area}</p>
                <ul className="mt-2 space-y-1 text-sm text-muted-foreground">
                  {group.items.map((item) => (
                    <li key={item} className="flex items-center gap-2">
                      <span className="h-1.5 w-1.5 rounded-full bg-primary" />
                      {item}
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
