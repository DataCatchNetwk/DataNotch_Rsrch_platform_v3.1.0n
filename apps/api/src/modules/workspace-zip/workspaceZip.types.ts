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

export type WorkspaceZipIngestResult = {
  archiveId: string;
  status: "EXTRACTED";
  extractedFiles: number;
  datasetCandidates: number;
};
