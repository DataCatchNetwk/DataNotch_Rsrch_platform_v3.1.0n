import { CreateOutputInput } from './outputs.types';

const now = () => new Date().toISOString();

function demoMetrics() {
  return {
    cohortSize: 12842,
    qualityScore: 94,
    auc: 0.87,
    topPredictor: 'Housing instability',
    publicationsReady: 6,
  };
}

function buildPayload(input: CreateOutputInput) {
  const metrics = demoMetrics();

  switch (input.outputType) {
    case 'dashboard':
      return {
        layout: 'research-command-center',
        cards: [
          { label: 'Cohort Size', value: metrics.cohortSize },
          { label: 'Quality Score', value: `${metrics.qualityScore}%` },
          { label: 'Model AUC', value: metrics.auc },
          { label: 'Top Predictor', value: metrics.topPredictor },
        ],
        charts: [
          { type: 'bar', title: 'SDOH factor burden', data: [
            { label: 'Housing', value: 92 },
            { label: 'Income', value: 78 },
            { label: 'Food access', value: 68 },
            { label: 'Insurance', value: 54 },
          ]},
          { type: 'line', title: 'Readmission risk trend', data: [
            { label: 'Jan', value: 21 },
            { label: 'Feb', value: 24 },
            { label: 'Mar', value: 19 },
            { label: 'Apr', value: 17 },
          ]},
        ],
      };

    case 'visualization':
      return {
        chartRecommendations: [
          'Coefficient plot',
          'SHAP feature importance',
          'Kaplan-Meier curve',
          'County choropleth',
          'Cohort funnel',
        ],
        primaryChart: {
          type: 'horizontal-bar',
          title: 'Feature importance',
          data: [
            { feature: 'Housing instability', score: 0.92 },
            { feature: 'Income level', score: 0.78 },
            { feature: 'Food access', score: 0.68 },
            { feature: 'Insurance type', score: 0.54 },
          ],
        },
      };

    case 'report':
      return {
        sections: ['Objective', 'Dataset', 'Methods', 'Results', 'Interpretation', 'Limitations'],
        tables: ['Table 1: Cohort characteristics', 'Table 2: Model results'],
        figures: ['Figure 1: SDOH burden', 'Figure 2: Risk distribution'],
      };

    case 'publication':
      return {
        journalPack: true,
        outputs: ['Table 1', 'Regression table', 'Forest plot', 'Methods text', 'Results text'],
        readiness: 'Needs reviewer approval',
      };

    case 'manuscript':
      return {
        title: input.title,
        abstract: 'This study examines social determinants associated with adverse health outcomes using a governed research data pipeline.',
        methods: 'We used harmonized SDOH, clinical, and outcome variables from the approved feature set.',
        results: 'Housing instability and income level were leading predictors of readmission risk.',
        discussion: 'Findings suggest targeted social support may reduce preventable utilization.',
      };

    case 'executive_summary':
      return {
        headline: 'Housing instability is the leading actionable SDOH predictor.',
        bullets: [
          'Readmission risk model achieved AUC 0.87.',
          'Housing instability ranked highest in feature importance.',
          'Policy simulation suggests targeted support can reduce risk.',
        ],
        recommendation: 'Prioritize housing support interventions in high-risk cohorts.',
      };

    case 'presentation':
      return {
        deck: [
          'Title',
          'Research question',
          'Dataset and cohort',
          'Methods',
          'Key findings',
          'Visual evidence',
          'Recommendations',
          'Next steps',
        ],
        slideCount: 8,
      };

    case 'data_export':
      return {
        exportFormats: ['CSV', 'XLSX', 'Parquet', 'JSON'],
        rows: metrics.cohortSize,
        columns: 124,
        deidentification: 'Enabled',
      };

    case 'model_export':
      return {
        modelFormats: ['ONNX', 'PKL', 'JSON metadata', 'Model card'],
        metrics: { auc: metrics.auc, calibration: 0.91 },
        explainability: ['SHAP summary', 'Feature importance'],
      };

    case 'api_output':
      return {
        endpoints: [
          { method: 'GET', path: '/api/outputs/:id' },
          { method: 'GET', path: '/api/outputs/:id/render' },
          { method: 'GET', path: '/api/outputs/:id/export' },
        ],
        schema: { id: 'string', type: input.outputType, payload: 'object' },
      };
  }
}

export class OutputsService {
  private assets: any[] = [];

  list(workspaceId?: string) {
    return workspaceId ? this.assets.filter(a => a.workspaceId === workspaceId) : this.assets;
  }

  create(input: CreateOutputInput) {
    const asset = {
      id: `out_${Date.now()}`,
      ...input,
      status: 'READY',
      summary: `${input.title} generated from ${input.analysisJobId || 'selected analysis results'}.`,
      renderPayload: buildPayload(input),
      lineagePayload: {
        from: 'Analytics & AI',
        to: 'Outputs',
        analysisJobId: input.analysisJobId,
        createdAt: now(),
      },
      createdAt: now(),
      updatedAt: now(),
    };
    this.assets.unshift(asset);
    return asset;
  }

  generateAll(workspaceId: string, analysisJobId?: string) {
    const types: CreateOutputInput['outputType'][] = [
      'dashboard','visualization','report','publication','manuscript',
      'executive_summary','presentation','data_export','model_export','api_output'
    ];
    return types.map(t => this.create({
      workspaceId,
      analysisJobId,
      outputType: t,
      title: t.replaceAll('_', ' ').replace(/\b\w/g, c => c.toUpperCase()),
    }));
  }

  export(id: string, format: string) {
    const asset = this.assets.find(a => a.id === id);
    if (!asset) throw new Error('Output not found');
    return {
      id: `exp_${Date.now()}`,
      outputAssetId: id,
      format,
      fileName: `${asset.title.toLowerCase().replaceAll(' ', '_')}.${format.toLowerCase()}`,
      mimeType: format === 'PDF' ? 'application/pdf' : 'application/octet-stream',
      status: 'READY',
    };
  }
}
export const outputsService = new OutputsService();
