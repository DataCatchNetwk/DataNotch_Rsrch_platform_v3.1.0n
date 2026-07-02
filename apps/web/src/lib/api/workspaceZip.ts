import { apiRequest } from "@/src/lib/api/client";

export type WorkspaceFileNode = {
  id: string;
  workspaceId: string;
  archiveId: string | null;
  parentId: string | null;
  kind: "FOLDER" | "FILE" | "ARCHIVE";
  name: string;
  relativePath: string;
  storagePath: string;
  extension: string | null;
  sizeBytes: number;
  isDatasetCandidate: boolean;
  datasetId: string | null;
  createdAt: string;
  children: WorkspaceFileNode[];
};

export type WorkspaceZipUploadResult = {
  success: boolean;
  archiveId: string;
  status: "EXTRACTED";
  extractedFiles: number;
  datasetCandidates: number;
};

export type WorkspaceRegistryDataset = {
  id: string;
  workspaceId: string;
  sourceWorkspaceFileId: string | null;
  registeredDatasetId: string | null;
  name: string;
  description: string | null;
  stage: "RAW" | "CLEAN" | "HARMONIZED" | "FEATURES";
  status: "RAW_REGISTERED" | "PROFILING_READY" | "CLEANED" | "VALIDATED" | "READY_FOR_ANALYSIS";
  version: string;
  records: number;
  variables: number;
  storagePath: string | null;
  createdAt: string;
  updatedAt: string;
};

export async function uploadWorkspaceZip(workspaceId: string, file: File): Promise<WorkspaceZipUploadResult> {
  const form = new FormData();
  form.append("archive", file);
  return apiRequest<WorkspaceZipUploadResult>(`/workspace-zip/workspaces/${workspaceId}/upload-zip`, {
    method: "POST",
    json: form,
  });
}

export async function fetchWorkspaceFiles(workspaceId: string): Promise<WorkspaceFileNode[]> {
  const result = await apiRequest<{ success: boolean; tree: WorkspaceFileNode[] }>(
    `/workspace-zip/workspaces/${workspaceId}/files`,
  );
  return result.tree;
}

export async function registerWorkspaceFileDataset(workspaceId: string, fileId: string) {
  return apiRequest<{ success: boolean; dataset: { id: string }; registryRecord: { id: string } }>(
    `/workspace-zip/workspaces/${workspaceId}/files/${fileId}/register-raw`,
    {
      method: "POST",
    },
  );
}

export async function sendWorkspaceFileToPreparation(workspaceId: string, fileId: string, stage = "profiling") {
  return apiRequest<{
    success: boolean;
    workflowId: string;
    datasetId: string;
    next: string;
    currentStage: string;
    nextStage: string;
    status: string;
  }>(`/workspace-zip/workspaces/${workspaceId}/files/${fileId}/send-to-preparation`, {
    method: "POST",
    json: { stage },
  });
}

export async function fetchWorkspaceRegistryDatasets(workspaceId: string): Promise<WorkspaceRegistryDataset[]> {
  const result = await apiRequest<{ success: boolean; datasets: WorkspaceRegistryDataset[] }>(
    `/workspace-zip/workspaces/${workspaceId}/registry-datasets`,
  );
  return result.datasets;
}
