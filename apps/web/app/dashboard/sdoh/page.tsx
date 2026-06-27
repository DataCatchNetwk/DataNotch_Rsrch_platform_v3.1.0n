'use client';

import { useEffect, useMemo, useState } from 'react';
import { Activity, BrainCircuit, DatabaseZap, Download, FileText, HeartPulse, Map, Search, Table2, Users } from 'lucide-react';

import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
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

export default function SdohIntelligencePage() {
  const [overview, setOverview] = useState<SdohOverview | null>(null);
  const [summary, setSummary] = useState<SdohDashboardSummary | null>(null);
  const [dashboardModules, setDashboardModules] = useState<SdohDashboardModule[]>([]);
  const [analytics, setAnalytics] = useState<SdohAnalysisResponse[]>([]);
  const [cohort, setCohort] = useState<SdohCohortPreview | null>(null);
  const [datasetProfile, setDatasetProfile] = useState<SdohDatasetProfile | null>(null);
  const [featureFlags, setFeatureFlags] = useState<SdohFeatureFlags | null>(null);
  const [publicationPack, setPublicationPack] = useState<SdohPublicationPack | null>(null);
  const [query, setQuery] = useState('Show readmission risk by housing instability');
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
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <HeartPulse className="h-6 w-6 text-blue-600" />
            <h1 className="text-2xl font-bold text-slate-900">SDOH Intelligence</h1>
          </div>
          <p className="mt-1 text-sm text-slate-500">
            SDOH, clinical outcomes, precision medicine, and population health analytics wired into the research pipeline.
          </p>
        </div>
        <Button variant="outline" onClick={load} disabled={loading}>
          <DatabaseZap className="mr-2 h-4 w-4" />
          {loading ? 'Syncing...' : 'Refresh SDOH Data'}
        </Button>
      </div>

      {error ? (
        <Alert className="border-amber-200 bg-amber-50 text-amber-900">
          <AlertTitle>SDOH service notice</AlertTitle>
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      ) : null}

      <div className="grid gap-4 md:grid-cols-4">
        {[
          { icon: Users, label: 'Cohort Size', value: overview?.cohort_size ?? '--' },
          { icon: BrainCircuit, label: 'Analytics Layers', value: overview?.analytics_layers ?? '--' },
          { icon: Activity, label: 'Dashboard Modules', value: overview?.dashboard_modules ?? '--' },
          { icon: Map, label: 'Ready Outputs', value: overview?.ready_outputs.length ?? '--' },
        ].map(({ icon: Icon, label, value }) => (
          <Card key={label}>
            <CardContent className="p-5">
              <Icon className="h-5 w-5 text-blue-600" />
              <p className="mt-3 text-xs font-medium uppercase tracking-wide text-slate-500">{label}</p>
              <p className="mt-1 text-2xl font-bold text-slate-900">{value}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Integrated Domains</CardTitle>
          <CardDescription>End-to-end domains now represented in API, analytics outputs, and pipeline artifacts.</CardDescription>
        </CardHeader>
        <CardContent className="flex flex-wrap gap-2">
          {['SDOH', 'Clinical Outcomes', 'Precision Medicine', 'Population Health'].map((domain) => (
            <Badge key={domain} className="border-blue-200 bg-blue-50 px-3 py-1 text-blue-700">
              {domain}
            </Badge>
          ))}
        </CardContent>
      </Card>

      <div className="grid gap-6 xl:grid-cols-[1fr_.9fr]">
        <Card>
          <CardHeader>
            <CardTitle>Pack Integration Controls</CardTitle>
            <CardDescription>Feature flags, audit-ready modules, and final integration controls from the SDOH packs.</CardDescription>
          </CardHeader>
          <CardContent className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
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
                      className="rounded-xl border bg-white p-3 text-left transition hover:border-blue-300 hover:bg-blue-50"
                    >
                      <span className="block text-sm font-semibold text-slate-900">{name.replaceAll('_', ' ')}</span>
                      <Badge className={enabled ? 'mt-2 bg-emerald-100 text-emerald-700' : 'mt-2 bg-slate-100 text-slate-500'}>
                        {enabled ? 'Active' : 'Paused'}
                      </Badge>
                    </button>
                  );
                })
              : null}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>DataBank Profile</CardTitle>
            <CardDescription>Dataset registry, missingness profile, and publication-ready data checks.</CardDescription>
          </CardHeader>
          <CardContent className="grid gap-3 sm:grid-cols-3">
            <div className="rounded-xl border bg-slate-50 p-3">
              <p className="text-xs uppercase text-slate-500">Dataset</p>
              <p className="mt-1 font-semibold">{datasetProfile?.dataset_id ?? 'demo-sdoh'}</p>
            </div>
            <div className="rounded-xl border bg-slate-50 p-3">
              <p className="text-xs uppercase text-slate-500">Rows</p>
              <p className="mt-1 font-semibold">{datasetProfile?.rows ?? '--'}</p>
            </div>
            <div className="rounded-xl border bg-slate-50 p-3">
              <p className="text-xs uppercase text-slate-500">Missing Fields</p>
              <p className="mt-1 font-semibold">{datasetProfile?.missing_report.filter((item) => item.missing_count > 0).length ?? 0}</p>
            </div>
          </CardContent>
        </Card>
      </div>

      <ResearchChartStudio
        title="SDOH Research Architecture"
        description="All SDOH research intelligence layers are selectable through the same visualization engine used by Results and Reports."
        records={chartRecords}
        initialMode="funnel"
      />

      <div className="grid gap-6 lg:grid-cols-[1.1fr_.9fr]">
        <Card>
          <CardHeader>
            <CardTitle>Natural Language Query Workbench</CardTitle>
            <CardDescription>Routes research questions to the correct SDOH analytical module.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex gap-2">
              <Input value={query} onChange={(event) => setQuery(event.target.value)} />
              <Button onClick={runQuery}>
                <Search className="mr-2 h-4 w-4" />
                Run
              </Button>
            </div>
            <div className="rounded-xl border bg-slate-50 p-4">
              <p className="font-semibold text-slate-900">{queryResult?.module ?? 'Query result will appear here'}</p>
              <p className="mt-1 text-sm text-slate-600">{queryResult?.interpretation ?? 'Try survival, Cox, SHAP, map, readmission risk, equity, publication, intervention, or counterfactual queries.'}</p>
            </div>
            <Button variant="outline" onClick={runCausal}>
              Run Causal + Policy Simulation
            </Button>
            <div className="rounded-xl border bg-blue-50 p-4 text-sm text-blue-950">
              {causalResult ? JSON.stringify(causalResult, null, 2).slice(0, 520) : 'Causal simulation results will appear here with policy impact and recommended next analysis.'}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Cohort Preview</CardTitle>
            <CardDescription>Sample SDOH cohort rows available to downstream analysis.</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="mb-3 text-sm font-semibold text-slate-700">{cohort?.count ?? 0} eligible sample records</div>
            <div className="max-h-72 overflow-auto rounded-xl border">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50 text-slate-500">
                  <tr>
                    {['Patient', 'Age', 'County', 'Income', 'Readmit'].map((head) => (
                      <th key={head} className="px-3 py-2">{head}</th>
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
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Publication Analytics Suite</CardTitle>
          <CardDescription>Generate journal-ready tables, manuscript language, and downloadable evidence files.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-3 md:grid-cols-3">
            <div className="rounded-xl border bg-white p-4">
              <p className="text-xs uppercase text-slate-500">Study Pack</p>
              <p className="mt-1 font-semibold text-slate-900">{publicationPack?.title ?? 'Publication Analytics Pack'}</p>
            </div>
            <div className="rounded-xl border bg-white p-4">
              <p className="text-xs uppercase text-slate-500">Saved Outputs</p>
              <p className="mt-1 font-semibold text-slate-900">{summary?.saved_outputs ?? Object.keys(publicationPack?.artifacts ?? {}).length}</p>
            </div>
            <div className="rounded-xl border bg-white p-4">
              <p className="text-xs uppercase text-slate-500">Interpretation</p>
              <p className="mt-1 text-sm text-slate-600">{publicationPack?.interpretation ?? 'Publication outputs are synced after refresh.'}</p>
            </div>
          </div>

          <div className="grid gap-3 lg:grid-cols-[1fr_.8fr]">
            <div className="rounded-xl border bg-slate-50 p-4">
              <p className="font-semibold text-slate-900">Create publication outputs</p>
              <p className="mt-1 text-sm text-slate-600">
                Use these buttons to generate a baseline Table 1, model result table, or manuscript-ready result language from the active SDOH cohort.
              </p>
              <div className="mt-4 flex flex-wrap gap-2">
                <Button variant="outline" onClick={() => runPublicationAction('table1')} disabled={Boolean(publicationBusy)}>
                  <Table2 className="mr-2 h-4 w-4" />
                  {publicationBusy === 'table1' ? 'Generating...' : 'Generate Table 1'}
                </Button>
                <Button variant="outline" onClick={() => runPublicationAction('regression')} disabled={Boolean(publicationBusy)}>
                  <Activity className="mr-2 h-4 w-4" />
                  {publicationBusy === 'regression' ? 'Generating...' : 'Regression Table'}
                </Button>
                <Button variant="outline" onClick={() => runPublicationAction('summary')} disabled={Boolean(publicationBusy)}>
                  <FileText className="mr-2 h-4 w-4" />
                  {publicationBusy === 'summary' ? 'Writing...' : 'Manuscript Summary'}
                </Button>
              </div>
            </div>

            <div className="rounded-xl border bg-blue-50 p-4">
              <p className="font-semibold text-blue-950">Download evidence file</p>
              <p className="mt-1 text-sm text-blue-900">Export the active publication table for review, sharing, or appendix preparation.</p>
              <div className="mt-4 flex flex-wrap gap-2">
                {(['csv', 'xlsx', 'pdf'] as const).map((format) => (
                  <Button key={format} variant="secondary" onClick={() => downloadPublication(format)} disabled={Boolean(publicationBusy)}>
                    <Download className="mr-2 h-4 w-4" />
                    {publicationBusy === format ? 'Preparing...' : format.toUpperCase()}
                  </Button>
                ))}
              </div>
            </div>
          </div>

          <div className="rounded-xl border bg-white p-4">
            <p className="font-semibold text-slate-900">Latest generated output</p>
            <pre className="mt-2 max-h-56 overflow-auto whitespace-pre-wrap rounded-lg bg-slate-950 p-3 text-xs text-slate-50">
              {publicationResult
                ? JSON.stringify(publicationResult, null, 2)
                : 'Choose Generate Table 1, Regression Table, or Manuscript Summary to create a publication output.'}
            </pre>
          </div>
        </CardContent>
      </Card>

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        {dashboardModules.map((module) => (
          <Card key={module.id}>
            <CardContent className="p-4">
              <p className="font-semibold text-slate-900">{module.name}</p>
              <p className="mt-1 text-xs leading-5 text-slate-500">{module.description}</p>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
