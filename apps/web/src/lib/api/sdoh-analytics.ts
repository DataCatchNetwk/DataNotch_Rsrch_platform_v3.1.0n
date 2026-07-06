import { apiUrl } from '@/lib/api-base';

export type SdohStudioAnalysisType =
  | 'descriptive'
  | 'hypothesis'
  | 'correlation'
  | 'regression'
  | 'classification'
  | 'survival'
  | 'causal'
  | 'sem'
  | 'clustering'
  | 'explainability'
  | 'geographic'
  | 'network'
  | 'time_series'
  | 'health_equity'
  | 'digital_twin'
  | 'policy_simulation'
  | 'knowledge_graph'
  | 'publication';

export interface RunSdohStudioAnalysisPayload {
  datasetId: string;
  analysisType: SdohStudioAnalysisType;
  variables: string[];
  target?: string;
  treatment?: string;
  outcome?: string;
  time?: string;
  event?: string;
  group?: string;
  parameters?: Record<string, unknown>;
}

export interface SdohStudioAnalysisResult {
  analysisType: SdohStudioAnalysisType;
  title: string;
  summary: string;
  metrics: Record<string, unknown>;
  tables?: Array<Record<string, unknown>>;
  chartData?: Array<Record<string, unknown>>;
  interpretation?: string;
  raw?: Record<string, unknown>;
}

const routeByType: Record<SdohStudioAnalysisType, string> = {
  descriptive: '/api/sdoh/analytics/descriptive',
  hypothesis: '/api/sdoh/analytics/correlation',
  correlation: '/api/sdoh/analytics/correlation',
  regression: '/api/sdoh/analytics/regression',
  classification: '/api/sdoh/analytics/classification',
  survival: '/api/sdoh/analytics/survival/cox',
  causal: '/api/sdoh/analytics/causal',
  sem: '/api/sdoh/analytics/sem',
  clustering: '/api/sdoh/analytics/clustering',
  explainability: '/api/sdoh/analytics/shap',
  geographic: '/api/sdoh/analytics/geographic',
  network: '/api/sdoh/analytics/network',
  time_series: '/api/sdoh/analytics/temporal',
  health_equity: '/api/sdoh/analytics/equity',
  digital_twin: '/api/sdoh/analytics/digital-twin',
  policy_simulation: '/api/sdoh/causal/policy-simulation',
  knowledge_graph: '/api/sdoh/analytics/network',
  publication: '/api/sdoh/analytics/publication',
};

function token() {
  if (typeof window === 'undefined') return null;
  try {
    return window.localStorage.getItem('auth_token') ?? window.sessionStorage.getItem('auth_token');
  } catch {
    return null;
  }
}

async function request<T>(path: string, init?: RequestInit): Promise<T> {
  const authToken = token();
  const response = await fetch(apiUrl(path), {
    ...init,
    cache: 'no-store',
    credentials: 'include',
    headers: {
      'Content-Type': 'application/json',
      ...(authToken ? { Authorization: `Bearer ${authToken}` } : {}),
      ...(init?.headers ?? {}),
    },
  });

  if (!response.ok) {
    throw new Error(`SDOH analytics request failed (${response.status})`);
  }

  return response.json() as Promise<T>;
}

function normalizeResult(type: SdohStudioAnalysisType, raw: Record<string, unknown>): SdohStudioAnalysisResult {
  const table = Array.isArray(raw.table) ? (raw.table as Array<Record<string, unknown>>) : undefined;
  const rows = Array.isArray(raw.rows) ? (raw.rows as Array<Record<string, unknown>>) : undefined;
  const chartData = Array.isArray(raw.chartData)
    ? (raw.chartData as Array<Record<string, unknown>>)
    : Array.isArray(raw.data)
      ? (raw.data as Array<Record<string, unknown>>)
      : table ?? rows;

  const metrics =
    raw.metrics && typeof raw.metrics === 'object'
      ? (raw.metrics as Record<string, unknown>)
      : {
          records: table?.length ?? rows?.length ?? chartData?.length ?? 0,
          chart_type: raw.chart_type ?? raw.chartType ?? 'table',
        };

  return {
    analysisType: type,
    title: String(raw.title ?? raw.module ?? `${type} analysis`),
    summary: String(raw.summary ?? raw.interpretation ?? `${type} analysis completed.`),
    metrics,
    tables: table ?? rows,
    chartData,
    interpretation: typeof raw.interpretation === 'string' ? raw.interpretation : undefined,
    raw,
  };
}

export const sdohAnalyticsApi = {
  run: async (payload: RunSdohStudioAnalysisPayload) => {
    const path = routeByType[payload.analysisType];
    const init: RequestInit =
      payload.analysisType === 'policy_simulation'
        ? {
            method: 'POST',
            body: JSON.stringify({
              policyName: 'Transportation navigation program',
              targetPopulation: 'high SDOH vulnerability cohort',
              baselineRate: 0.31,
              expectedEffect: 0.08,
              populationSize: 1200,
            }),
          }
        : {};
    const raw = await request<Record<string, unknown>>(path, init);
    return {
      jobId: `sdoh-${payload.analysisType}-${Date.now()}`,
      datasetId: payload.datasetId,
      result: normalizeResult(payload.analysisType, raw),
    };
  },
};
