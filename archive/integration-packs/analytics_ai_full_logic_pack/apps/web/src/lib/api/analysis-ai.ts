export type AnalysisModule =
  | 'descriptive'
  | 'inferential'
  | 'machine_learning'
  | 'artificial_intelligence'
  | 'explainability'
  | 'knowledge_graph'
  | 'causal'
  | 'survival'
  | 'time_series'
  | 'network'
  | 'geographic'
  | 'digital_twin'
  | 'counterfactual';

export type AnalysisRunRequest = {
  workspaceId: string;
  researchQuestionId?: string;
  experimentId?: string;
  datasetId: string;
  featureSetId?: string;
  module: AnalysisModule;
  method: string;
  outcome?: string;
  predictors?: string[];
  groupBy?: string;
  timeColumn?: string;
  eventColumn?: string;
  treatment?: string;
  geographyColumn?: string;
};

const API_BASE = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:4000';

async function api<T>(path: string, init?: RequestInit): Promise<T> {
  const res = await fetch(`${API_BASE}${path}`, {
    ...init,
    headers: {
      'Content-Type': 'application/json',
      ...(init?.headers ?? {}),
    },
    credentials: 'include',
  });
  if (!res.ok) throw new Error(await res.text());
  return res.json();
}

export const analysisAiApi = {
  overview(workspaceId: string) {
    return api(`/api/analysis-ai/overview?workspaceId=${workspaceId}`);
  },
  modules() {
    return api('/api/analysis-ai/modules');
  },
  recommend(payload: Partial<AnalysisRunRequest>) {
    return api('/api/analysis-ai/recommend', {
      method: 'POST',
      body: JSON.stringify(payload),
    });
  },
  run(payload: AnalysisRunRequest) {
    return api('/api/analysis-ai/run', {
      method: 'POST',
      body: JSON.stringify(payload),
    });
  },
  job(jobId: string) {
    return api(`/api/analysis-ai/jobs/${jobId}`);
  },
  results(jobId: string) {
    return api(`/api/analysis-ai/jobs/${jobId}/results`);
  },
  handoff(jobId: string, target: 'outputs' | 'visualization' | 'publication' | 'reports') {
    return api(`/api/analysis-ai/jobs/${jobId}/handoff`, {
      method: 'POST',
      body: JSON.stringify({ target }),
    });
  },
};
