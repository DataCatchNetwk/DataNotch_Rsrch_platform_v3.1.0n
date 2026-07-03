export type OutputType =
  | 'dashboard'
  | 'visualization'
  | 'report'
  | 'publication'
  | 'manuscript'
  | 'executive_summary'
  | 'presentation'
  | 'data_export'
  | 'model_export'
  | 'api_output';

export type CreateOutputInput = {
  workspaceId: string;
  projectId?: string;
  studyId?: string;
  analysisJobId?: string;
  outputType: OutputType;
  title: string;
  format?: string;
  createdBy?: string;
};
