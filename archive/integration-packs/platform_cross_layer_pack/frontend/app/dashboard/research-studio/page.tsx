import { StagePage } from '../../../components/platform/StagePage';

export default function ResearchStudioPage() {
  return <StagePage
    active="research-studio"
    title="Research Studio"
    subtitle="Convert prepared datasets into research questions, hypotheses, study designs, cohorts, variable sets, protocols, experiments, and collaborative workspaces."
    nextLabel="Analytics & AI"
    nextHref="/dashboard/analytics-ai"
    metrics={[{label:'Questions', value:18}, {label:'Hypotheses', value:12}, {label:'Cohorts', value:7}, {label:'Experiments', value:9}]}
    worklistTitle="Research Design Workbench"
    worklist={[{item:'Housing instability → readmission', type:'Hypothesis', status:'Ready for logistic regression'}, {item:'Food access survival study', type:'Study Design', status:'Needs time variable'}, {item:'Low-income diabetic cohort', type:'Cohort', status:'12,842 members'}]}
    primaryActions={[{title:'Build Research Question', description:'Define objective, outcome, exposure, population, and expected methods.', href:'/dashboard/research-studio/questions'}, {title:'Open Cohort Builder', description:'Filter prepared datasets into reusable study cohorts.', href:'/dashboard/research-studio/cohorts'}, {title:'Configure Experiment', description:'Package variables, cohorts, methods, and expected outputs for Analytics & AI.', href:'/dashboard/research-studio/experiments'}]}
    uniquePanel={<div className="rounded-3xl border bg-white p-6"><h2 className="text-xl font-bold">Study Readiness Reasoner</h2><p className="mt-2 text-slate-600">Checks whether the selected outcome, exposure, covariates, cohort size, missingness, and statistical assumptions are sufficient before handoff to Analytics & AI.</p></div>}
  />;
}
