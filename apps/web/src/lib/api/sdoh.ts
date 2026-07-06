import { apiUrl } from '@/lib/api-base';

export type SdohAnalysisResponse = {
  module: string;
  title: string;
  summary: string;
  chart_type: string;
  table: Array<Record<string, unknown>>;
  data: Record<string, unknown>;
  interpretation: string;
};

export type SdohOverview = {
  platform: string;
  cohort_size: number;
  analytics_layers: number;
  dashboard_modules: number;
  ready_outputs: string[];
  cards: Array<{ label: string; value: number }>;
  layer_index: Array<{ layer: number; module: string; answer: string }>;
};

export type SdohDashboardModule = {
  id: string;
  name: string;
  description: string;
};

export type SdohCohortPreview = {
  count: number;
  rows: Array<Record<string, unknown>>;
};

export type SdohFeatureFlags = {
  causal_module: boolean;
  counterfactual_simulator: boolean;
  policy_simulator: boolean;
  publication_suite: boolean;
  gis: boolean;
  survival: boolean;
};

export type SdohDatasetProfile = {
  dataset_id: string;
  rows: number;
  columns: string[];
  numeric_columns: string[];
  categorical_columns: string[];
  missing_report: Array<{ column: string; missing_count: number; missing_percent: number }>;
  preview: Array<Record<string, unknown>>;
};

export type SdohDashboardSummary = {
  projects: number;
  datasets: number;
  cohorts: number;
  studies: number;
  analysis_jobs: number;
  saved_outputs: number;
  modules: string[];
  feature_flags: SdohFeatureFlags;
};

export type SdohPublicationPack = {
  title: string;
  artifacts: Record<string, Array<Record<string, unknown>>>;
  interpretation: string;
};

function token() {
  if (typeof window === 'undefined') return null;
  try {
    return window.localStorage.getItem('auth_token') ?? window.sessionStorage.getItem('auth_token');
  } catch {
    return null;
  }
}

async function requestJson<T>(path: string, init?: RequestInit): Promise<T> {
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
    throw new Error(`SDOH API request failed (${response.status})`);
  }

  return response.json() as Promise<T>;
}

async function requestBlob(path: string, init?: RequestInit): Promise<{ blob: Blob; filename: string }> {
  const authToken = token();
  const response = await fetch(apiUrl(path), {
    ...init,
    cache: 'no-store',
    credentials: 'include',
    headers: {
      ...(authToken ? { Authorization: `Bearer ${authToken}` } : {}),
      ...(init?.headers ?? {}),
    },
  });

  if (!response.ok) {
    throw new Error(`SDOH file request failed (${response.status})`);
  }

  const disposition = response.headers.get('content-disposition') ?? '';
  const filename = disposition.match(/filename="([^"]+)"/)?.[1] ?? 'sdoh-export.csv';
  return { blob: await response.blob(), filename };
}

export function getSdohOverview() {
  return requestJson<SdohOverview>('/api/sdoh/dashboard/overview');
}

export function getSdohDashboardModules() {
  return requestJson<SdohDashboardModule[]>('/api/sdoh/dashboard/modules');
}

export function getSdohDashboardSummary() {
  return requestJson<SdohDashboardSummary>('/api/sdoh/dashboard/summary');
}

export function getSdohAnalyticsModules() {
  return requestJson<SdohAnalysisResponse[]>('/api/sdoh/analytics/modules');
}

export function getSdohDatasetProfile(datasetId = 'demo-sdoh') {
  return requestJson<SdohDatasetProfile>(`/api/sdoh/datasets/${encodeURIComponent(datasetId)}/profile`);
}

export function getSdohFeatureFlags() {
  return requestJson<SdohFeatureFlags>('/api/sdoh/feature-flags');
}

export function setSdohFeatureFlag(flag: 'causal' | 'counterfactual' | 'policy' | 'publication' | 'gis' | 'survival', value: boolean) {
  return requestJson<SdohFeatureFlags>(`/api/sdoh/feature-flags/${flag}/${value ? 'activate' : 'deactivate'}`, {
    method: 'POST',
    body: JSON.stringify({ value }),
  });
}

export function getSdohPublicationPack() {
  return requestJson<SdohPublicationPack>('/api/sdoh/publication/study-pack');
}

export function createSdohTable1() {
  return requestJson<Record<string, unknown>>('/api/sdoh/publication/table1', {
    method: 'POST',
    body: JSON.stringify({
      variables: ['age', 'income_level', 'insurance_status', 'housing_instability', 'food_insecurity'],
      group_by: 'readmitted_30d',
    }),
  });
}

export function createSdohRegressionTable() {
  return requestJson<Record<string, unknown>>('/api/sdoh/publication/regression-table', {
    method: 'POST',
    body: JSON.stringify({
      outcome: 'readmission',
      variables: ['income_level', 'education_level', 'housing_instability', 'transportation_barrier'],
    }),
  });
}

export function createSdohManuscriptSummary() {
  return requestJson<Record<string, unknown>>('/api/sdoh/publication/manuscript-summary', {
    method: 'POST',
    body: JSON.stringify({
      outcome: 'readmission',
      variables: ['housing instability', 'food insecurity', 'transportation access'],
    }),
  });
}

export function downloadSdohPublicationExport(format: 'csv' | 'xlsx' | 'pdf', kind = 'table1') {
  return requestBlob(`/api/sdoh/exports/result/download?format=${encodeURIComponent(format)}&kind=${encodeURIComponent(kind)}`);
}

export function runSdohPolicySimulation() {
  return requestJson<Record<string, unknown>>('/api/sdoh/causal/policy-simulation', {
    method: 'POST',
    body: JSON.stringify({
      policyName: 'Transportation navigation program',
      targetPopulation: 'high SDOH vulnerability cohort',
      baselineRate: 0.31,
      expectedEffect: 0.08,
      populationSize: 1200,
    }),
  });
}

export function runSdohCausalQuery(question: string) {
  return requestJson<Record<string, unknown>>('/api/sdoh/causal/query', {
    method: 'POST',
    body: JSON.stringify({ question }),
  });
}

export function querySdohAnalytics(query: string) {
  return requestJson<SdohAnalysisResponse>('/api/sdoh/analytics/query', {
    method: 'POST',
    body: JSON.stringify({ query }),
  });
}

export function previewSdohCohort(params: Record<string, string | boolean | number | undefined> = {}) {
  const query = new URLSearchParams();
  Object.entries(params).forEach(([key, value]) => {
    if (value !== undefined && value !== '') query.set(key, String(value));
  });
  const suffix = query.toString() ? `?${query}` : '';
  return requestJson<SdohCohortPreview>(`/api/sdoh/cohorts/preview${suffix}`);
}
