"use client";

import { useMemo, useState, type ReactNode } from "react";
import Link from "next/link";
import { useMutation, useQuery } from "@tanstack/react-query";
import {
  Activity,
  ArrowRight,
  BarChart3,
  BookOpen,
  BrainCircuit,
  CheckCircle2,
  Database,
  FileSearch,
  GitBranch,
  Network,
  Search,
  ShieldCheck,
  Sparkles,
  Table2,
  Wrench,
} from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  datasetRegistryApi,
  type DatasetLineagePayload,
  type DatasetRegistryItem,
  type DatasetRegistryStage,
} from "@/src/lib/api/dataset-registry";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

export type DatasetLifecycleStage =
  | "raw"
  | "clean"
  | "harmonized"
  | "features"
  | "lineage"
  | "catalog"
  | "profiling"
  | "cleaning"
  | "harmonization"
  | "quality"
  | "versions";

type StageConfig = {
  eyebrow: string;
  title: string;
  description: string;
  previous: string;
  current: string;
  next: string;
  nextHref: string;
  metrics: Array<{ label: string; value: string; sub: string }>;
  actions: string[];
  tableTitle: string;
  columns: string[];
  rows: string[][];
};

const stageConfig: Record<DatasetLifecycleStage, StageConfig> = {
  raw: {
    eyebrow: "Dataset Registry",
    title: "Raw Dataset Inventory",
    description: "Inventory newly ingested files, folders, ZIP archives, APIs, and repository imports before quality validation.",
    previous: "Data Sources",
    current: "Raw Datasets",
    next: "Cleaning & Wrangling",
    nextHref: "/dashboard/datasets?prep=cleaning",
    metrics: [
      { label: "Raw Datasets", value: "6", sub: "registered" },
      { label: "Import Queue", value: "4", sub: "pending validation" },
      { label: "Storage Size", value: "3.8 GB", sub: "raw assets" },
      { label: "Validation", value: "2", sub: "schema checks needed" },
    ],
    actions: ["Profile Dataset", "Validate Dataset", "Send To Cleaning", "Archive"],
    tableTitle: "Raw Dataset Queue",
    columns: ["Dataset", "Source", "Rows", "Columns", "Import Date", "Validation"],
    rows: [
      ["Suicide Prevention Dataset with SDoH", "ZIP Upload", "-", "-", "Jun 28, 2026", "Queued"],
      ["SDOH Measures for Census Tract", "XLSX Upload", "-", "-", "Jun 28, 2026", "Queued"],
      ["Central Sample Health Indicators", "CSV Seed", "3", "4", "Apr 1, 2026", "Ready"],
      ["FHIR Patients", "FHIR API", "12,842", "28", "Today", "Needs profile"],
    ],
  },
  clean: {
    eyebrow: "Dataset Registry",
    title: "Clean Datasets",
    description: "Review quality-improved datasets after missingness handling, deduplication, type casting, and outlier correction.",
    previous: "Cleaning & Wrangling",
    current: "Clean Datasets",
    next: "Harmonization",
    nextHref: "/dashboard/datasets?prep=harmonization",
    metrics: [
      { label: "Completeness", value: "97.9%", sub: "post-cleaning" },
      { label: "Consistency", value: "94.2%", sub: "rules passed" },
      { label: "Duplicates Removed", value: "1,248", sub: "rows corrected" },
      { label: "Outliers Corrected", value: "84", sub: "reviewed values" },
    ],
    actions: ["Review Cleaning Report", "View Transformation Log", "Send To Harmonization", "Approve Clean Dataset"],
    tableTitle: "Quality Improvement Register",
    columns: ["Dataset", "Before Score", "After Score", "Missing %", "Duplicates", "Status"],
    rows: [
      ["SDOH Census Measures", "71", "94", "1.8%", "312", "Clean"],
      ["Clinical Outcomes Extract", "78", "96", "0.9%", "74", "Clean"],
      ["Claims Utilization Feed", "69", "91", "2.7%", "862", "Review"],
    ],
  },
  harmonized: {
    eyebrow: "Dataset Registry",
    title: "Harmonized Datasets",
    description: "Integrate clinical, claims, census, FHIR, and repository data into unified research-ready cohorts.",
    previous: "Clean Datasets",
    current: "Harmonized Datasets",
    next: "Feature Engineering",
    nextHref: "/dashboard/datasets?prep=features",
    metrics: [
      { label: "Mapped Variables", value: "184", sub: "canonical fields" },
      { label: "Ontology Matches", value: "72", sub: "SNOMED/LOINC/FHIR" },
      { label: "Source Alignment", value: "91%", sub: "crosswalk score" },
      { label: "Interoperability", value: "FHIR+", sub: "normalized schema" },
    ],
    actions: ["Review Mapping", "Open Ontology Explorer", "Generate Harmonized Dataset", "Send To Feature Sets"],
    tableTitle: "Variable Mapping",
    columns: ["Source A", "Source B", "Unified Variable", "Ontology", "Confidence", "Status"],
    rows: [
      ["gender", "sex", "patient_gender", "FHIR.Patient.gender", "0.98", "Mapped"],
      ["zip", "zip_code", "residence_zip", "USPS ZIP", "0.96", "Mapped"],
      ["readmit_30", "readmission_30d", "readmission_30_day", "Outcome", "0.94", "Mapped"],
    ],
  },
  features: {
    eyebrow: "Dataset Registry",
    title: "Feature Engineering Studio",
    description: "Curate reusable machine-learning feature sets for readmission, mortality, SDOH vulnerability, and policy models.",
    previous: "Harmonized Datasets",
    current: "Feature Sets",
    next: "Analysis Studio",
    nextHref: "/dashboard/sdoh?tab=analytics",
    metrics: [
      { label: "Feature Sets", value: "12", sub: "analysis ready" },
      { label: "Generated Features", value: "236", sub: "derived variables" },
      { label: "Reusable Features", value: "89", sub: "cataloged" },
      { label: "Top Importance", value: "Housing", sub: "SHAP leader" },
    ],
    actions: ["Generate Features", "Train Model", "Send To AutoML", "Send To Analysis Studio"],
    tableTitle: "ML Feature Registry",
    columns: ["Feature Set", "Features", "Target", "Models Using", "Last Score", "Status"],
    rows: [
      ["Readmission Risk", "42", "readmission_30d", "Logistic, XGBoost", "0.87 AUC", "Ready"],
      ["SDOH Vulnerability", "31", "risk_score", "Random Forest", "0.82 AUC", "Ready"],
      ["Mortality Risk", "54", "mortality_1y", "Cox PH", "0.79 C-index", "Draft"],
    ],
  },
  lineage: {
    eyebrow: "Dataset Registry",
    title: "Dataset Lineage Graph",
    description: "Trace every dataset from source import through cleaning, harmonization, feature engineering, analysis, and publication.",
    previous: "Dataset Registry",
    current: "Dataset Lineage",
    next: "Audit Log",
    nextHref: "/dashboard/activity",
    metrics: [
      { label: "Lineage Paths", value: "18", sub: "tracked" },
      { label: "Transformations", value: "64", sub: "audited" },
      { label: "Downstream Uses", value: "27", sub: "analyses/reports" },
      { label: "Impact Alerts", value: "3", sub: "requires review" },
    ],
    actions: ["Trace Impact", "View Dependencies", "Open Audit", "Export Lineage"],
    tableTitle: "Transformation History",
    columns: ["Stage", "Asset", "Pipeline", "Created By", "Timestamp", "Impact"],
    rows: [
      ["Raw", "SDOH ZIP Upload", "Universal Parser", "Jerry Godwin", "Jun 28, 2026", "Source"],
      ["Clean", "SDOH Clean v1", "Cleaning Engine", "DataNotch", "Jun 28, 2026", "Quality"],
      ["Feature", "Readmission Risk Features", "Feature Builder", "DataNotch", "Jun 29, 2026", "Model"],
    ],
  },
  catalog: {
    eyebrow: "Data Management",
    title: "Data Catalog",
    description: "Search datasets, variables, owners, quality scores, tags, and publications like a research data search engine.",
    previous: "Dataset Registry",
    current: "Data Catalog",
    next: "Knowledge Graph",
    nextHref: "/dashboard/sdoh?view=knowledge-graph",
    metrics: [
      { label: "Cataloged Assets", value: "74", sub: "datasets and files" },
      { label: "Variables", value: "1,842", sub: "indexed fields" },
      { label: "Data Stewards", value: "9", sub: "assigned owners" },
      { label: "Reuse Links", value: "31", sub: "studies/publications" },
    ],
    actions: ["Search Catalog", "Open Dataset Profile", "View Variable Dictionary", "Index New Asset"],
    tableTitle: "Catalog Search Results",
    columns: ["Dataset", "Owner", "Domain", "Quality", "Tags", "Used By"],
    rows: [
      ["SDOH Measures for Census Tract", "Jerry Godwin", "SDOH", "94", "census, geography", "5 reports"],
      ["Clinical Outcomes Extract", "Research Ops", "Clinical", "96", "readmission, diabetes", "8 analyses"],
      ["OpenNeuro Import", "NeuroTwinFM", "Imaging", "88", "MRI, metadata", "2 studies"],
    ],
  },
  profiling: prep("Data Profiling", "Profile rows, columns, types, missingness, outliers, distributions, and duplicates before cleaning.", "Raw Datasets", "Cleaning & Wrangling"),
  cleaning: prep("Cleaning & Wrangling", "Apply imputation, deduplication, type normalization, value standardization, and outlier treatment.", "Data Profiling", "Clean Datasets"),
  harmonization: prep("Harmonization", "Map synonymous fields and terminology into canonical research variables across sources.", "Clean Datasets", "Harmonized Datasets"),
  quality: prep("Quality Validation", "Score completeness, consistency, validity, uniqueness, and accuracy before analysis handoff.", "Feature Engineering", "Dataset Versioning"),
  versions: prep("Dataset Versioning", "Compare dataset versions, track schema changes, row changes, and release readiness.", "Quality Validation", "Dataset Registry"),
};

export function DatasetLifecycleModulePage({ stage }: { stage: DatasetLifecycleStage }) {
  const config = stageConfig[stage];
  const [notice, setNotice] = useState<string | null>(null);
  const registryStage = getRegistryStage(stage);

  const registryQuery = useQuery<DatasetRegistryItem[] | DatasetLineagePayload>({
    queryKey: ["dataset-registry", stage],
    queryFn: () => {
      if (stage === "lineage") return datasetRegistryApi.lineage();
      if (stage === "catalog") return datasetRegistryApi.catalog();
      if (registryStage) return datasetRegistryApi.byStage(registryStage);
      return Promise.resolve([]);
    },
    enabled: Boolean(registryStage || stage === "lineage" || stage === "catalog"),
    retry: false,
  });

  const liveConfig = useMemo(
    () => hydrateConfig(stage, config, registryQuery.data),
    [config, registryQuery.data, stage],
  );

  const primaryDatasetId = useMemo(() => firstDatasetId(registryQuery.data) ?? stage, [registryQuery.data, stage]);
  const actionMutation = useMutation({
    mutationFn: (action: string) => runRegistryAction(primaryDatasetId, action),
    onSuccess: (response) => setNotice(response.message),
    onError: (error) => setNotice(error instanceof Error ? error.message : "Registry action failed"),
  });

  const commonProps = {
    config: liveConfig,
    notice,
    isLoading: registryQuery.isFetching,
    onAction: (action: string) => actionMutation.mutate(action),
  };

  if (stage === "lineage") return <LineagePage {...commonProps} lineage={asLineage(registryQuery.data)} />;
  if (stage === "harmonized") return <HarmonizedPage {...commonProps} />;
  if (stage === "features") return <FeaturePage {...commonProps} />;
  if (stage === "catalog") return <CatalogPage {...commonProps} />;

  return <StandardStagePage {...commonProps} icon={stage === "clean" ? Wrench : Database} />;
}

type StagePageProps = {
  config: StageConfig;
  notice: string | null;
  isLoading: boolean;
  onAction: (action: string) => void;
};

function StandardStagePage({
  config,
  icon: Icon,
  notice,
  isLoading,
  onAction,
}: StagePageProps & { icon: typeof Database }) {
  return (
    <StageShell config={config} icon={Icon} notice={notice} isLoading={isLoading}>
      <section className="grid gap-4 lg:grid-cols-[1fr_0.65fr]">
        <Card className="rounded-3xl">
          <CardHeader>
            <CardTitle>{config.tableTitle}</CardTitle>
          </CardHeader>
          <CardContent>
            <DataTable columns={config.columns} rows={config.rows} />
          </CardContent>
        </Card>
        <Card className="rounded-3xl">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <ShieldCheck className="h-5 w-5 text-emerald-600" />
              Stage Actions
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {config.actions.map((action) => (
              <Button
                key={action}
                variant="outline"
                className="h-11 w-full justify-start"
                onClick={() => onAction(action)}
              >
                <ArrowRight className="mr-2 h-4 w-4" />
                {action}
              </Button>
            ))}
          </CardContent>
        </Card>
      </section>
      <ValidationGrid />
    </StageShell>
  );
}

function HarmonizedPage({ config, notice, isLoading }: StagePageProps) {
  return (
    <StageShell config={config} icon={GitBranch} notice={notice} isLoading={isLoading}>
      <section className="grid gap-4 lg:grid-cols-[0.8fr_1fr]">
        <Card className="rounded-3xl">
          <CardHeader>
            <CardTitle>Source Alignment Center</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="relative h-72 rounded-2xl border bg-slate-50 p-4">
              {["FHIR", "Claims", "Census"].map((source, index) => (
                <div
                  key={source}
                  className="absolute left-8 rounded-2xl border border-blue-200 bg-white px-5 py-3 text-sm font-bold text-slate-800 shadow-sm"
                  style={{ top: 38 + index * 78 }}
                >
                  {source}
                </div>
              ))}
              <div className="absolute right-8 top-28 rounded-2xl border border-emerald-200 bg-emerald-50 px-6 py-4 text-sm font-bold text-emerald-800 shadow-sm">
                Harmonized Cohort
              </div>
              <div className="absolute left-36 right-48 top-20 h-px rotate-[18deg] bg-slate-300" />
              <div className="absolute left-36 right-48 top-36 h-px bg-slate-300" />
              <div className="absolute left-36 right-48 top-52 h-px rotate-[-18deg] bg-slate-300" />
            </div>
          </CardContent>
        </Card>
        <Card className="rounded-3xl">
          <CardHeader>
            <CardTitle>{config.tableTitle}</CardTitle>
          </CardHeader>
          <CardContent>
            <DataTable columns={config.columns} rows={config.rows} />
          </CardContent>
        </Card>
      </section>
    </StageShell>
  );
}

function FeaturePage({ config, notice, isLoading }: StagePageProps) {
  return (
    <StageShell config={config} icon={Sparkles} notice={notice} isLoading={isLoading}>
      <section className="grid gap-4 lg:grid-cols-[1fr_0.85fr]">
        <Card className="rounded-3xl">
          <CardHeader>
            <CardTitle>{config.tableTitle}</CardTitle>
          </CardHeader>
          <CardContent>
            <DataTable columns={config.columns} rows={config.rows} />
          </CardContent>
        </Card>
        <Card className="rounded-3xl">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <BrainCircuit className="h-5 w-5 text-violet-600" />
              Feature Importance
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {[
              ["Housing instability", "92%"],
              ["Income level", "78%"],
              ["Food access", "68%"],
              ["Insurance type", "54%"],
            ].map(([label, value]) => (
              <div key={label}>
                <div className="mb-1 flex justify-between text-sm">
                  <span className="font-medium text-slate-700">{label}</span>
                  <span className="text-slate-500">{value}</span>
                </div>
                <div className="h-3 rounded-full bg-slate-100">
                  <div className="h-3 rounded-full bg-violet-600" style={{ width: value }} />
                </div>
              </div>
            ))}
          </CardContent>
        </Card>
      </section>
    </StageShell>
  );
}

function LineagePage({
  config,
  notice,
  isLoading,
  lineage,
}: StagePageProps & { lineage: DatasetLineagePayload | null }) {
  const lineageSteps = lineage?.nodes?.length
    ? lineage.nodes.map((node) => node.label)
    : ["FHIR / Claims / Census", "Raw Dataset", "Clean Dataset", "Harmonized Dataset", "Feature Set", "Analysis", "Publication"];

  return (
    <StageShell config={config} icon={GitBranch} notice={notice} isLoading={isLoading}>
      <section className="grid gap-4 lg:grid-cols-[0.72fr_1fr]">
        <Card className="rounded-3xl">
          <CardHeader>
            <CardTitle>Interactive Lineage Path</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {lineageSteps.map((step, index) => (
                <div key={step} className="flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-full bg-blue-600 text-sm font-bold text-white">
                    {index + 1}
                  </div>
                  <div className="flex-1 rounded-2xl border bg-white px-4 py-3 text-sm font-semibold text-slate-800">
                    {step}
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
        <Card className="rounded-3xl">
          <CardHeader>
            <CardTitle>{config.tableTitle}</CardTitle>
          </CardHeader>
          <CardContent>
            <DataTable columns={config.columns} rows={config.rows} />
          </CardContent>
        </Card>
      </section>
    </StageShell>
  );
}

function CatalogPage({ config, notice, isLoading }: StagePageProps) {
  return (
    <StageShell config={config} icon={BookOpen} notice={notice} isLoading={isLoading}>
      <Card className="rounded-3xl">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Search className="h-5 w-5 text-blue-600" />
            Global Catalog Search
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="rounded-2xl border bg-slate-50 px-4 py-4 text-sm text-slate-500">
            Search datasets, variables, owners, publications, cohorts, and tags
          </div>
          <div className="flex flex-wrap gap-2">
            {["Clinical", "Claims", "SDOH", "Imaging", "Genomics", "Publication-ready"].map((filter) => (
              <Badge key={filter} variant="outline" className="rounded-full px-3 py-1">
                {filter}
              </Badge>
            ))}
          </div>
          <DataTable columns={config.columns} rows={config.rows} />
        </CardContent>
      </Card>
    </StageShell>
  );
}

function StageShell({
  config,
  icon: Icon,
  notice,
  isLoading,
  children,
}: {
  config: StageConfig;
  icon: typeof Database;
  notice?: string | null;
  isLoading?: boolean;
  children: ReactNode;
}) {
  return (
    <div className="space-y-6 p-6">
      <section className="rounded-[28px] border border-slate-200 bg-white p-6 shadow-sm">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
          <div>
            <Badge className="mb-3 bg-blue-50 text-blue-700 hover:bg-blue-50">{config.eyebrow}</Badge>
            <div className="flex items-center gap-3">
              <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-slate-950 text-white">
                <Icon className="h-6 w-6" />
              </div>
              <div>
                <h1 className="text-3xl font-bold tracking-tight text-slate-950">{config.title}</h1>
                <p className="mt-1 max-w-3xl text-sm leading-6 text-slate-600">{config.description}</p>
              </div>
            </div>
          </div>
          <Button asChild className="bg-slate-950 text-white hover:bg-slate-800">
            <Link href={config.nextHref}>
              Send Forward
              <ArrowRight className="ml-2 h-4 w-4" />
            </Link>
          </Button>
        </div>
        {(notice || isLoading) && (
          <div className="mt-5 rounded-2xl border border-blue-100 bg-blue-50 px-4 py-3 text-sm font-medium text-blue-800">
            {isLoading ? "Syncing live registry data..." : notice}
          </div>
        )}
        <div className="mt-6 grid gap-3 md:grid-cols-4">
          {config.metrics.map((metric) => (
            <div key={metric.label} className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
              <p className="text-xs font-semibold uppercase text-slate-500">{metric.label}</p>
              <p className="mt-2 text-2xl font-bold text-slate-950">{metric.value}</p>
              <p className="mt-1 text-xs text-slate-500">{metric.sub}</p>
            </div>
          ))}
        </div>
      </section>
      <WorkflowRail config={config} />
      {children}
    </div>
  );
}

function WorkflowRail({ config }: { config: StageConfig }) {
  return (
    <Card className="rounded-3xl">
      <CardContent className="grid gap-3 p-4 md:grid-cols-3">
        <WorkflowItem label="Previous Stage" value={config.previous} icon={<ArrowRight className="h-4 w-4 rotate-180" />} />
        <WorkflowItem label="Current Stage" value={config.current} icon={<CheckCircle2 className="h-4 w-4" />} active />
        <WorkflowItem label="Next Stage" value={config.next} icon={<ArrowRight className="h-4 w-4" />} />
      </CardContent>
    </Card>
  );
}

function WorkflowItem({ label, value, icon, active = false }: { label: string; value: string; icon: ReactNode; active?: boolean }) {
  return (
    <div className={`flex items-center gap-3 rounded-2xl border px-4 py-3 ${active ? "border-blue-200 bg-blue-50" : "bg-white"}`}>
      <div className={`flex h-9 w-9 items-center justify-center rounded-full ${active ? "bg-blue-600 text-white" : "bg-slate-100 text-slate-600"}`}>
        {icon}
      </div>
      <div>
        <p className="text-xs font-semibold uppercase text-slate-500">{label}</p>
        <p className="text-sm font-bold text-slate-900">{value}</p>
      </div>
    </div>
  );
}

function DataTable({ columns, rows }: { columns: string[]; rows: string[][] }) {
  return (
    <div className="overflow-hidden rounded-2xl border">
      <Table>
        <TableHeader>
          <TableRow className="bg-slate-50">
            {columns.map((column) => (
              <TableHead key={column} className="text-xs font-bold uppercase text-slate-500">
                {column}
              </TableHead>
            ))}
          </TableRow>
        </TableHeader>
        <TableBody>
          {rows.map((row, rowIndex) => (
            <TableRow key={`${rowIndex}-${row.join("-")}`}>
              {row.map((cell, index) => (
                <TableCell key={`${cell}-${index}`} className="text-sm">
                  {index === row.length - 1 ? <Badge variant="outline">{cell}</Badge> : cell}
                </TableCell>
              ))}
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}

function getRegistryStage(stage: DatasetLifecycleStage): DatasetRegistryStage | null {
  if (stage === "raw" || stage === "clean" || stage === "harmonized" || stage === "features") {
    return stage;
  }

  return null;
}

function asLineage(data: unknown): DatasetLineagePayload | null {
  if (data && typeof data === "object" && "nodes" in data && "edges" in data) {
    return data as DatasetLineagePayload;
  }

  return null;
}

function firstDatasetId(data: unknown) {
  return Array.isArray(data) && data.length > 0 && "id" in data[0] ? String(data[0].id) : null;
}

function hydrateConfig(stage: DatasetLifecycleStage, config: StageConfig, data: unknown): StageConfig {
  if (stage === "lineage") {
    const lineage = asLineage(data);
    if (!lineage) return config;
    return {
      ...config,
      metrics: [
        { label: "Lineage Nodes", value: String(lineage.nodes.length), sub: "registry assets" },
        { label: "Transformations", value: String(lineage.edges.length), sub: "tracked edges" },
        { label: "Current Graph", value: "Live", sub: "database backed" },
        { label: "Traceability", value: "Ready", sub: "audit path" },
      ],
      rows: lineage.edges.slice(0, 8).map((edge) => [
        edge.operation,
        edge.from,
        edge.to,
        edge.description ?? "Registry lineage edge",
        "DataNotch",
        "Tracked",
      ]),
    };
  }

  if (!Array.isArray(data) || data.length === 0) return config;
  const items = data as DatasetRegistryItem[];
  const rows = rowsForStage(stage, items, config);

  return {
    ...config,
    metrics: metricsForStage(stage, items, config),
    rows: rows.length ? rows : config.rows,
  };
}

function rowsForStage(stage: DatasetLifecycleStage, items: DatasetRegistryItem[], config: StageConfig) {
  switch (stage) {
    case "raw":
      return items.map((item) => [
        item.name,
        item.source,
        formatCount(item.records),
        formatCount(item.variables),
        item.lastUpdated,
        item.status,
      ]);
    case "clean":
      return items.map((item) => [
        item.name,
        String(Math.max(0, item.qualityScore - 14)),
        String(item.qualityScore),
        item.qualityScore >= 90 ? "1.2%" : "4.8%",
        item.qualityScore >= 90 ? "0" : "Review",
        item.status,
      ]);
    case "harmonized":
      return items.map((item) => [
        item.source,
        item.tags.slice(0, 2).join(" + ") || item.domain,
        item.name,
        "FHIR+/OMOP",
        `${item.qualityScore / 100}`,
        item.status,
      ]);
    case "features":
      return items.map((item) => [
        item.name,
        formatCount(item.variables),
        "readmission_30d",
        "Analysis Studio",
        `${Math.max(70, item.qualityScore)} AUC`,
        item.status,
      ]);
    case "catalog":
      return items.map((item) => [
        item.name,
        item.owner,
        item.domain,
        String(item.qualityScore),
        item.tags.join(", ") || "registry",
        item.workspace,
      ]);
    default:
      return config.rows;
  }
}

function metricsForStage(stage: DatasetLifecycleStage, items: DatasetRegistryItem[], config: StageConfig) {
  const records = items.reduce((sum, item) => sum + item.records, 0);
  const variables = items.reduce((sum, item) => sum + item.variables, 0);
  const averageQuality = items.length
    ? Math.round(items.reduce((sum, item) => sum + item.qualityScore, 0) / items.length)
    : 0;
  const storage = items.reduce((sum, item) => sum + item.sizeBytes, 0);

  if (stage === "raw") {
    return [
      { label: "Raw Datasets", value: String(items.length), sub: "registered" },
      { label: "Rows", value: formatCount(records), sub: "detected" },
      { label: "Storage Size", value: formatBytes(storage), sub: "raw assets" },
      { label: "Validation", value: String(items.filter((item) => item.status !== "Ready").length), sub: "checks needed" },
    ];
  }

  if (stage === "catalog") {
    return [
      { label: "Cataloged Assets", value: String(items.length), sub: "live records" },
      { label: "Variables", value: formatCount(variables), sub: "indexed fields" },
      { label: "Average Quality", value: `${averageQuality}%`, sub: "registry score" },
      { label: "Workspaces", value: String(new Set(items.map((item) => item.workspace)).size), sub: "linked" },
    ];
  }

  return [
    { label: config.metrics[0]?.label ?? "Datasets", value: String(items.length), sub: "live records" },
    { label: "Rows", value: formatCount(records), sub: "available" },
    { label: "Variables", value: formatCount(variables), sub: "tracked" },
    { label: "Quality", value: `${averageQuality}%`, sub: "average score" },
  ];
}

function formatCount(value: number) {
  return Intl.NumberFormat("en-US", { notation: value >= 10000 ? "compact" : "standard" }).format(value);
}

function formatBytes(value: number) {
  if (!value) return "0 B";
  const units = ["B", "KB", "MB", "GB", "TB"];
  const index = Math.min(Math.floor(Math.log(value) / Math.log(1024)), units.length - 1);
  return `${(value / 1024 ** index).toFixed(index === 0 ? 0 : 1)} ${units[index]}`;
}

async function runRegistryAction(datasetId: string, action: string) {
  const lower = action.toLowerCase();
  if (lower.includes("profile") || lower.includes("validate") || lower.includes("report")) {
    return datasetRegistryApi.profile(datasetId);
  }
  if (lower.includes("access")) {
    return datasetRegistryApi.requestAccess(datasetId, "Requested from Dataset Registry workflow action.");
  }
  const target = lower.includes("clean")
    ? "cleaning"
    : lower.includes("harmon")
      ? "harmonization"
      : lower.includes("feature")
        ? "feature-engineering"
        : lower.includes("analysis") || lower.includes("automl")
          ? "analysis-studio"
          : lower.includes("archive")
            ? "archive"
            : "next-stage";
  return datasetRegistryApi.handoff(datasetId, target);
}

function ValidationGrid() {
  return (
    <section className="grid gap-4 md:grid-cols-4">
      {[
        ["Missing Columns", "2", FileSearch],
        ["Schema Drift", "1", Activity],
        ["Import Errors", "0", ShieldCheck],
        ["Failed Imports", "0", Table2],
      ].map(([label, value, Icon]) => (
        <Card key={String(label)} className="rounded-3xl">
          <CardContent className="flex items-center justify-between p-5">
            <div>
              <p className="text-sm font-semibold text-slate-500">{label as string}</p>
              <p className="mt-2 text-2xl font-bold">{value as string}</p>
            </div>
            <Icon className="h-6 w-6 text-blue-600" />
          </CardContent>
        </Card>
      ))}
    </section>
  );
}

function prep(title: string, description: string, previous: string, next: string): StageConfig {
  const nextHref =
    next === "Clean Datasets"
      ? "/dashboard/datasets?view=clean"
      : next === "Harmonized Datasets"
        ? "/dashboard/datasets?view=harmonized"
        : next === "Dataset Versioning"
          ? "/dashboard/datasets?prep=versions"
          : "/dashboard/datasets";
  return {
    eyebrow: "Data Preparation",
    title,
    description,
    previous,
    current: title,
    next,
    nextHref,
    metrics: [
      { label: "Rules", value: "24", sub: "configured" },
      { label: "Records", value: "12.8k", sub: "eligible" },
      { label: "Quality", value: "94%", sub: "current score" },
      { label: "Audit", value: "Ready", sub: "logged steps" },
    ],
    actions: ["Run Stage", "Preview Changes", "Save Version", `Send To ${next}`],
    tableTitle: `${title} Worklist`,
    columns: ["Rule", "Target", "Before", "After", "Owner", "Status"],
    rows: [
      ["Missingness check", "All columns", "7.4%", "1.8%", "DataNotch", "Passed"],
      ["Duplicate removal", "patient_id", "312", "0", "DataNotch", "Passed"],
      ["Type normalization", "dates/numbers", "18 issues", "0 issues", "DataNotch", "Ready"],
    ],
  };
}
