import { demoRows } from './sample-data';
import { AnalysisRunRequest, AnalysisResult } from './types';
import {
  runAIReasoner, runCausal, runCounterfactual, runDescriptive, runDigitalTwin,
  runExplainability, runGeographic, runInferential, runKnowledgeGraph,
  runMachineLearning, runNetwork, runSurvival, runTimeSeries
} from './engines';

const jobs = new Map<string, any>();
const results = new Map<string, any>();

export class AnalysisAIService {
  async overview(workspaceId: string) {
    return {
      workspaceId,
      certifiedFeatureSets: 12,
      availableMethods: 41,
      jobsCompleted: 186,
      outputHandoffs: 73,
      pipeline: ['Research Studio', 'Analytics & AI', 'Outputs'],
    };
  }

  modules() {
    return [
      'descriptive', 'inferential', 'machine_learning', 'artificial_intelligence',
      'explainability', 'knowledge_graph', 'causal', 'survival', 'time_series',
      'network', 'geographic', 'digital_twin', 'counterfactual'
    ];
  }

  async recommend(body: Partial<AnalysisRunRequest>) {
    const outcome = body.outcome ?? 'readmission_30d';
    const recommendations = [
      { module: 'descriptive', method: 'summary_table', reason: 'Verify cohort quality and variable distributions first.' },
      { module: 'machine_learning', method: 'logistic_regression', reason: `Predict binary outcome ${outcome}.` },
      { module: 'explainability', method: 'shap_summary', reason: 'Explain strongest drivers for publication.' },
      { module: 'causal', method: 'propensity_score', reason: 'Estimate intervention effect when treatment is available.' },
      { module: 'survival', method: 'kaplan_meier', reason: 'Use when follow-up time and event columns exist.' },
    ];
    return { recommendations };
  }

  async run(req: AnalysisRunRequest) {
    const jobId = `aai_${Date.now()}`;
    const job = {
      id: jobId,
      ...req,
      status: 'SUCCEEDED',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    jobs.set(jobId, job);

    const rows = demoRows();
    let result: AnalysisResult;

    switch (req.module) {
      case 'descriptive': result = runDescriptive(rows, req); break;
      case 'inferential': result = runInferential(rows, req); break;
      case 'machine_learning': result = runMachineLearning(rows, req); break;
      case 'artificial_intelligence': result = runAIReasoner(rows, req); break;
      case 'explainability': result = runExplainability(rows, req); break;
      case 'knowledge_graph': result = runKnowledgeGraph(rows, req); break;
      case 'causal': result = runCausal(rows, req); break;
      case 'survival': result = runSurvival(rows, req); break;
      case 'time_series': result = runTimeSeries(rows, req); break;
      case 'network': result = runNetwork(rows, req); break;
      case 'geographic': result = runGeographic(rows, req); break;
      case 'digital_twin': result = runDigitalTwin(rows, req); break;
      case 'counterfactual': result = runCounterfactual(rows, req); break;
      default: result = runDescriptive(rows, req);
    }

    const stored = {
      id: `res_${jobId}`,
      jobId,
      ...result,
      outputReady: true,
      createdAt: new Date().toISOString(),
    };
    results.set(jobId, stored);

    return { job, result: stored, next: ['Analysis Results', 'Visualization Studio', 'Publication Reports', 'Publication Center', 'Presentation Builder'] };
  }

  async getJob(jobId: string) {
    return jobs.get(jobId) ?? { id: jobId, status: 'NOT_FOUND' };
  }

  async getResults(jobId: string) {
    return results.get(jobId) ?? { jobId, status: 'NO_RESULTS' };
  }

  async handoff(jobId: string, target: string) {
    const result = results.get(jobId);
    if (!result) return { status: 'NO_RESULTS', jobId };
    return {
      id: `handoff_${Date.now()}`,
      jobId,
      target,
      status: 'READY',
      payload: {
        metrics: result.metrics,
        tables: result.tables,
        visualizations: result.visualizations,
        interpretation: result.interpretation,
      },
      nextRoute: target === 'publication' ? '/dashboard/publication' : '/dashboard/results',
    };
  }
}
