export type PreparedDatasetInput = {
  workspaceId: string;
  datasetId: string;
  datasetName: string;
  variables: Array<{ name: string; type: string; role?: string; missingPct?: number }>;
  qualityScore?: number;
};

export type CohortRule = { field: string; operator: 'eq'|'neq'|'gt'|'gte'|'lt'|'lte'|'in'|'contains'; value: any };

const sdohKeywords = ['housing', 'income', 'food', 'transportation', 'education', 'insurance', 'poverty'];

export function inferResearchQuestions(input: PreparedDatasetInput) {
  const names = input.variables.map(v => v.name.toLowerCase());
  const outcomes = names.filter(n => /readmission|mortality|cost|length_of_stay|risk|outcome/.test(n));
  const exposures = names.filter(n => sdohKeywords.some(k => n.includes(k)));
  return outcomes.slice(0, 3).flatMap(outcome =>
    exposures.slice(0, 4).map(exposure => ({
      question: `How is ${exposure} associated with ${outcome} in ${input.datasetName}?`,
      outcome,
      exposure,
      population: input.datasetName,
      rationale: 'Auto-generated from prepared dataset variables and SDOH-domain terms.',
      status: 'SUGGESTED'
    }))
  );
}

export function recommendStudyDesign(question: { outcome?: string; exposure?: string }) {
  const outcome = question.outcome || '';
  if (/time|survival|days|followup/.test(outcome)) return 'Longitudinal Cohort';
  if (/readmission|mortality|risk/.test(outcome)) return 'Retrospective Cohort';
  if (/cost|utilization/.test(outcome)) return 'Cross-sectional / Cost Outcome Study';
  return 'Observational Cohort';
}

export function estimateCohortSize(totalRows: number, rules: CohortRule[]) {
  let multiplier = 1;
  for (const rule of rules) {
    if (rule.operator === 'eq') multiplier *= 0.55;
    if (rule.operator === 'in') multiplier *= 0.7;
    if (['gt','gte','lt','lte'].includes(rule.operator)) multiplier *= 0.65;
    if (rule.operator === 'contains') multiplier *= 0.5;
  }
  return Math.max(1, Math.round(totalRows * multiplier));
}

export function recommendAnalyses(payload: { outcome: string; predictors: string[]; cohortN: number }) {
  const outcome = payload.outcome.toLowerCase();
  const analyses: string[] = ['Descriptive Statistics'];
  if (/readmission|mortality|yes|no|binary|risk/.test(outcome)) {
    analyses.push('Logistic Regression', 'Random Forest', 'XGBoost', 'SHAP Explainability');
  }
  if (/time|survival|followup|days/.test(outcome)) {
    analyses.push('Kaplan-Meier', 'Cox Proportional Hazards');
  }
  if (payload.predictors.length >= 4) analyses.push('Clustering & Segmentation');
  if (payload.cohortN > 1000) analyses.push('Causal Inference', 'Health Equity Analysis');
  return analyses;
}

export function buildProtocolSummary(input: any) {
  return {
    methods: `This study uses a ${input.designType || 'retrospective observational'} design to evaluate ${input.exposure || 'SDOH factors'} in relation to ${input.outcome || 'clinical outcomes'}.`,
    inclusion: input.inclusion || [{ field: 'age', operator: 'gte', value: 18 }],
    exclusion: input.exclusion || [{ field: 'missing_outcome', operator: 'eq', value: true }],
    analysisPlan: recommendAnalyses({ outcome: input.outcome || 'readmission_30d', predictors: input.predictors || [], cohortN: input.cohortN || 1000 })
  };
}
