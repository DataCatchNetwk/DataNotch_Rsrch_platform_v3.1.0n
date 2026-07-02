export type WorkspaceSummary = {
  workspaces: number;
  members: number;
  datasets: number;
  files: number;
  archives: number;
  candidates: number;
};

export type WorkspaceCard = {
  id: string;
  name: string;
  description: string;
  owner: string;
  status: string;
  members: number;
  datasets: number;
  files: number;
  candidates: number;
  updatedAt: string;
};

export type WorkspaceFile = {
  id: string;
  workspaceId: string;
  name: string;
  kind: "folder" | "file" | "archive";
  type: string;
  size: number;
  path: string;
  parentId?: string | null;
  datasetCandidate: boolean;
  createdAt: string;
};

export type DatasetCandidate = {
  id: string;
  workspaceId: string;
  fileId: string;
  name: string;
  format: string;
  rowsEstimate: number;
  columnsEstimate: number;
  confidence: number;
  status: "detected" | "registered" | "ignored";
};

const API_BASE = process.env.NEXT_PUBLIC_API_BASE_URL ?? "http://localhost:4000";

async function request<T>(path: string, init?: RequestInit): Promise<T> {
  const res = await fetch(`${API_BASE}${path}`, {
    ...init,
    headers: {
      ...(init?.headers ?? {}),
    },
  });

  if (!res.ok) {
    const text = await res.text();
    throw new Error(text || `Request failed: ${res.status}`);
  }

  return res.json();
}

export const workspaceIntakeApi = {
  summary() {
    return request<WorkspaceSummary>("/api/workspace-intake/summary");
  },

  workspaces() {
    return request<WorkspaceCard[]>("/api/workspace-intake/workspaces");
  },

  createWorkspace(payload: { name: string; description: string }) {
    return request<WorkspaceCard>("/api/workspace-intake/workspaces", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
  },

  async upload(workspaceId: string, files: FileList | File[]) {
    const form = new FormData();
    Array.from(files).forEach((file) => form.append("files", file));
    return request<{ uploaded: WorkspaceFile[]; candidates: DatasetCandidate[] }>(
      `/api/workspace-intake/workspaces/${workspaceId}/upload`,
      { method: "POST", body: form },
    );
  },

  files(workspaceId: string) {
    return request<WorkspaceFile[]>(`/api/workspace-intake/workspaces/${workspaceId}/files`);
  },

  candidates(workspaceId: string) {
    return request<DatasetCandidate[]>(`/api/workspace-intake/workspaces/${workspaceId}/candidates`);
  },

  registerDataset(workspaceId: string, candidateId: string) {
    return request<{ datasetId: string; nextUrl: string }>(
      `/api/workspace-intake/workspaces/${workspaceId}/register-dataset`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ candidateId }),
      },
    );
  },

  createProject(workspaceId: string, payload: { title: string; objective: string }) {
    return request(`/api/workspace-intake/workspaces/${workspaceId}/projects`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
  },

  createTask(workspaceId: string, payload: { title: string; stage: string; assignee?: string }) {
    return request(`/api/workspace-intake/workspaces/${workspaceId}/tasks`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
  },

  assignTeam(workspaceId: string, payload: { email: string; role: string }) {
    return request(`/api/workspace-intake/workspaces/${workspaceId}/team`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
  },

  handoff(workspaceId: string, target: string) {
    return request<{ target: string; nextUrl: string }>(
      `/api/workspace-intake/workspaces/${workspaceId}/handoff`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ target }),
      },
    );
  },
};
