export type WorkspaceFileNode = {
  id: string;
  workspaceId: string;
  archiveId?: string | null;
  parentId?: string | null;
  kind: 'FOLDER' | 'FILE' | 'ARCHIVE';
  name: string;
  relativePath: string;
  storagePath: string;
  extension?: string | null;
  sizeBytes: number;
  isDatasetCandidate: boolean;
  datasetId?: string | null;
  children?: WorkspaceFileNode[];
};

export type ZipIngestionResult = {
  archiveId: string;
  status: 'EXTRACTED' | 'FAILED';
  extractedFiles: number;
  datasetCandidates: number;
};
