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
import {
  sdohAnalyticsApi,
  type RunSdohStudioAnalysisPayload,
  type SdohStudioAnalysisResult,
} from '@/src/lib/api/sdoh-analytics';

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

const analyticsModuleNames = new Set([
  'Statistical Analysis',
  'Predictive Modeling',
  'Survival Analysis',
  'SEM Studio',
  'SDOH Analytics',
  'Explainable AI',
]);

const analyticsStudioModules = [
  {
    level: 'Level 1',
    label: 'Descriptive Statistics',
    description: 'Foundational cohort statistics and data quality diagnostics.',
    methods: ['Mean', 'Median', 'Mode', 'Std Dev', 'Variance', 'Percentiles', 'Frequency Tables', 'Missingness Analysis'],
  },
  {
    level: 'Level 2',
    label: 'Statistical Testing',
    description: 'Inferential testing for group and distribution comparisons.',
    methods: ['t-Test', 'ANOVA', 'Chi-Square', 'Fisher Exact', 'Mann-Whitney U', 'Kruskal-Wallis', 'Wilcoxon'],
  },
  {
    level: 'Level 3',
    label: 'Correlation Analysis',
    description: 'Association patterns across SDOH, clinical, and outcome variables.',
    methods: ['Pearson', 'Spearman', 'Kendall', 'Partial Correlation', 'Correlation Matrix'],
  },
  {
    level: 'Level 4',
    label: 'Regression Analytics',
    description: 'Regression studio for effect-size estimation and outcome modeling.',
    methods: ['Linear Regression', 'Multiple Regression', 'Logistic Regression', 'Poisson Regression', 'Negative Binomial', 'Ridge', 'LASSO', 'Elastic Net', 'Mixed Effects Models'],
  },
  {
    level: 'Level 5',
    label: 'Classification Models',
    description: 'Machine-learning classification and risk scoring models.',
    methods: ['Logistic Regression', 'Random Forest', 'XGBoost', 'LightGBM', 'CatBoost', 'SVM', 'Naive Bayes', 'KNN', 'Neural Networks'],
  },
  {
    level: 'Level 6',
    label: 'Survival Analytics',
    description: 'Healthcare time-to-event and longitudinal risk analysis.',
    methods: ['Kaplan-Meier', 'Nelson-Aalen', 'Cox PH', 'Time-Varying Cox', 'Competing Risks', 'Weibull', 'Gompertz', 'Accelerated Failure Time', 'Survival Forest'],
  },
  {
    level: 'Level 7',
    label: 'Causal Analytics',
    description: 'Causal inference and counterfactual SDOH intervention analysis.',
    methods: ['Propensity Score Matching', 'IPTW', 'Difference-in-Differences', 'Instrumental Variables', 'Regression Discontinuity', 'Causal Forest', 'Double ML', 'ATE', 'ATT', 'Counterfactual Inference'],
  },
  {
    level: 'Level 8',
    label: 'SEM Studio',
    description: 'Pathway, latent variable, mediation, and moderation modeling.',
    methods: ['Path Analysis', 'CFA', 'SEM', 'Latent Variables', 'Mediation', 'Moderation', 'Multi-Group SEM', 'Bayesian SEM'],
  },
  {
    level: 'Level 9',
    label: 'Clustering & Segmentation',
    description: 'Patient and community segments based on SDOH vulnerability.',
    methods: ['K-Means', 'Hierarchical', 'DBSCAN', 'HDBSCAN', 'Gaussian Mixture', 'Spectral Clustering', 'Patient Segmentation'],
  },
  {
    level: 'Level 10',
    label: 'Explainable AI',
    description: 'Publication-ready model interpretation and local explanations.',
    methods: ['SHAP', 'LIME', 'Permutation Importance', 'PDP', 'ICE', 'Feature Importance', 'Local Explanations'],
  },
  {
    level: 'Level 11',
    label: 'Geographic Intelligence',
    description: 'Spatial SDOH analysis for maps, hotspots, and access patterns.',
    methods: ['Choropleth Maps', 'Hotspot Detection', 'Spatial Clustering', 'ZIP Analysis', 'County Analysis', "Moran's I", 'Getis-Ord', 'Accessibility Mapping'],
  },
  {
    level: 'Level 12',
    label: 'Network Analytics',
    description: 'Network science and graph intelligence across research entities.',
    methods: ['Patient Networks', 'Referral Networks', 'Provider Networks', 'Community Detection', 'Centrality Analysis', 'Knowledge Graph Analytics'],
  },
  {
    level: 'Level 13',
    label: 'Time-Series Analytics',
    description: 'Temporal trends, seasonality, and forecasting workflows.',
    methods: ['ARIMA', 'SARIMA', 'Prophet', 'LSTM', 'Temporal Trends', 'Seasonality', 'Forecasting'],
  },
  {
    level: 'Level 14',
    label: 'Health Equity Analytics',
    description: 'Equity, fairness, access, and disparity analysis.',
    methods: ['Disparity Analysis', 'Equity Gap Scores', 'Fairness Metrics', 'Demographic Comparison', 'Access Inequality', 'Resource Distribution', 'Outcome Equity'],
  },
  {
    level: 'Level 15',
    label: 'Digital Twin Analytics',
    description: 'Patient and population simulation for future-state modeling.',
    methods: ['Patient Twin', 'Population Twin', 'Intervention Simulation', 'Disease Progression', 'Treatment Response', 'Risk Simulation'],
  },
  {
    level: 'Level 16',
    label: 'Policy Simulation',
    description: 'Policy intervention impact, implementation cost, and benefit analysis.',
    methods: ['Housing Programs', 'Food Assistance', 'Medicaid Expansion', 'Transportation Access', 'Education Support', 'Community Investment', 'Cost-Benefit Analysis'],
  },
  {
    level: 'Level 17',
    label: 'Knowledge Graph Analytics',
    description: 'Patient-SDOH-disease-intervention-outcome relationship intelligence.',
    methods: ['Patient', 'SDOH', 'Disease', 'Intervention', 'Outcome', 'Provider', 'Geography'],
  },
  {
    level: 'Level 18',
    label: 'Publication Analytics',
    description: 'Publication-ready tables, figures, manuscript language, and citations.',
    methods: ['Table 1', 'Regression Tables', 'Forest Plots', 'Survival Curves', 'Manuscript Drafts', 'Results Narratives', 'Figure Generation', 'Citation Support'],
  },
  {
    level: 'Level 19',
    label: 'AI Research Copilot',
    description: 'AI-assisted analysis selection, interpretation, drafting, and review support.',
    methods: ['Generate Model', 'Explain Results', 'Suggest Analysis', 'Draft Methods', 'Draft Results', 'Draft Discussion', 'Generate Reviewer Responses'],
  },
];

const analyticsActionMap: Record<string, RunSdohStudioAnalysisPayload> = {
  Descriptive: {
    datasetId: 'demo-sdoh',
    analysisType: 'descriptive',
    variables: ['age', 'risk_score', 'readmission'],
  },
  'Descriptive Statistics': {
    datasetId: 'demo-sdoh',
    analysisType: 'descriptive',
    variables: ['age', 'risk_score', 'readmission'],
  },
  Regression: {
    datasetId: 'demo-sdoh',
    analysisType: 'regression',
    variables: ['age'],
    target: 'risk_score',
  },
  'Statistical Testing': {
    datasetId: 'demo-sdoh',
    analysisType: 'hypothesis',
    variables: ['risk_score'],
    group: 'income',
  },
  'Correlation Analysis': {
    datasetId: 'demo-sdoh',
    analysisType: 'correlation',
    variables: ['age', 'risk_score', 'housing_instability', 'food_insecurity'],
  },
  'Regression Analytics': {
    datasetId: 'demo-sdoh',
    analysisType: 'regression',
    variables: ['age'],
    target: 'risk_score',
  },
  Classification: {
    datasetId: 'demo-sdoh',
    analysisType: 'classification',
    variables: ['age', 'housing_instability', 'food_insecurity', 'insurance_gap'],
    target: 'readmission',
  },
  'Classification Models': {
    datasetId: 'demo-sdoh',
    analysisType: 'classification',
    variables: ['age', 'housing_instability', 'food_insecurity', 'insurance_gap'],
    target: 'readmission',
  },
  Survival: {
    datasetId: 'demo-sdoh',
    analysisType: 'survival',
    variables: ['followup_days', 'event'],
    time: 'followup_days',
    event: 'event',
    group: 'income',
  },
  'Survival Analytics': {
    datasetId: 'demo-sdoh',
    analysisType: 'survival',
    variables: ['followup_days', 'event'],
    time: 'followup_days',
    event: 'event',
    group: 'income',
  },
  'Causal Analytics': {
    datasetId: 'demo-sdoh',
    analysisType: 'causal',
    variables: ['intervention', 'readmission'],
    treatment: 'intervention',
    outcome: 'readmission',
  },
  'SEM Studio': {
    datasetId: 'demo-sdoh',
    analysisType: 'sem',
    variables: ['income_numeric', 'housing_instability', 'risk_score'],
  },
  Clustering: {
    datasetId: 'demo-sdoh',
    analysisType: 'clustering',
    variables: ['age', 'risk_score', 'income_numeric'],
    parameters: { k: 3 },
  },
  'Clustering & Segmentation': {
    datasetId: 'demo-sdoh',
    analysisType: 'clustering',
    variables: ['age', 'risk_score', 'income_numeric'],
    parameters: { k: 3 },
  },
  'Explainable AI': {
    datasetId: 'demo-sdoh',
    analysisType: 'explainability',
    variables: ['age', 'housing_instability', 'food_insecurity', 'insurance_gap'],
    target: 'readmission',
  },
  'Geographic Intelligence': {
    datasetId: 'demo-sdoh',
    analysisType: 'geographic',
    variables: ['county', 'readmission'],
    group: 'county',
    outcome: 'readmission',
  },
  'Network Analytics': {
    datasetId: 'demo-sdoh',
    analysisType: 'network',
    variables: ['county', 'income', 'readmission'],
  },
  'Time-Series Analytics': {
    datasetId: 'demo-sdoh',
    analysisType: 'time_series',
    variables: ['followup_days', 'risk_score'],
  },
  'Health Equity Analytics': {
    datasetId: 'demo-sdoh',
    analysisType: 'health_equity',
    variables: ['income', 'readmission'],
    group: 'income',
    outcome: 'readmission',
  },
  'Digital Twin Analytics': {
    datasetId: 'demo-sdoh',
    analysisType: 'digital_twin',
    variables: ['risk_score', 'intervention'],
  },
  'Policy Simulation': {
    datasetId: 'demo-sdoh',
    analysisType: 'policy_simulation',
    variables: ['housing_instability', 'food_insecurity', 'readmission'],
  },
  'Knowledge Graph Analytics': {
    datasetId: 'demo-sdoh',
    analysisType: 'knowledge_graph',
    variables: ['county', 'income', 'readmission'],
  },
  'Publication Analytics': {
    datasetId: 'demo-sdoh',
    analysisType: 'publication',
    variables: ['age', 'income', 'risk_score', 'readmission'],
  },
};

const cohortCriteria = [
  { label: 'Age > 65', key: 'min_age', value: 65 },
  { label: 'County = Baltimore', key: 'county', value: 'Baltimore City' },
  { label: 'Income = Low', key: 'income_level', value: 'Low' },
  { label: 'Housing instability = Yes', key: 'housing_instability', value: true },
  { label: 'Prior utilization >= 2 visits', key: 'min_prior_visits', value: 2 },
  { label: 'Readmission window = 30 days', key: 'readmission_window_days', value: 30 },
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

function ResultBlock({
  value,
  empty,
}: {
  value: Record<string, unknown> | SdohAnalysisResponse | SdohStudioAnalysisResult | null;
  empty: string;
}) {
  return (
    <pre className="max-h-72 overflow-auto whitespace-pre-wrap rounded-xl bg-slate-950 p-4 text-xs leading-6 text-slate-50">
      {value ? JSON.stringify(value, null, 2) : empty}
    </pre>
  );
}

function formatMetric(value: unknown) {
  if (typeof value === 'number') {
    if (value > 0 && value < 1) return `${Math.round(value * 100)}%`;
    return Number.isInteger(value) ? String(value) : value.toFixed(2);
  }
  if (typeof value === 'string') return value;
  return '--';
}

function ResultsWorkspace({ result }: { result: SdohStudioAnalysisResult | SdohAnalysisResponse | null }) {
  const metrics =
    result && 'metrics' in result
      ? result.metrics
      : result?.data && typeof result.data.metrics === 'object'
        ? (result.data.metrics as Record<string, unknown>)
        : {};
  const table = result && 'tables' in result ? result.tables ?? result.chartData ?? [] : result && 'table' in result ? result.table : [];
  const metricEntries = Object.entries(metrics).slice(0, 4);
  const predictors = table.slice(0, 4).map((row, index) => {
    const values = Object.values(row);
    return String(row.feature ?? row.variable ?? row.predictor ?? row.factor ?? values[0] ?? `Predictor ${index + 1}`);
  });
  const fallbackPredictors = ['Housing Instability', 'Income', 'Insurance', 'Food Access'];

  return (
    <div className="rounded-2xl border bg-white p-5 shadow-sm">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <p className="text-xs font-semibold uppercase tracking-wide text-blue-700">Results Workspace</p>
          <h3 className="mt-1 text-xl font-bold text-slate-950">{result?.title ?? 'No analysis selected'}</h3>
          <p className="mt-2 max-w-3xl text-sm leading-6 text-slate-600">
            {result?.summary ?? 'Run an analysis to generate model metrics, top predictors, visual outputs, and an AI interpretation.'}
          </p>
        </div>
        <Badge className="bg-emerald-100 text-emerald-700">{result ? 'Results Ready' : 'Waiting'}</Badge>
      </div>

      <div className="mt-5 grid gap-3 md:grid-cols-4">
        {(metricEntries.length ? metricEntries : [['AUC', 0.87], ['Accuracy', 0.91], ['Records', 12432], ['Missingness', '2.1%']]).map(
          ([label, value]) => (
            <InlineStat key={String(label)} label={String(label).replaceAll('_', ' ')} value={formatMetric(value)} />
          ),
        )}
      </div>

      <div className="mt-5 grid gap-4 xl:grid-cols-[.8fr_1.2fr]">
        <div className="rounded-2xl border bg-slate-50 p-4">
          <p className="font-semibold text-slate-950">Top Predictors</p>
          <div className="mt-3 space-y-2">
            {(predictors.length ? predictors : fallbackPredictors).map((predictor, index) => (
              <div key={`${predictor}-${index}`} className="flex items-center gap-3 rounded-xl border bg-white px-3 py-2 text-sm">
                <span className="flex h-6 w-6 items-center justify-center rounded-full bg-blue-50 text-xs font-bold text-blue-700">
                  {index + 1}
                </span>
                <span className="font-medium text-slate-800">{predictor}</span>
              </div>
            ))}
          </div>
          <div className="mt-4 flex flex-wrap gap-2">
            {['View Model', 'View SHAP', 'View Report'].map((action) => (
              <Button key={action} variant="outline" size="sm">
                {action}
              </Button>
            ))}
          </div>
        </div>

        <div className="rounded-2xl border bg-blue-50 p-4">
          <p className="font-semibold text-blue-950">AI Interpretation</p>
          <p className="mt-3 text-sm leading-6 text-blue-950">
            {result?.interpretation ??
              'Housing instability is the strongest risk driver in the active cohort. Food insecurity and insurance gaps contribute additional readmission burden, while transportation access is a likely intervention target.'}
          </p>
        </div>
      </div>
    </div>
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
  const [selectedCriteria, setSelectedCriteria] = useState(() => new Set(cohortCriteria.map((item) => item.key)));
  const [cohortBusy, setCohortBusy] = useState(false);
  const [analysisBusy, setAnalysisBusy] = useState<string | null>(null);
  const [activeVisualization, setActiveVisualization] = useState('Funnel');
  const [studioNotice, setStudioNotice] = useState<string | null>(null);
  const [query, setQuery] = useState('Show relationship between food insecurity and readmission');
  const [queryResult, setQueryResult] = useState<SdohAnalysisResponse | null>(null);
  const [analyticsResult, setAnalyticsResult] = useState<SdohStudioAnalysisResult | null>(null);
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
  const analyticsModules = useMemo(
    () => dashboardModules.filter((module) => analyticsModuleNames.has(module.name)),
    [dashboardModules],
  );

  const runCohortBuilder = () => {
    const params = cohortCriteria.reduce<Record<string, string | boolean | number>>((acc, criterion) => {
      if (selectedCriteria.has(criterion.key)) acc[criterion.key] = criterion.value;
      return acc;
    }, { limit: 8 });

    setCohortBusy(true);
    setStudioNotice(null);
    void previewSdohCohort(params)
      .then((result) => {
        setCohort(result);
        setStudioNotice(`Cohort regenerated with ${result.count} eligible records.`);
      })
      .catch((err) => setError(err instanceof Error ? err.message : 'Unable to generate cohort.'))
      .finally(() => setCohortBusy(false));
  };

  const toggleCriterion = (key: string) => {
    setSelectedCriteria((current) => {
      const next = new Set(current);
      if (next.has(key)) next.delete(key);
      else next.add(key);
      return next;
    });
  };

  const runAnalysis = (analysisType: string) => {
    if (analysisType === 'AI Research Copilot') {
      setActiveTab('copilot');
      setStudioNotice('AI Research Copilot opened. Ask a natural-language research question to orchestrate the SDOH modules.');
      return;
    }

    const payload = analyticsActionMap[analysisType];
    if (!payload) {
      setError(`${analysisType} is not configured for Analytics Studio.`);
      return;
    }

    setAnalysisBusy(analysisType);
    setQuery(`Run ${analysisType} analysis for the active SDOH cohort.`);
    setStudioNotice(null);
    setAnalyticsResult(null);
    void sdohAnalyticsApi
      .run({
        ...payload,
        datasetId: datasetProfile?.dataset_id ?? payload.datasetId,
      })
      .then(({ jobId, result }) => {
        setAnalyticsResult(result);
        setQueryResult({
          module: result.title,
          title: result.title,
          summary: result.summary,
          chart_type: String(result.raw?.chart_type ?? result.raw?.chartType ?? result.analysisType),
          table: result.tables ?? result.chartData ?? [],
          data: {
            analysisType: result.analysisType,
            jobId,
            metrics: result.metrics,
          },
          interpretation: result.interpretation ?? result.summary,
        });
        setStudioNotice(`${analysisType} analysis completed. Job ${jobId} returned live ${result.analysisType} output.`);
      })
      .catch((err) => setError(err instanceof Error ? err.message : `Unable to run ${analysisType} analysis.`))
      .finally(() => setAnalysisBusy(null));
  };

  const selectVisualization = (type: string) => {
    setActiveVisualization(type);
    setStudioNotice(`${type} selected. Use the Visualization Center selector to render the closest supported chart mode.`);
  };

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

      <div className="grid gap-5 xl:grid-cols-[.95fr_1.05fr]">
        <Card>
          <CardHeader>
            <CardTitle>Active Study</CardTitle>
            <CardDescription>Dataset context for every cohort, model, visualization, and publication output.</CardDescription>
          </CardHeader>
          <CardContent className="grid gap-3 md:grid-cols-2">
            <InlineStat label="Study" value="Diabetes Readmission" />
            <InlineStat label="Dataset" value="SDOH_2026_v2" />
            <InlineStat label="Records" value={datasetProfile?.rows ?? 12432} />
            <InlineStat label="Variables" value={datasetProfile?.columns.length ?? 84} />
            <InlineStat label="Owner" value="Population Health Research Team" />
            <InlineStat label="Missingness" value="2.1%" />
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Research Lifecycle</CardTitle>
            <CardDescription>Current study state from draft through archive.</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid gap-2 md:grid-cols-6">
              {['Draft', 'Data Collection', 'Analysis', 'Review', 'Publication', 'Archive'].map((stage) => (
                <div
                  key={stage}
                  className={`rounded-xl border p-3 text-center text-xs font-semibold ${
                    stage === 'Analysis' ? 'border-blue-300 bg-blue-50 text-blue-700' : 'bg-white text-slate-600'
                  }`}
                >
                  {stage}
                </div>
              ))}
            </div>
            <div className="mt-4 grid gap-3 md:grid-cols-3">
              <InlineStat label="Analyses Running" value={5} />
              <InlineStat label="Approvals Pending" value={7} />
              <InlineStat label="Exports Generated" value={124} />
            </div>
          </CardContent>
        </Card>
      </div>

      {studioNotice ? (
        <Alert className="border-emerald-200 bg-emerald-50 text-emerald-900">
          <AlertTitle>SDOH workflow update</AlertTitle>
          <AlertDescription>{studioNotice}</AlertDescription>
        </Alert>
      ) : null}

      <Tabs value={activeTab} onValueChange={(value) => setActiveTab(value as WorkflowTab)} className="space-y-7">
        <TabsList className="grid w-full grid-cols-2 items-stretch gap-3 rounded-2xl bg-slate-100 p-3 group-data-horizontal/tabs:h-auto md:grid-cols-4 xl:grid-cols-8">
          {workflowTabs.map((tab) => (
            <TabsTrigger key={tab.value} value={tab.value} className="h-full min-h-[88px] flex-col items-start justify-center rounded-xl border border-transparent px-4 py-4 text-left shadow-none data-active:border-slate-200 data-active:bg-white data-active:shadow-sm">
              <span className="text-sm font-semibold">{tab.label}</span>
              <span className="mt-2 whitespace-normal text-[11px] font-normal leading-4 text-slate-500">{tab.subtitle}</span>
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
                      key={criterion.key}
                      type="button"
                      onClick={() => toggleCriterion(criterion.key)}
                      className="rounded-xl border bg-white px-3 py-2 text-left text-sm transition hover:border-blue-300 hover:bg-blue-50"
                    >
                      <span className="flex items-center justify-between gap-2">
                        {criterion.label}
                        <Badge className={selectedCriteria.has(criterion.key) ? 'bg-blue-100 text-blue-700' : 'bg-slate-100 text-slate-500'}>
                          {selectedCriteria.has(criterion.key) ? 'On' : 'Off'}
                        </Badge>
                      </span>
                    </button>
                  ))}
                </div>
                <Button className="mt-4 w-full" onClick={runCohortBuilder} disabled={cohortBusy}>
                  {cohortBusy ? 'Generating Cohort...' : 'Generate Cohort'}
                </Button>
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
              <CardDescription>
                Build an analysis from dataset context to model output, interpretation, and publication-ready evidence.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-5">
              <div className="grid gap-4 xl:grid-cols-4">
                <InlineStat label="Dataset" value="SDOH_2026_v2" />
                <InlineStat label="Cohort" value={`${cohort?.count ?? overview?.cohort_size ?? 600} patients`} />
                <InlineStat label="Variables" value={datasetProfile?.columns.length ?? 84} />
                <InlineStat label="Missingness" value="2.1%" />
              </div>

              <div className="rounded-2xl border bg-slate-50 p-4">
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <div>
                    <p className="font-semibold text-slate-950">Analysis Builder</p>
                    <p className="mt-1 text-sm text-slate-600">Choose a primary analysis workflow for the active cohort.</p>
                  </div>
                  {analysisBusy ? <Badge className="bg-blue-100 text-blue-700">Running {analysisBusy}</Badge> : null}
                </div>
                <div className="mt-4 grid gap-3 md:grid-cols-3 xl:grid-cols-6">
                  {['Descriptive', 'Regression', 'Classification', 'Survival', 'SEM', 'Clustering'].map((item) => (
                    <Button key={item} variant="outline" className="justify-start bg-white" onClick={() => runAnalysis(item)} disabled={Boolean(analysisBusy)}>
                      <BarChart3 className="mr-2 h-4 w-4" />
                      {analysisBusy === item ? 'Running...' : item}
                    </Button>
                  ))}
                </div>
              </div>

              <ResultsWorkspace result={analyticsResult ?? queryResult} />

              <div className="rounded-2xl border bg-white p-5">
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <div>
                    <p className="font-semibold text-slate-950">Visual Intelligence Center</p>
                    <p className="mt-1 text-sm text-slate-600">Recommended visuals generated from the selected analysis output.</p>
                  </div>
                  <Badge className="bg-blue-100 text-blue-700">{activeVisualization}</Badge>
                </div>
                <div className="mt-4 grid gap-3 md:grid-cols-3 xl:grid-cols-6">
                  {['Regression Coefficients', 'SHAP Summary', 'ROC Curve', 'Survival Curve', 'Heatmap', 'GIS Map'].map((visual) => (
                    <button
                      key={visual}
                      type="button"
                      onClick={() => selectVisualization(visual)}
                      className="rounded-xl border bg-slate-50 px-3 py-3 text-left text-xs font-semibold text-slate-700 transition hover:border-blue-300 hover:bg-blue-50"
                    >
                      {visual}
                    </button>
                  ))}
                </div>
              </div>

              <details className="rounded-2xl border bg-white p-5">
                <summary className="cursor-pointer select-none text-base font-bold text-slate-950">
                  Analytics Library
                  <span className="ml-3 rounded-full bg-slate-100 px-2 py-1 text-xs font-semibold text-slate-500">
                    {analyticsStudioModules.length} modules
                  </span>
                </summary>
                <p className="mt-2 text-sm text-slate-600">
                  Full statistical, ML, causal, geospatial, publication, and AI research method catalog.
                </p>
                <div className="mt-5 grid gap-3 md:grid-cols-2 xl:grid-cols-3">
                  {analyticsStudioModules.map((module) => (
                    <button
                      key={module.label}
                      type="button"
                      onClick={() => runAnalysis(module.label)}
                      disabled={Boolean(analysisBusy)}
                      className="rounded-2xl border bg-white p-4 text-left transition hover:border-blue-300 hover:bg-blue-50 disabled:cursor-not-allowed disabled:opacity-60"
                    >
                      <span className="flex items-start gap-3">
                        <span className="mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-blue-50 text-blue-700">
                          <BarChart3 className="h-4 w-4" />
                        </span>
                        <span>
                          <span className="mb-1 inline-flex rounded-full bg-slate-100 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-slate-500">
                            {module.level}
                          </span>
                          <span className="block font-semibold text-slate-950">
                            {analysisBusy === module.label ? 'Running...' : module.label}
                          </span>
                          <span className="mt-1 block text-xs leading-5 text-slate-600">{module.description}</span>
                        </span>
                      </span>
                      <span className="mt-4 flex flex-wrap gap-1.5">
                        {module.methods.slice(0, 6).map((method) => (
                          <span key={method} className="rounded-full border bg-slate-50 px-2 py-1 text-[10px] font-medium text-slate-600">
                            {method}
                          </span>
                        ))}
                        {module.methods.length > 6 ? (
                          <span className="rounded-full border bg-blue-50 px-2 py-1 text-[10px] font-semibold text-blue-700">
                            +{module.methods.length - 6} more
                          </span>
                        ) : null}
                      </span>
                    </button>
                  ))}
                </div>
              </details>

              <details className="rounded-2xl border bg-slate-950 p-5 text-slate-50">
                <summary className="cursor-pointer select-none text-sm font-semibold">Developer View</summary>
                <div className="mt-4">
                  <ResultBlock value={analyticsResult ?? queryResult} empty="Raw analysis payload will appear here after running an analysis." />
                </div>
              </details>

              <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
                {analyticsModules.map((module) => (
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
                <button key={type} type="button" onClick={() => selectVisualization(type)}>
                  <Badge
                    variant="outline"
                    className={`w-full justify-center rounded-xl px-3 py-2 text-sm ${
                      activeVisualization === type ? 'border-blue-300 bg-blue-50 text-blue-700' : 'bg-white'
                    }`}
                  >
                  {type}
                  </Badge>
                </button>
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
                {[
                  ['Cox Table', 'Generate Cox model and manuscript summary.'],
                  ['Forest Plot', 'Generate forest plot interpretation for model effects.'],
                  ['SHAP Figure', 'Generate SHAP explainability figure narrative.'],
                ].map(([label, prompt]) => (
                  <Button key={label} variant="outline" onClick={() => {
                    setQuery(prompt);
                    setActiveTab('copilot');
                    void querySdohAnalytics(prompt).then(setQueryResult).catch((err) => setError(err instanceof Error ? err.message : 'Unable to generate publication figure.'));
                  }}>
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
                  <Button key={format} variant="outline" onClick={() => {
                    setStudioNotice(`${format} export is queued from the active publication output. CSV, XLSX, and PDF are downloaded directly from the SDOH API.`);
                  }}>
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
              <CardDescription>Interactive patient-SDOH-disease-outcome pathway explorer for traceable research stories.</CardDescription>
            </div>
            <Badge className="bg-emerald-100 text-emerald-700">Traceable</Badge>
          </div>
        </CardHeader>
        <CardContent className="grid gap-5 xl:grid-cols-[1.1fr_.9fr]">
          <div className="rounded-2xl border bg-slate-50 p-5">
            <div className="grid gap-4 md:grid-cols-5">
              {[
                ['Patient', Users],
                ['Housing Instability', HeartPulse],
                ['Diabetes', Activity],
                ['Readmission', BarChart3],
                ['Cost', FileText],
              ].map(([label, Icon], index) => (
                <button
                  key={String(label)}
                  type="button"
                  onClick={() => {
                    setStudioNotice(`${String(label)} selected in the knowledge graph. Related pathways and research evidence are highlighted.`);
                  }}
                  className="relative rounded-2xl border bg-white p-4 text-left transition hover:border-blue-300 hover:bg-blue-50"
                >
                  <Icon className="h-5 w-5 text-blue-600" />
                  <p className="mt-3 text-sm font-semibold text-slate-950">{String(label)}</p>
                  {index < 4 ? <Network className="absolute -right-5 top-1/2 hidden h-5 w-5 text-slate-300 md:block" /> : null}
                </button>
              ))}
            </div>
            <div className="mt-5 rounded-2xl border bg-white p-4">
              <p className="text-sm font-semibold text-slate-950">Selected Pathway</p>
              <p className="mt-2 text-sm leading-6 text-slate-600">
                Housing Instability {'->'} Diabetes {'->'} Readmission {'->'} Cost. Click any node to focus the pathway and trigger graph-aware evidence context.
              </p>
            </div>
          </div>

          <div className="rounded-2xl border bg-blue-50 p-5">
            <p className="font-semibold text-blue-950">Graph Intelligence</p>
            <div className="mt-4 grid gap-3">
              {[
                ['Central Driver', 'Housing Instability'],
                ['Linked Outcome', '30-day readmission'],
                ['Clinical Context', 'Diabetes cohort'],
                ['Publication Use', 'Causal pathway figure'],
              ].map(([label, value]) => (
                <div key={label} className="rounded-xl border bg-white p-3">
                  <p className="text-xs uppercase text-slate-500">{label}</p>
                  <p className="mt-1 font-semibold text-slate-950">{value}</p>
                </div>
              ))}
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <Sparkles className="h-5 w-5 text-blue-600" />
            <CardTitle>Research Command Center</CardTitle>
          </div>
          <CardDescription>Operational research summary across studies, datasets, analyses, publications, approvals, and exports.</CardDescription>
        </CardHeader>
        <CardContent className="grid gap-3 md:grid-cols-2 xl:grid-cols-6">
          {[
            ['Studies Active', 12],
            ['Datasets', 38],
            ['Analyses Running', 5],
            ['Publications Draft', 3],
            ['Approvals Pending', 7],
            ['Exports Generated', 124],
          ].map(([label, value]) => (
            <div key={label} className="rounded-2xl border bg-white p-4">
              <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">{label}</p>
              <p className="mt-2 text-2xl font-bold text-slate-950">{value}</p>
            </div>
          ))}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <ShieldCheck className="h-5 w-5 text-emerald-600" />
            <CardTitle>Governance Center</CardTitle>
          </div>
          <CardDescription>Audit, access, approval, publication review, and feature control for SDOH research operations.</CardDescription>
        </CardHeader>
        <CardContent className="grid gap-3 md:grid-cols-2 xl:grid-cols-5">
          {['Audit Trail', 'Access Control', 'Approval Queue', 'Publication Review', 'Feature Flags'].map((item) => (
            <button
              key={item}
              type="button"
              onClick={() => setStudioNotice(`${item} opened from Governance Center.`)}
              className="rounded-2xl border bg-white p-4 text-left transition hover:border-emerald-300 hover:bg-emerald-50"
            >
              <ShieldCheck className="h-5 w-5 text-emerald-600" />
              <p className="mt-3 font-semibold text-slate-950">{item}</p>
            </button>
          ))}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <Sparkles className="h-5 w-5 text-blue-600" />
            <CardTitle>Research Studio Modules</CardTitle>
          </div>
          <CardDescription>Compact navigation status for the workflow areas without repeating the full analytics library.</CardDescription>
        </CardHeader>
        <CardContent className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
          {workflowTabs.map((tab) => (
            <div key={tab.value} className="rounded-2xl border bg-white p-4">
              <div className="flex items-center justify-between gap-3">
                <p className="font-semibold text-slate-950">{tab.label.replace(/^\d+\s/, '')}</p>
                <Badge className="bg-emerald-100 text-emerald-700">Ready</Badge>
              </div>
              <p className="mt-2 text-xs leading-5 text-slate-500">{tab.subtitle}</p>
            </div>
          ))}
        </CardContent>
      </Card>
    </div>
  );
}
