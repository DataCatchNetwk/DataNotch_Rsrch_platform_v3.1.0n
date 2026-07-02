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

export type AnalysisResult = {
  metrics: Record<string, any>;
  tables: any[];
  visualizations: any[];
  interpretation: string;
};
