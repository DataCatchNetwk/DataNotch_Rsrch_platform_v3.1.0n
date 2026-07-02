import { StagePage } from '../../../components/platform/StagePage';

export default function AnalyticsAiPage() {
  return <StagePage
    active="analytics-ai"
    title="Analytics & AI"
    subtitle="Run descriptive/inferential statistics, machine learning, AI, explainability, knowledge graph, causal, survival, time series, network, geographic, digital twin, and counterfactual analysis."
    nextLabel="Outputs"
    nextHref="/dashboard/outputs"
    metrics={[{label:'Analysis engines', value:13}, {label:'Jobs ready', value:22}, {label:'Models registered', value:14}, {label:'Best AUC', value:'0.89'}]}
    worklistTitle="Analysis Recommendation Queue"
    worklist={[{question:'What predicts readmission?', method:'Logistic + RF + SHAP', output:'OR table + ROC + SHAP'}, {question:'Time to readmission?', method:'Kaplan-Meier + Cox', output:'Survival curve + HR table'}, {question:'Policy intervention effect?', method:'PSM + IPTW + Counterfactual', output:'ATE/ATT + policy impact'}]}
    primaryActions={[{title:'Run Statistical Analysis', description:'Descriptive, inferential, regression, SEM, survival.', href:'/dashboard/analytics-ai/statistics'}, {title:'Run ML/AI Pipeline', description:'AutoML, model registry, explainability, digital twin.', href:'/dashboard/analytics-ai/ml'}, {title:'Run Causal Simulation', description:'PSM, IPTW, DiD, causal forest, counterfactual policy lab.', href:'/dashboard/analytics-ai/causal'}]}
    uniquePanel={<div className="grid lg:grid-cols-4 gap-4"><div className="rounded-3xl border bg-white p-6">Descriptive → tables + histograms</div><div className="rounded-3xl border bg-white p-6">Classification → ROC + confusion matrix</div><div className="rounded-3xl border bg-white p-6">Survival → KM + Cox</div><div className="rounded-3xl border bg-white p-6">Causal → ATE + counterfactual</div></div>}
  />;
}
