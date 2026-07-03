export type HandoffTarget =
  | 'data-management'
  | 'data-preparation'
  | 'research-studio'
  | 'analytics-ai'
  | 'outputs'
  | 'governance'
  | 'system';

const API_BASE = process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:4000';

async function request<T>(path: string, init?: RequestInit): Promise<T> {
  const res = await fetch(`${API_BASE}${path}`, {
    ...init,
    headers: {
      'Content-Type': 'application/json',
      ...(init?.headers || {}),
    },
    cache: 'no-store',
  });
  if (!res.ok) throw new Error(await res.text());
  return res.json();
}

export const workspaceOpsApi = {
  summary: () => request<any>('/api/workspace-ops/summary'),
  workspaces: () => request<any[]>('/api/workspace-ops/workspaces'),
  createWorkspace: (payload: any) => request<any>('/api/workspace-ops/workspaces', { method: 'POST', body: JSON.stringify(payload) }),
  handoffWorkspace: (id: string, target: HandoffTarget) => request<any>(`/api/workspace-ops/workspaces/${id}/handoff`, { method: 'POST', body: JSON.stringify({ target }) }),
  projects: () => request<any[]>('/api/workspace-ops/projects'),
  createProject: (payload: any) => request<any>('/api/workspace-ops/projects', { method: 'POST', body: JSON.stringify(payload) }),
  createMilestone: (id: string, payload: any) => request<any>(`/api/workspace-ops/projects/${id}/milestones`, { method: 'POST', body: JSON.stringify(payload) }),
  tasks: () => request<any[]>('/api/workspace-ops/tasks'),
  createTask: (payload: any) => request<any>('/api/workspace-ops/tasks', { method: 'POST', body: JSON.stringify(payload) }),
  updateTaskStatus: (id: string, status: string) => request<any>(`/api/workspace-ops/tasks/${id}/status`, { method: 'PATCH', body: JSON.stringify({ status }) }),
  pipelines: () => request<any[]>('/api/workspace-ops/pipelines'),
  pipelineAction: (id: string, action: 'pause' | 'resume' | 'retry' | 'cancel' | 'open') => request<any>(`/api/workspace-ops/pipelines/${id}/action`, { method: 'POST', body: JSON.stringify({ action }) }),
};
