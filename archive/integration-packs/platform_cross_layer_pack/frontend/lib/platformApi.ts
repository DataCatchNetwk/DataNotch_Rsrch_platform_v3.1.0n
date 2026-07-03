export type PlatformStage =
  | 'WORKSPACE_INTAKE'
  | 'DATA_MANAGEMENT'
  | 'DATA_PREPARATION'
  | 'RESEARCH_STUDIO'
  | 'ANALYTICS_AI'
  | 'OUTPUTS';

const API_BASE = process.env.NEXT_PUBLIC_API_BASE_URL ?? 'http://localhost:8000';

async function request<T>(path: string, options?: RequestInit): Promise<T> {
  const res = await fetch(`${API_BASE}${path}`, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...(options?.headers ?? {}),
    },
    cache: 'no-store',
  });
  if (!res.ok) throw new Error(await res.text());
  return res.json();
}

export const platformApi = {
  overview: () => request('/api/platform/overview'),
  stage: (stage: PlatformStage) => request(`/api/platform/stages/${stage}`),
  handoff: (payload: any) => request('/api/platform/handoff', { method: 'POST', body: JSON.stringify(payload) }),
  audit: () => request('/api/governance/audit'),
  lineage: () => request('/api/governance/lineage'),
  jobs: () => request('/api/system/jobs'),
  notifications: () => request('/api/system/notifications'),
};
