"use client"

import { useState } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { useMutation, useQuery } from "@tanstack/react-query"
import { ArrowRight, BarChart3, ClipboardCheck, GitBranch, RefreshCcw, ShieldCheck, Sparkles, Wrench } from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Progress } from "@/components/ui/progress"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { dataPreparationApi, type PrepStage } from "@/lib/api/data-preparation"

const stageConfig = {
  profiling: {
    title: "Data Profiling",
    icon: BarChart3,
    subtitle: "Profile rows, columns, types, missingness, outliers, distributions, duplicates, and schema drift before cleaning.",
    previous: "Dataset Registry",
    current: "Data Profiling",
    next: "Cleaning & Wrangling",
    primaryAction: "Run Profiling",
    metrics: [["Rows scanned", "12.8k"], ["Columns profiled", "84"], ["Missingness", "7.4%"], ["Duplicates", "312"]],
    leftTitle: "Column Profile Summary",
    rightTitle: "Distribution & Quality Signals",
    rows: [
      ["age", "integer", "0%", "mean 70.0 / std 12.4", "Ready"],
      ["income_level", "category", "1.3%", "Low 41%, Mid 37%, High 22%", "Review"],
      ["housing_instability", "boolean", "2.1%", "Yes 29%, No 71%", "Ready"],
      ["readmission_30d", "boolean", "0%", "True 18%, False 82%", "Ready"],
    ],
    insight: ["Age distribution is right-skewed", "Income has low missingness", "312 duplicate patient IDs detected"],
  },
  cleaning: {
    title: "Cleaning & Wrangling",
    icon: Wrench,
    subtitle: "Apply imputation, deduplication, type normalization, value standardization, and outlier treatment.",
    previous: "Data Profiling",
    current: "Cleaning & Wrangling",
    next: "Clean Datasets",
    primaryAction: "Run Cleaning",
    metrics: [["Rules", "24"], ["Records cleaned", "12.5k"], ["Missing after", "1.8%"], ["Duplicates after", "0"]],
    leftTitle: "Cleaning Rules",
    rightTitle: "Before to After Impact",
    rows: [
      ["Missingness imputation", "income_level", "7.4%", "1.8%", "Passed"],
      ["Duplicate removal", "patient_id", "312", "0", "Passed"],
      ["Type normalization", "date/numeric fields", "18 issues", "0 issues", "Passed"],
      ["Outlier winsorization", "cost", "3.8%", "0.7%", "Ready"],
    ],
    insight: ["Rows are deduplicated by patient_id", "Income imputed using cohort median and mode rules", "Numeric outliers capped at configurable percentile"],
  },
  harmonization: {
    title: "Harmonization",
    icon: GitBranch,
    subtitle: "Map synonymous fields and terminology into canonical research variables across clinical, claims, SDOH, and public sources.",
    previous: "Clean Datasets",
    current: "Harmonization",
    next: "Harmonized Datasets",
    primaryAction: "Run Harmonization",
    metrics: [["Sources aligned", "4"], ["Variables mapped", "126"], ["Ontology links", "39"], ["Interop score", "91%"]],
    leftTitle: "Variable Mapping Workbench",
    rightTitle: "Canonical Model",
    rows: [
      ["sex / gender / patient_sex", "gender", "Demographic", "OMOP Person", "Mapped"],
      ["zip / postal_code", "zip_code", "Geography", "Census", "Mapped"],
      ["housing / unstable_home", "housing_instability", "SDOH", "Gravity SDOH", "Mapped"],
      ["dx_code / diagnosis", "diagnosis_code", "Clinical", "ICD-10", "Review"],
    ],
    insight: ["Terminology normalized to canonical vocabulary", "Clinical and SDOH fields are cross-source aligned", "Review remaining diagnosis mappings"],
  },
  features: {
    title: "Feature Engineering Studio",
    icon: Sparkles,
    subtitle: "Curate reusable machine-learning feature sets for readmission, mortality, SDOH vulnerability, policy, and equity models.",
    previous: "Harmonized Datasets",
    current: "Feature Sets",
    next: "Analysis Studio",
    primaryAction: "Generate Features",
    metrics: [["Feature sets", "12"], ["Generated features", "236"], ["Reusable features", "89"], ["Top importance", "Housing"]],
    leftTitle: "ML Feature Registry",
    rightTitle: "Feature Importance",
    rows: [
      ["Readmission Risk", "42", "readmission_30d", "Logistic, XGBoost", "0.87 AUC"],
      ["SDOH Vulnerability", "31", "risk_score", "Random Forest", "0.82 AUC"],
      ["Cost Burden", "26", "cost", "Regression", "0.79 R^2"],
      ["Equity Gap", "18", "disparity_index", "Causal Forest", "Ready"],
    ],
    insight: ["Housing instability is the strongest reusable feature", "Feature sets are linked to model registry", "Ready to send to Analysis Studio"],
  },
  quality: {
    title: "Quality Validation",
    icon: ShieldCheck,
    subtitle: "Score completeness, consistency, validity, uniqueness, accuracy, timeliness, and analysis readiness.",
    previous: "Feature Engineering",
    current: "Quality Validation",
    next: "Dataset Versioning",
    primaryAction: "Validate Quality",
    metrics: [["Completeness", "98%"], ["Consistency", "94%"], ["Validity", "96%"], ["Readiness", "Approved"]],
    leftTitle: "Quality Dimensions",
    rightTitle: "Validation Failures",
    rows: [
      ["Completeness", "All columns", "92.6%", "98.2%", "Passed"],
      ["Uniqueness", "patient_id", "97.5%", "100%", "Passed"],
      ["Validity", "age, dates, outcomes", "94%", "96%", "Passed"],
      ["Timeliness", "source freshness", "85%", "90%", "Review"],
    ],
    insight: ["Dataset is analysis-ready", "Timeliness has minor stale source warnings", "Quality report should be attached to publication appendix"],
  },
  versions: {
    title: "Dataset Versioning",
    icon: RefreshCcw,
    subtitle: "Compare dataset versions, track schema changes, row changes, data quality changes, and release readiness.",
    previous: "Quality Validation",
    current: "Dataset Versioning",
    next: "Dataset Registry",
    primaryAction: "Save Release Version",
    metrics: [["Current version", "v1.3"], ["Prior version", "v1.2"], ["Rows changed", "2.1k"], ["Release", "Ready"]],
    leftTitle: "Version History",
    rightTitle: "Schema Diff",
    rows: [
      ["v1.3", "Added feature set and quality validation report", "+2,100 rows", "+8 columns", "Ready"],
      ["v1.2", "Harmonized claims and SDOH variables", "+12,000 rows", "+22 columns", "Released"],
      ["v1.1", "Cleaning and deduplication", "-312 rows", "+0 columns", "Released"],
      ["v1.0", "Raw import from Database Studio", "12,842 rows", "84 columns", "Archived"],
    ],
    insight: ["v1.3 is ready to publish to Dataset Registry", "Schema diff is audit-ready", "Version can be locked before analysis"],
  },
} satisfies Record<PrepStage, {
  title: string
  icon: typeof BarChart3
  subtitle: string
  previous: string
  current: string
  next: string
  primaryAction: string
  metrics: string[][]
  leftTitle: string
  rightTitle: string
  rows: string[][]
  insight: string[]
}>

const flowTiles = ["Database Studio", "Dataset Registry", "Profiling", "Cleaning", "Harmonization", "Feature Sets"]
const stageOrder: PrepStage[] = ["profiling", "cleaning", "harmonization", "features", "quality", "versions"]
const stageRoute: Record<PrepStage, string> = {
  profiling: "/dashboard/data-preparation/profiling",
  cleaning: "/dashboard/data-preparation/cleaning",
  harmonization: "/dashboard/data-preparation/harmonization",
  features: "/dashboard/data-preparation/feature-engineering",
  quality: "/dashboard/data-preparation/quality-validation",
  versions: "/dashboard/data-preparation/versioning",
}

function asPrepStage(value: string): PrepStage | null {
  if (value === "profiling" || value === "cleaning" || value === "harmonization" || value === "features" || value === "quality" || value === "versions") {
    return value
  }
  return null
}

export function DataPreparationPage({ stage }: { stage: PrepStage }) {
  const router = useRouter()
  const searchParams = useSearchParams()
  const datasetId = searchParams.get("datasetId") ?? "sdoh-demo"
  const [message, setMessage] = useState("Ready")
  const [suggestedNextStage, setSuggestedNextStage] = useState<PrepStage | null>(null)
  const config = stageConfig[stage]
  const Icon = config.icon

  const stageOverview = useQuery({
    queryKey: ["data-preparation-stage", stage, datasetId],
    queryFn: () => dataPreparationApi.stage(stage, datasetId),
  })

  const runStage = useMutation({
    mutationFn: () => dataPreparationApi.runStage(stage, datasetId),
    onSuccess: (result) => {
      const next = asPrepStage(result.nextStage)
      setSuggestedNextStage(next)
      setMessage(`run completed for ${config.title}. Next stage: ${result.nextStage}`)
      stageOverview.refetch()
    },
    onError: (error) => {
      setMessage(error instanceof Error ? error.message : "Run failed")
    },
  })

  const previewStage = useMutation({
    mutationFn: () => dataPreparationApi.previewChanges(stage, datasetId),
    onSuccess: (result) => {
      const next = asPrepStage(result.nextStage)
      setSuggestedNextStage(next)
      setMessage(`Preview generated. Suggested next stage: ${result.nextStage}`)
      stageOverview.refetch()
    },
    onError: (error) => {
      setMessage(error instanceof Error ? error.message : "Preview failed")
    },
  })

  const saveStageVersion = useMutation({
    mutationFn: () => dataPreparationApi.saveVersion(stage, datasetId),
    onSuccess: (result) => {
      const next = asPrepStage(result.nextStage)
      setSuggestedNextStage(next)
      setMessage(`Version ${result.version} saved. Next stage: ${result.nextStage}`)
      stageOverview.refetch()
    },
    onError: (error) => {
      setMessage(error instanceof Error ? error.message : "Save version failed")
    },
  })

  const currentIndex = stageOrder.indexOf(stage)
  const previousStage = currentIndex > 0 ? stageOrder[currentIndex - 1] : null
  const defaultNextStage = currentIndex < stageOrder.length - 1 ? stageOrder[currentIndex + 1] : null

  function navigateToStage(nextStage: PrepStage) {
    router.push(`${stageRoute[nextStage]}?datasetId=${encodeURIComponent(datasetId)}`)
  }

  async function run(action: "run" | "preview" | "save") {
    setMessage(`${action} started...`)
    if (action === "run") await runStage.mutateAsync()
    if (action === "preview") await previewStage.mutateAsync()
    if (action === "save") await saveStageVersion.mutateAsync()
  }

  return (
    <div className="space-y-6 p-6">
      <Card className="rounded-3xl shadow-sm">
        <CardContent className="p-8">
          <div className="flex items-start justify-between gap-6">
            <div className="flex gap-4">
              <div className="grid h-14 w-14 place-items-center rounded-2xl bg-slate-950 text-white">
                <Icon className="h-6 w-6" />
              </div>
              <div>
                <Badge variant="secondary">Data Preparation</Badge>
                <h1 className="mt-3 text-4xl font-bold">{config.title}</h1>
                <p className="mt-2 max-w-4xl text-slate-600">{config.subtitle}</p>
              </div>
            </div>
            <Button className="bg-slate-950 hover:bg-slate-800">
              Send Forward
              <ArrowRight className="ml-2 h-4 w-4" />
            </Button>
          </div>
          <div className="mt-8 grid gap-4 md:grid-cols-2 xl:grid-cols-4">
            {config.metrics.map((metric) => (
              <Card key={metric[0]}>
                <CardContent className="p-5">
                  <div className="text-xs uppercase text-slate-500">{metric[0]}</div>
                  <div className="mt-2 text-2xl font-bold">{metric[1]}</div>
                </CardContent>
              </Card>
            ))}
          </div>

          <div className="mt-4 flex flex-wrap gap-2 text-xs text-slate-600">
            <span className="rounded-full border border-blue-200 bg-blue-50 px-2.5 py-1 text-blue-700">Stage Result</span>
            <span className="rounded-full border border-blue-200 bg-blue-50 px-2.5 py-1 text-blue-700">Lineage Event</span>
            <span className="rounded-full border border-blue-200 bg-blue-50 px-2.5 py-1 text-blue-700">Audit Event</span>
            <span className="rounded-full border border-emerald-200 bg-emerald-50 px-2.5 py-1 text-emerald-700">Downstream Handoff State</span>
          </div>
        </CardContent>
      </Card>

      <Card className="rounded-3xl">
        <CardContent className="grid gap-4 p-5 md:grid-cols-3">
          <StageCard label="Previous stage" value={config.previous} />
          <StageCard label="Current stage" value={config.current} active />
          <StageCard label="Next stage" value={config.next} />
        </CardContent>
      </Card>

      <Card className="rounded-3xl">
        <CardHeader><CardTitle>Workflow Status</CardTitle></CardHeader>
        <CardContent className="grid gap-3 md:grid-cols-4">
          <div className="rounded-xl border p-3"><p className="text-xs text-slate-500">Dataset ID</p><p className="text-sm font-semibold text-slate-900">{datasetId}</p></div>
          <div className="rounded-xl border p-3"><p className="text-xs text-slate-500">Current Stage</p><p className="text-sm font-semibold text-slate-900">{stageOverview.data?.currentStage ?? stage}</p></div>
          <div className="rounded-xl border p-3"><p className="text-xs text-slate-500">Next Stage</p><p className="text-sm font-semibold text-slate-900">{stageOverview.data?.nextStage ?? defaultNextStage ?? "analysis-studio"}</p></div>
          <div className="rounded-xl border p-3"><p className="text-xs text-slate-500">Status</p><p className="text-sm font-semibold text-slate-900">{stageOverview.isLoading ? "loading" : stageOverview.data?.status ?? "ready"}</p></div>
        </CardContent>
      </Card>

      <Card className="rounded-2xl border-0 shadow-sm">
        <CardHeader className="pb-3"><CardTitle className="text-lg">Stage Handoff</CardTitle></CardHeader>
        <CardContent className="grid gap-4 md:grid-cols-2">
          <div className="rounded-xl border border-blue-200 bg-blue-50 p-3">
            <p className="text-xs font-semibold uppercase tracking-wide text-blue-700">Input Contract</p>
            <p className="mt-1 text-sm text-blue-950">Dataset Registry / Raw Datasets and prior preparation stage outputs.</p>
          </div>
          <div className="rounded-xl border border-emerald-200 bg-emerald-50 p-3">
            <p className="text-xs font-semibold uppercase tracking-wide text-emerald-700">Output Contract</p>
            <p className="mt-1 text-sm text-emerald-950">{stage === "versions" ? "Research Studio intake payload" : `${config.next} ready payload`} with audit and lineage metadata.</p>
          </div>
        </CardContent>
      </Card>

      <div className="grid gap-6 xl:grid-cols-3">
        <Card className="xl:col-span-2 rounded-3xl">
          <CardHeader><CardTitle>{config.leftTitle}</CardTitle></CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  {stage === "profiling"
                    ? ["Column", "Type", "Missing", "Profile", "Status"].map((header) => <TableHead key={header}>{header}</TableHead>)
                    : ["Rule / Item", "Target", "Before", "After", "Status"].map((header) => <TableHead key={header}>{header}</TableHead>)}
                </TableRow>
              </TableHeader>
              <TableBody>
                {config.rows.map((row, rowIndex) => (
                  <TableRow key={`${stage}-${rowIndex}`}>
                    {row.map((cell, cellIndex) => (
                      <TableCell key={`${stage}-${rowIndex}-${cellIndex}`}>
                        {cellIndex === 4 ? <Badge variant="outline">{cell}</Badge> : cell}
                      </TableCell>
                    ))}
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
        <Card className="rounded-3xl">
          <CardHeader><CardTitle>{config.rightTitle}</CardTitle></CardHeader>
          <CardContent className="space-y-4">
            {config.insight.map((insight, index) => (
              <div key={insight} className="rounded-xl border p-3">
                <div className="font-medium">{insight}</div>
                <Progress value={90 - index * 12} className="mt-3" />
              </div>
            ))}
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-6 xl:grid-cols-3">
        <Card className="xl:col-span-2 rounded-3xl">
          <CardHeader><CardTitle>Flow wiring</CardTitle></CardHeader>
          <CardContent className="grid gap-2 text-sm md:grid-cols-3 xl:grid-cols-6">
            {flowTiles.map((tile) => (
              <div
                key={tile}
                className={`rounded-xl border p-3 text-center ${tile.toLowerCase().includes(stage === "features" ? "feature" : stage) ? "border-blue-300 bg-blue-50" : ""}`}
              >
                {tile}
              </div>
            ))}
          </CardContent>
        </Card>
        <Card className="rounded-3xl">
          <CardHeader><CardTitle>Stage Actions</CardTitle></CardHeader>
          <CardContent className="space-y-3">
            <Button onClick={() => run("run")} variant="outline" className="w-full justify-start" disabled={runStage.isPending || previewStage.isPending || saveStageVersion.isPending}>{config.primaryAction}</Button>
            <Button onClick={() => run("preview")} variant="outline" className="w-full justify-start" disabled={runStage.isPending || previewStage.isPending || saveStageVersion.isPending}>Preview Changes</Button>
            <Button onClick={() => run("save")} variant="outline" className="w-full justify-start" disabled={runStage.isPending || previewStage.isPending || saveStageVersion.isPending}>Save Version</Button>
            {previousStage && <Button onClick={() => navigateToStage(previousStage)} variant="outline" className="w-full justify-start">Go to Previous Stage</Button>}
            {(suggestedNextStage ?? defaultNextStage) && (
              <Button onClick={() => navigateToStage((suggestedNextStage ?? defaultNextStage) as PrepStage)} className="w-full justify-start bg-slate-950 text-white hover:bg-slate-800">
                Go to Next Stage
              </Button>
            )}
            <div className="rounded-xl bg-slate-50 p-3 text-sm text-slate-600">{message}</div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}

function StageCard({ label, value, active = false }: { label: string; value: string; active?: boolean }) {
  return (
    <div className={`rounded-2xl border p-4 ${active ? "border-blue-300 bg-blue-50" : ""}`}>
      <div className="text-xs uppercase text-slate-500">{label}</div>
      <div className="mt-1 font-bold">{value}</div>
    </div>
  )
}
