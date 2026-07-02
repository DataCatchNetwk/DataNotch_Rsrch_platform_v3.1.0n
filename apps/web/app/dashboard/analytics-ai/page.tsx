import { StagePage } from '@/components/platform/stage-page';

export default function AnalyticsAiPage() {
  return (
    <StagePage
      active="analytics-ai"
      title="Analytics & AI"
      subtitle="Execute descriptive, inferential, ML/AI, survival, causal, explainability, network, geographic, and simulation analyses."
      nextLabel="Outputs"
      nextHref="/dashboard/outputs"
      metrics={[
        { label: 'Analysis Engines', value: 13 },
        { label: 'Jobs Ready', value: 22 },
        { label: 'Models Registered', value: 14 },
        { label: 'Best AUC', value: '0.89' },
      ]}
      worklistTitle="Analysis Recommendation Queue"
      worklist={[
        { question: 'What predicts readmission?', method: 'Logistic + RF + SHAP', output: 'OR table + ROC + SHAP' },
        { question: 'Time to readmission?', method: 'Kaplan-Meier + Cox', output: 'Survival curve + HR table' },
        { question: 'Policy intervention effect?', method: 'PSM + IPTW + Counterfactual', output: 'ATE/ATT + impact' },
      ]}
      primaryActions={[
        { title: 'Analysis Jobs', description: 'Queue, monitor, and manage job execution.', href: '/dashboard/analysis/jobs' },
        { title: 'SDOH Analytics Tab', description: 'Run advanced statistical and AI flows.', href: '/dashboard/sdoh?tab=analytics' },
        { title: 'Open Models', description: 'Review model catalog and AutoML artifacts.', href: '/dashboard/models' },
      ]}
      uniquePanel={
        <div className="grid gap-4 lg:grid-cols-4">
          <div className="rounded-3xl border bg-white p-6 shadow-sm">Descriptive and inferential analytics outputs</div>
          <div className="rounded-3xl border bg-white p-6 shadow-sm">Classification and explainability artifacts</div>
          <div className="rounded-3xl border bg-white p-6 shadow-sm">Survival and causal inference outputs</div>
          <div className="rounded-3xl border bg-white p-6 shadow-sm">Simulation and policy impact summaries</div>
        </div>
      }
    />
  );
}
