'use client';

import { useEffect, useMemo, useState } from 'react';
import {
  Activity,
  BarChart3,
  BrainCircuit,
  DatabaseZap,
  Download,
  FileText,
  Filter,
  HeartPulse,
  Map,
  Network,
  Search,
  ShieldCheck,
  Sparkles,
  Table2,
  Users,
  WandSparkles,
} from 'lucide-react';

import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ResearchChartStudio, type ResearchChartRecord } from '@/components/visualizations/research-chart-studio';
import {
  getSdohAnalyticsModules,
  getSdohDashboardModules,
  getSdohDashboardSummary,
  getSdohDatasetProfile,
  getSdohFeatureFlags,
  getSdohOverview,
  getSdohPublicationPack,
  createSdohManuscriptSummary,
  createSdohRegressionTable,
  createSdohTable1,
  downloadSdohPublicationExport,
  previewSdohCohort,
  querySdohAnalytics,
  runSdohCausalQuery,
  runSdohPolicySimulation,
  setSdohFeatureFlag,
  type SdohAnalysisResponse,
  type SdohCohortPreview,
  type SdohDashboardModule,
  type SdohDashboardSummary,
  type SdohDatasetProfile,
  type SdohFeatureFlags,
  type SdohOverview,
  type SdohPublicationPack,
} from '@/src/lib/api/sdoh';

type WorkflowTab = 'data' | 'cohort' | 'analytics' | 'visualization' | 'causal' | 'copilot' | 'publication' | 'export';

const workflowTabs: Array<{ value: WorkflowTab; label: string; subtitle: string }> = [
  { value: 'data', label: '1 Data', subtitle: 'Registry, profile, lineage' },
  { value: 'cohort', label: '2 Cohort', subtitle: 'Eligibility builder' },
  { value: 'analytics', label: '3 Analytics', subtitle: 'Stats, ML, survival' },
  { value: 'visualization', label: '4 Visualization', subtitle: 'Charts and maps' },
  { value: 'causal', label: '5 Causal AI', subtitle: 'Policy simulation' },
  { value: 'copilot', label: '6 Copilot', subtitle: 'Natural language research' },
  { value: 'publication', label: '7 Publication', subtitle: 'Tables and manuscript' },
  { value: 'export', label: 'Export', subtitle: 'Files, approval, audit' },
];

const visualizationTypes = [
  'Bar',
  'Line',
  'Heatmap',
  'Sankey',
  'Sunburst',
  'Treemap',
  'Network Graph',
  'Funnel',
  'Radar',
  'Survival Curve',
  'GIS Map',
  'SHAP Plot',
];

const cohortCriteria = [
  'Age > 65',
  'County = Baltimore',
  'Income = Low',
  'Housing instability = Yes',
  'Prior utilization >= 2 visits',
  'Readmission window = 30 days',
];

function recordsFromModules(modules: SdohAnalysisResponse[]): ResearchChartRecord[] {
  return modules.map((module, index) => ({
    id: module.module,
    label: module.module.replace(/ Analytics| Analysis| Modeling/g, '').slice(0, 26),
    group: module.chart_type,
    status: module.table.length > 0 ? 'SUCCEEDED' : 'QUEUED',
    value: Math.min(100, Math.max(18, module.table.length * 14 + index * 2)),
    secondaryValue: Math.min(100, 35 + Object.keys(module.data ?? {}).length * 18),
    runtimeMinutes: 2 + index,
    artifacts: Math.max(1, module.table.length),
    latitude: 38.6 + index * 0.08,
    longitude: -77.4 + index * 0.11,
  }));
}

function MetricCard({
  icon: Icon,
  label,
  value,
  tone = 'blue',
}: {
  icon: typeof Users;
  label: string;
  value: string | number;
  tone?: 'blue' | 'emerald' | 'violet' | 'amber';
}) {
  const tones = {
    blue: 'bg-blue-50 text-blue-700',
    emerald: 'bg-emerald-50 text-emerald-700',
    violet: 'bg-violet-50 text-violet-700',
    amber: 'bg-amber-50 text-amber-700',
  };

  return (
    <div className="rounded-2xl border bg-white p-5 shadow-sm">
      <div className={`flex h-10 w-10 items-center justify-center rounded-xl ${tones[tone]}`}>
        <Icon className="h-5 w-5" />
      </div>
      <p className="mt-4 text-xs font-medium uppercase tracking-wide text-slate-500">{label}</p>
      <p className="mt-1 text-2xl font-bold text-slate-950">{value}</p>
    </div>
  );
}

function InlineStat({ label, value }: { label: string; value: string | number }) {
  return (
    <div className="rounded-xl border bg-slate-50 p-3">
      <p className="text-xs uppercase text-slate-500">{label}</p>
      <p className="mt-1 font-semibold text-slate-950">{value}</p>
    </div>
  );
}

function CohortTable({ cohort }: { cohort: SdohCohortPreview | null }) {
  return (
    <div className="overflow-hidden rounded-xl border">
      <table className="w-full text-left text-xs">
        <thead className="bg-slate-50 text-slate-500">
          <tr>
            {['Patient', 'Age', 'County', 'Income', 'Readmit'].map((head) => (
              <th key={head} className="px-3 py-2">
                {head}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {(cohort?.rows ?? []).map((row) => (
            <tr key={String(row.patient_uid)} className="border-t">
              <td className="px-3 py-2 font-medium">{String(row.patient_uid)}</td>
              <td className="px-3 py-2">{String(row.age)}</td>
              <td className="px-3 py-2">{String(row.county)}</td>
              <td className="px-3 py-2">{String(row.income_level)}</td>
              <td className="px-3 py-2">{String(row.readmitted_30d)}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function ResultBlock({ value, empty }: { value: Record<string, unknown> | SdohAnalysisResponse | null; empty: string }) {
  return (
    <pre className="max-h-72 overflow-auto whitespace-pre-wrap rounded-xl bg-slate-950 p-4 text-xs leading-6 text-slate-50">
      {value ? JSON.stringify(value, null, 2) : empty}
    </pre>
  );
}

export default function SdohIntelligencePage() {
  const [overview, setOverview] = useState<SdohOverview | null>(null);
  const [summary, setSummary] = useState<SdohDashboardSummary | null>(null);
  const [dashboardModules, setDashboardModules] = useState<SdohDashboardModule[]>([]);
  const [analytics, setAnalytics] = useState<SdohAnalysisResponse[]>([]);
  const [cohort, setCohort] = useState<SdohCohortPreview | null>(null);
  const [datasetProfile, setDatasetProfile] = useState<SdohDatasetProfile | null>(null);
  const [featureFlags, setFeatureFlags] = useState<SdohFeatureFlags | null>(null);
  const [publicationPack, setPublicationPack] = useState<SdohPublicationPack | null>(null);
  const [activeTab, setActiveTab] = useState<WorkflowTab>('data');
  const [query, setQuery] = useState('Show relationship between food insecurity and readmission');
  const [queryResult, setQueryResult] = useState<SdohAnalysisResponse | null>(null);
  const [causalResult, setCausalResult] = useState<Record<string, unknown> | null>(null);
  const [publicationResult, setPublicationResult] = useState<Record<string, unknown> | null>(null);
  const [publicationBusy, setPublicationBusy] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = () => {
    setLoading(true);
    setError(null);
    void Promise.all([
      getSdohOverview(),
      getSdohDashboardSummary(),
      getSdohDashboardModules(),
      getSdohAnalyticsModules(),
      previewSdohCohort({ limit: 8 }),
      getSdohDatasetProfile(),
      getSdohFeatureFlags(),
      getSdohPublicationPack(),
    ])
      .then(([overviewResult, summaryResult, modulesResult, analyticsResult, cohortResult, profileResult, flagsResult, publicationResult]) => {
        setOverview(overviewResult);
        setSummary(summaryResult);
        setDashboardModules(modulesResult);
        setAnalytics(analyticsResult);
        setCohort(cohortResult);
        setDatasetProfile(profileResult);
        setFeatureFlags(flagsResult);
        setPublicationPack(publicationResult);
      })
      .catch((err) => setError(err instanceof Error ? err.message : 'Unable to load SDOH intelligence.'))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    load();
  }, []);

  const chartRecords = useMemo(() => recordsFromModules(analytics), [analytics]);

  const runQuery = () => {
    void querySdohAnalytics(query)
      .then(setQueryResult)
      .catch((err) => setError(err instanceof Error ? err.message : 'Unable to run SDOH query.'));
  };

  const toggleFlag = (flag: 'causal' | 'counterfactual' | 'policy' | 'publication' | 'gis' | 'survival', value: boolean) => {
    void setSdohFeatureFlag(flag, value)
      .then(setFeatureFlags)
      .catch((err) => setError(err instanceof Error ? err.message : 'Unable to update SDOH feature flag.'));
  };

  const runCausal = () => {
    void Promise.all([runSdohPolicySimulation(), runSdohCausalQuery('Which SDOH intervention should reduce readmission first?')])
      .then(([policy, recommendation]) => setCausalResult({ policy, recommendation }))
      .catch((err) => setError(err instanceof Error ? err.message : 'Unable to run causal simulation.'));
  };

  const runPublicationAction = (action: 'table1' | 'regression' | 'summary') => {
    setPublicationBusy(action);
    const task =
      action === 'table1'
        ? createSdohTable1()
        : action === 'regression'
          ? createSdohRegressionTable()
          : createSdohManuscriptSummary();
    void task
      .then(setPublicationResult)
      .catch((err) => setError(err instanceof Error ? err.message : 'Unable to generate publication output.'))
      .finally(() => setPublicationBusy(null));
  };

  const downloadPublication = (format: 'csv' | 'xlsx' | 'pdf') => {
    setPublicationBusy(format);
    void downloadSdohPublicationExport(format, 'table1')
      .then(({ blob, filename }) => {
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = filename;
        document.body.appendChild(link);
        link.click();
        link.remove();
        URL.revokeObjectURL(url);
      })
      .catch((err) => setError(err instanceof Error ? err.message : 'Unable to download publication export.'))
      .finally(() => setPublicationBusy(null));
  };

  return (
    <div className="space-y-6 p-6">
      <div className="rounded-3xl border bg-white p-6 shadow-sm">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <div className="flex items-center gap-3">
              <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-blue-600 text-white">
                <HeartPulse className="h-6 w-6" />
              </div>
              <div>
                <p className="text-sm font-medium text-slate-500">Research Platform</p>
                <h1 className="text-3xl font-bold text-slate-950">SDOH Research Studio</h1>
              </div>
            </div>
            <p className="mt-3 max-w-3xl text-sm text-slate-600">
              Workflow-driven research intelligence for SDOH, clinical outcomes, precision medicine, and population health.
            </p>
          </div>
          <Button variant="outline" onClick={load} disabled={loading} className="h-11">
            <DatabaseZap className="mr-2 h-4 w-4" />
            {loading ? 'Syncing...' : 'Refresh SDOH Data'}
          </Button>
        </div>

        <div className="mt-6 grid gap-3 md:grid-cols-4">
          <InlineStat label="Active Study" value="Diabetes Readmission Study" />
          <InlineStat label="Dataset" value={datasetProfile?.dataset_id ?? 'SDOH_Demo_600'}/>
          <InlineStat label="Cohort" value={`${cohort?.count ?? overview?.cohort_size ?? 600} patients`} />
          <InlineStat label="Last Analysis" value="26 Jun 2026" />
        </div>
      </div>

      {error ? (
        <Alert className="border-amber-200 bg-amber-50 text-amber-900">
          <AlertTitle>SDOH service notice</AlertTitle>
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      ) : null}

      <div className="grid gap-4 md:grid-cols-4">
        <MetricCard icon={Users} label="Cohort Size" value={overview?.cohort_size ?? '--'} />
        <MetricCard icon={BrainCircuit} label="Analytics Layers" value={overview?.analytics_layers ?? '--'} tone="violet" />
        <MetricCard icon={Activity} label="Dashboard Modules" value={overview?.dashboard_modules ?? '--'} tone="emerald" />
        <MetricCard icon={FileText} label="Ready Outputs" value={overview?.ready_outputs.length ?? '--'} tone="amber" />
      </div>

      <Tabs value={activeTab} onValueChange={(value) => setActiveTab(value as WorkflowTab)} className="space-y-5">
        <TabsList className="grid h-auto w-full grid-cols-2 gap-2 rounded-2xl bg-slate-100 p-2 md:grid-cols-4 xl:grid-cols-8">
          {workflowTabs.map((tab) => (
            <TabsTrigger key={tab.value} value={tab.value} className="h-auto flex-col items-start rounded-xl px-3 py-3 text-left">
              <span className="text-sm font-semibold">{tab.label}</span>
              <span className="mt-1 text-[11px] font-normal text-slate-500">{tab.subtitle}</span>
            </TabsTrigger>
          ))}
        </TabsList>

        <TabsContent value="data" className="space-y-5">
          <div className="grid gap-5 xl:grid-cols-[1fr_.9fr]">
            <Card>
              <CardHeader>
                <CardTitle>Data Hub</CardTitle>
                <CardDescription>Dataset registry, DataBank profile, and lineage from source data to publication output.</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid gap-3 md:grid-cols-3">
                  <InlineStat label="Dataset" value={datasetProfile?.dataset_id ?? 'demo-sdoh'} />
                  <InlineStat label="Rows" value={datasetProfile?.rows ?? '--'} />
                  <InlineStat
                    label="Missing Fields"
                    value={datasetProfile?.missing_report.filter((item) => item.missing_count > 0).length ?? 0}
                  />
                </div>
                <div className="rounded-2xl border bg-slate-50 p-4">
                  <p className="font-semibold text-slate-950">Data Lineage</p>
                  <div className="mt-4 grid gap-3 md:grid-cols-4">
                    {['Dataset', 'Transformation', 'Analysis', 'Publication'].map((stage, index) => (
                      <div key={stage} className="rounded-xl border bg-white p-3">
                        <Badge className="bg-blue-50 text-blue-700">{index + 1}</Badge>
                        <p className="mt-2 text-sm font-semibold text-slate-900">{stage}</p>
                      </div>
                    ))}
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Cohort Preview</CardTitle>
                <CardDescription>Sample SDOH cohort rows available to downstream analysis.</CardDescription>
              </CardHeader>
              <CardContent className="space-y-3">
                <p className="text-sm font-semibold text-slate-700">{cohort?.count ?? 0} eligible sample records</p>
                <CohortTable cohort={cohort} />
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="cohort" className="space-y-5">
          <Card>
            <CardHeader>
              <CardTitle>Cohort Builder</CardTitle>
              <CardDescription>Build a research-ready cohort from clinical, demographic, SDOH, geographic, and outcome criteria.</CardDescription>
            </CardHeader>
            <CardContent className="grid gap-5 xl:grid-cols-[.9fr_1.1fr]">
              <div className="rounded-2xl border bg-slate-50 p-4">
                <div className="flex items-center gap-2">
                  <Filter className="h-5 w-5 text-blue-600" />
                  <p className="font-semibold text-slate-950">Active Eligibility Rules</p>
                </div>
                <div className="mt-4 grid gap-2">
                  {cohortCriteria.map((criterion) => (
                    <button
                      key={criterion}
                      type="button"
                      className="rounded-xl border bg-white px-3 py-2 text-left text-sm transition hover:border-blue-300 hover:bg-blue-50"
                    >
                      {criterion}
                    </button>
                  ))}
                </div>
                <Button className="mt-4 w-full">Generate Cohort</Button>
              </div>
              <div className="space-y-3">
                <div className="grid gap-3 md:grid-cols-3">
                  <InlineStat label="Eligible" value={`${cohort?.count ?? 523} patients`} />
                  <InlineStat label="Excluded" value="77 patients" />
                  <InlineStat label="Readmission Rate" value="31%" />
                </div>
                <CohortTable cohort={cohort} />
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="analytics" className="space-y-5">
          <Card>
            <CardHeader>
              <CardTitle>Analytics Studio</CardTitle>
              <CardDescription>Run descriptive statistics, regression, classification, survival, SEM, clustering, and model interpretation.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-5">
              <div className="grid gap-3 md:grid-cols-3 xl:grid-cols-6">
                {['Descriptive', 'Regression', 'Classification', 'Survival', 'SEM', 'Clustering'].map((item) => (
                  <Button key={item} variant="outline" className="justify-start">
                    <BarChart3 className="mr-2 h-4 w-4" />
                    {item}
                  </Button>
                ))}
              </div>
              <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
                {dashboardModules.slice(0, 8).map((module) => (
                  <div key={module.id} className="rounded-2xl border bg-white p-4">
                    <p className="font-semibold text-slate-950">{module.name}</p>
                    <p className="mt-2 text-sm leading-6 text-slate-600">{module.description}</p>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="visualization" className="space-y-5">
          <ResearchChartStudio
            title="Visualization Center"
            description="Interactive chart engine for statistical, geospatial, network, explainability, and publication graphics."
            records={chartRecords}
            initialMode="funnel"
          />
          <Card>
            <CardHeader>
              <CardTitle>Visualization Library</CardTitle>
              <CardDescription>Researchers can switch chart families based on the selected SDOH analysis output.</CardDescription>
            </CardHeader>
            <CardContent className="grid gap-2 sm:grid-cols-2 md:grid-cols-3 xl:grid-cols-4">
              {visualizationTypes.map((type) => (
                <Badge key={type} variant="outline" className="justify-center rounded-xl px-3 py-2 text-sm">
                  {type}
                </Badge>
              ))}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="causal" className="space-y-5">
          <div className="grid gap-5 xl:grid-cols-[.9fr_1.1fr]">
            <Card>
              <CardHeader>
                <CardTitle>Causal &amp; Simulation Lab</CardTitle>
                <CardDescription>Run intervention scenarios, counterfactual policy simulation, and digital twin impact estimates.</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="rounded-2xl border bg-blue-50 p-4 text-sm text-blue-950">
                  <p className="font-semibold">Income Support +15%</p>
                  <p className="mt-2">Simulate intervention {'->'} Readmission down 8% {'->'} Estimated savings $2.4M</p>
                </div>
                <Button onClick={runCausal}>
                  <WandSparkles className="mr-2 h-4 w-4" />
                  Run Causal + Policy Simulation
                </Button>
              </CardContent>
            </Card>
            <Card>
              <CardHeader>
                <CardTitle>Simulation Output</CardTitle>
                <CardDescription>Policy impact and recommended next analysis from the SDOH causal API.</CardDescription>
              </CardHeader>
              <CardContent>
                <ResultBlock value={causalResult} empty="Run the simulation to generate intervention impact, confidence metadata, and recommended follow-up analysis." />
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="copilot" className="space-y-5">
          <Card>
            <CardHeader>
              <CardTitle>AI Research Copilot</CardTitle>
              <CardDescription>Ask natural language questions and route them to the correct SDOH analytical module.</CardDescription>
            </CardHeader>
            <CardContent className="grid gap-5 xl:grid-cols-[.9fr_1.1fr]">
              <div className="space-y-4">
                <div className="flex gap-2">
                  <Input value={query} onChange={(event) => setQuery(event.target.value)} />
                  <Button onClick={runQuery}>
                    <Search className="mr-2 h-4 w-4" />
                    Run
                  </Button>
                </div>
                <div className="grid gap-2">
                  {[
                    'Show relationship between food insecurity and readmission.',
                    'Generate Cox model for high-risk patients.',
                    'Create publication-ready Table 1.',
                    'Map housing instability hotspots.',
                  ].map((prompt) => (
                    <button
                      key={prompt}
                      type="button"
                      onClick={() => setQuery(prompt)}
                      className="rounded-xl border bg-white px-3 py-2 text-left text-sm transition hover:border-blue-300 hover:bg-blue-50"
                    >
                      {prompt}
                    </button>
                  ))}
                </div>
              </div>
              <ResultBlock value={queryResult} empty="Copilot result will appear here after running a research query." />
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="publication" className="space-y-5">
          <Card>
            <CardHeader>
              <CardTitle>Publication Center</CardTitle>
              <CardDescription>Generate manuscript-ready tables, figures, interpretations, and downloadable evidence files.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-5">
              <div className="grid gap-3 md:grid-cols-3">
                <InlineStat label="Study Pack" value={publicationPack?.title ?? 'Publication Analytics Pack'} />
                <InlineStat label="Saved Outputs" value={summary?.saved_outputs ?? Object.keys(publicationPack?.artifacts ?? {}).length} />
                <InlineStat label="Approval" value="Publication review ready" />
              </div>
              <div className="grid gap-2 md:grid-cols-3 xl:grid-cols-6">
                {([
                  ['table1', 'Table 1', Table2],
                  ['regression', 'Regression Table', Activity],
                  ['summary', 'Methods Draft', FileText],
                ] as const).map(([action, label, Icon]) => (
                  <Button key={action} variant="outline" onClick={() => runPublicationAction(action)} disabled={Boolean(publicationBusy)}>
                    <Icon className="mr-2 h-4 w-4" />
                    {publicationBusy === action ? 'Working...' : label}
                  </Button>
                ))}
                {['Cox Table', 'Forest Plot', 'SHAP Figure'].map((label) => (
                  <Button key={label} variant="outline">
                    <FileText className="mr-2 h-4 w-4" />
                    {label}
                  </Button>
                ))}
              </div>
              <ResultBlock
                value={publicationResult}
                empty="Choose Table 1, Regression Table, or Methods Draft to create a publication output."
              />
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="export" className="space-y-5">
          <div className="grid gap-5 xl:grid-cols-[.9fr_1.1fr]">
            <Card>
              <CardHeader>
                <CardTitle>Export Center</CardTitle>
                <CardDescription>Download evidence outputs for review, appendix preparation, or publication submission.</CardDescription>
              </CardHeader>
              <CardContent className="flex flex-wrap gap-2">
                {(['csv', 'xlsx', 'pdf'] as const).map((format) => (
                  <Button key={format} variant="outline" onClick={() => downloadPublication(format)} disabled={Boolean(publicationBusy)}>
                    <Download className="mr-2 h-4 w-4" />
                    {publicationBusy === format ? 'Preparing...' : format.toUpperCase()}
                  </Button>
                ))}
                {['DOCX', 'PPTX', 'PNG', 'SVG'].map((format) => (
                  <Button key={format} variant="outline">
                    <Download className="mr-2 h-4 w-4" />
                    {format}
                  </Button>
                ))}
              </CardContent>
            </Card>
            <Card>
              <CardHeader>
                <CardTitle>Governance Center</CardTitle>
                <CardDescription>Pack 9 controls for audit trail, feature flags, RBAC, and approval checkpoints.</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid gap-3 md:grid-cols-2">
                  {['Audit Trail', 'Feature Flags', 'RBAC', 'Analysis Approval', 'Publication Approval', 'Data Lineage'].map((item) => (
                    <div key={item} className="rounded-xl border bg-slate-50 p-3">
                      <ShieldCheck className="h-4 w-4 text-emerald-600" />
                      <p className="mt-2 text-sm font-semibold text-slate-950">{item}</p>
                    </div>
                  ))}
                </div>
                <div className="rounded-2xl border bg-white p-4">
                  <p className="font-semibold text-slate-950">Feature Flags</p>
                  <div className="mt-3 grid gap-2 md:grid-cols-3">
                    {featureFlags
                      ? (Object.entries(featureFlags) as Array<[keyof SdohFeatureFlags, boolean]>).map(([name, enabled]) => {
                          const path = name.replace('_module', '').replace('_simulator', '').replace('_suite', '') as
                            | 'causal'
                            | 'counterfactual'
                            | 'policy'
                            | 'publication'
                            | 'gis'
                            | 'survival';
                          return (
                            <button
                              key={name}
                              type="button"
                              onClick={() => toggleFlag(path, !enabled)}
                              className="rounded-xl border bg-slate-50 p-3 text-left transition hover:border-blue-300 hover:bg-blue-50"
                            >
                              <span className="block text-xs font-semibold uppercase text-slate-500">{name.replaceAll('_', ' ')}</span>
                              <Badge className={enabled ? 'mt-2 bg-emerald-100 text-emerald-700' : 'mt-2 bg-slate-100 text-slate-500'}>
                                {enabled ? 'Active' : 'Paused'}
                              </Badge>
                            </button>
                          );
                        })
                      : null}
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>

      <Card>
        <CardHeader>
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <CardTitle>Knowledge Graph Explorer</CardTitle>
          <CardDescription>Patient {'->'} SDOH {'->'} disease {'->'} outcome relationship map for traceable research paths.</CardDescription>
            </div>
            <Badge className="bg-emerald-100 text-emerald-700">Traceable</Badge>
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-5">
            {[
              ['Patient', Users],
              ['SDOH', HeartPulse],
              ['Disease', Activity],
              ['Outcome', BarChart3],
              ['Publication', FileText],
            ].map(([label, Icon], index) => (
              <div key={String(label)} className="relative rounded-2xl border bg-slate-50 p-4">
                <Icon className="h-5 w-5 text-blue-600" />
                <p className="mt-3 font-semibold text-slate-950">{String(label)}</p>
                {index < 4 ? <Network className="absolute -right-5 top-1/2 hidden h-5 w-5 text-slate-300 md:block" /> : null}
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <Sparkles className="h-5 w-5 text-blue-600" />
            <CardTitle>Research Studio Modules</CardTitle>
          </div>
          <CardDescription>All module cards remain available, now organized behind the workflow tabs above.</CardDescription>
        </CardHeader>
        <CardContent className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          {dashboardModules.map((module) => (
            <div key={module.id} className="rounded-2xl border bg-white p-4">
              <p className="font-semibold text-slate-950">{module.name}</p>
              <p className="mt-1 text-xs leading-5 text-slate-500">{module.description}</p>
            </div>
          ))}
        </CardContent>
      </Card>
    </div>
  );
}
