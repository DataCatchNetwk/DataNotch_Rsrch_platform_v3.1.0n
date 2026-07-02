const API = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000';

async function request(path: string, options?: RequestInit) {
  const res = await fetch(`${API}/api/research-studio${path}`, {
    headers: { 'Content-Type': 'application/json', ...(options?.headers || {}) },
    ...options,
  });
  if (!res.ok) throw new Error(`Research Studio API failed: ${res.status}`);
  return res.json();
}

export const researchStudioApi = {
  intakePreparedDataset: (payload: any) => request('/intake/from-prepared-dataset', { method: 'POST', body: JSON.stringify(payload) }),
  listQuestions: () => request('/questions'),
  createQuestion: (payload: any) => request('/questions', { method: 'POST', body: JSON.stringify(payload) }),
  recommendStudyDesign: (payload: any) => request('/study-design/recommend', { method: 'POST', body: JSON.stringify(payload) }),
  createStudyDesign: (payload: any) => request('/study-design', { method: 'POST', body: JSON.stringify(payload) }),
  estimateCohort: (payload: any) => request('/cohorts/estimate', { method: 'POST', body: JSON.stringify(payload) }),
  createCohort: (payload: any) => request('/cohorts', { method: 'POST', body: JSON.stringify(payload) }),
  saveVariables: (payload: any) => request('/variables', { method: 'POST', body: JSON.stringify(payload) }),
  generateProtocol: (payload: any) => request('/protocols/generate', { method: 'POST', body: JSON.stringify(payload) }),
  saveProtocol: (payload: any) => request('/protocols', { method: 'POST', body: JSON.stringify(payload) }),
  createExperiment: (payload: any) => request('/experiments', { method: 'POST', body: JSON.stringify(payload) }),
  sendExperimentToAnalytics: (id: string) => request(`/experiments/${id}/send-to-analytics`, { method: 'POST' }),
};
