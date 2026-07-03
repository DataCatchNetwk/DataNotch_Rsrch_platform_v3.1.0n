export type PrepStage =
  | 'profiling'
  | 'cleaning'
  | 'harmonization'
  | 'features'
  | 'quality'
  | 'versioning';

export type DatasetColumnProfile = {
  name: string;
  type: 'numeric' | 'categorical' | 'date' | 'boolean' | 'text';
  missingCount: number;
  missingRate: number;
  uniqueCount: number;
  uniqueRate: number;
  mean?: number;
  median?: number;
  min?: number;
  max?: number;
  std?: number;
  topValues?: Array<{ value: string; count: number }>;
};

export type PreparationDataset = {
  id: string;
  name: string;
  rows: Array<Record<string, unknown>>;
  sourceStage?: string;
};

export type StageResult = {
  jobId: string;
  datasetId: string;
  stage: PrepStage;
  status: 'READY' | 'RUNNING' | 'SUCCEEDED' | 'FAILED';
  metrics: Record<string, unknown>;
  outputs: Record<string, unknown>;
  nextStage?: PrepStage | 'research-studio';
};
